-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.found_item_categories (
  slug text PRIMARY KEY,
  name text NOT NULL,
  prefix text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.found_item_categories ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.found_item_categories;
CREATE POLICY "Categories are viewable by everyone" ON public.found_item_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.found_item_categories;
CREATE POLICY "Admins can manage categories" ON public.found_item_categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Seed current categories
INSERT INTO public.found_item_categories (slug, name, prefix) VALUES
  ('cash_wallet', 'Cash & Wallet', 'CSH'),
  ('clothing', 'Clothing, Apparel & Accessories', 'CLO'),
  ('documents_books', 'Documents, Notebooks & Books', 'DOC'),
  ('electronics', 'Electronics & Gadget Accessories', 'ELE'),
  ('jewelry', 'Jewelry', 'JEW'),
  ('tumblers_bottles', 'Tumblers & Water Bottles', 'TUM'),
  ('others', 'Others', 'OTH')
ON CONFLICT (slug) DO NOTHING;

-- 5. Update found_items table
-- First, drop the old check constraint
ALTER TABLE public.found_items DROP CONSTRAINT IF EXISTS found_items_category_check;

-- Add foreign key constraint
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'found_items_category_fkey') THEN
    ALTER TABLE public.found_items
      ADD CONSTRAINT found_items_category_fkey
      FOREIGN KEY (category) REFERENCES public.found_item_categories(slug);
  END IF;
END $$;

-- 6. Update generate_found_item_code function to look up prefix
CREATE OR REPLACE FUNCTION public.generate_found_item_code()
RETURNS trigger AS $$
DECLARE
  v_prefix text;
  v_datepart text;
  v_next_seq int;
BEGIN
  IF NEW.item_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Look up prefix from categories table
  SELECT prefix INTO v_prefix
  FROM public.found_item_categories
  WHERE slug = NEW.category;

  -- Fallback if category not found (shouldn't happen due to FK)
  IF v_prefix IS NULL THEN
    v_prefix := 'OTH';
  END IF;

  v_datepart := to_char(NEW.date_found, 'YYMMDD');

  -- Advisory lock keyed on a stable hash of (prefix, datepart) avoids race
  PERFORM pg_advisory_xact_lock(hashtext(v_prefix || '-' || v_datepart));

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(item_code FROM '[0-9]+$') AS int)
  ), 0) + 1
  INTO v_next_seq
  FROM public.found_items
  WHERE item_code LIKE v_prefix || '-' || v_datepart || '-%';

  NEW.item_code := v_prefix || '-' || v_datepart || '-' || LPAD(v_next_seq::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
