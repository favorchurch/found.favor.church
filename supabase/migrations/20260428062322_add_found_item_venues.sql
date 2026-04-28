-- 1. Create venues table
CREATE TABLE IF NOT EXISTS public.found_item_venues (
  slug text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.found_item_venues ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.found_item_venues;
CREATE POLICY "Venues are viewable by everyone" ON public.found_item_venues
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage venues" ON public.found_item_venues;
CREATE POLICY "Admins can manage venues" ON public.found_item_venues
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Seed current venues
INSERT INTO public.found_item_venues (slug, name) VALUES
  ('ynares', 'Ynares'),
  ('studio', 'Studio'),
  ('metrotent', 'Metrotent')
ON CONFLICT (slug) DO NOTHING;

-- 5. Update found_items table
ALTER TABLE public.found_items
  ADD COLUMN IF NOT EXISTS venue text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'found_items_venue_fkey') THEN
    ALTER TABLE public.found_items
      ADD CONSTRAINT found_items_venue_fkey
      FOREIGN KEY (venue) REFERENCES public.found_item_venues(slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS found_items_venue_idx ON public.found_items(venue);

-- 6. Backfill structured venues from the existing free-text location detail
UPDATE public.found_items
SET venue = CASE
  WHEN location ILIKE '%ynares%' THEN 'ynares'
  WHEN location ILIKE '%studio%' THEN 'studio'
  WHEN location ILIKE '%metrotent%' THEN 'metrotent'
  ELSE venue
END
WHERE venue IS NULL
  AND location IS NOT NULL
  AND (
    location ILIKE '%ynares%'
    OR location ILIKE '%studio%'
    OR location ILIKE '%metrotent%'
  );
