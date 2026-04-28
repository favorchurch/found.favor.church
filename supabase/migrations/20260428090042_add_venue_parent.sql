-- 1. Add parent_slug + display_order to found_item_venues
ALTER TABLE public.found_item_venues
  ADD COLUMN IF NOT EXISTS parent_slug text NULL,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- Named FK so PostgREST embedding can disambiguate the self-reference reliably.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'found_item_venues_parent_slug_fkey'
  ) THEN
    ALTER TABLE public.found_item_venues
      ADD CONSTRAINT found_item_venues_parent_slug_fkey
      FOREIGN KEY (parent_slug)
      REFERENCES public.found_item_venues(slug)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Prevent self-parenting (one-level depth is enforced in the upsert action)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'found_item_venues_no_self_parent'
  ) THEN
    ALTER TABLE public.found_item_venues
      ADD CONSTRAINT found_item_venues_no_self_parent
      CHECK (parent_slug IS NULL OR parent_slug <> slug);
  END IF;
END $$;

-- 3. Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_found_item_venues_parent_slug
  ON public.found_item_venues(parent_slug);

-- 4. Backfill display_order for the seeded top-level venues
UPDATE public.found_item_venues SET display_order = 0 WHERE slug = 'ynares';
UPDATE public.found_item_venues SET display_order = 1 WHERE slug = 'studio';
UPDATE public.found_item_venues SET display_order = 2 WHERE slug = 'metrotent';
