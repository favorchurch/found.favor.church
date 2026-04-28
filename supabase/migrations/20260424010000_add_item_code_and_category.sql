-- 1. Category column (enum-like text + CHECK)
ALTER TABLE public.found_items
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'others'
    CHECK (category IN (
      'cash_wallet','clothing','documents_books',
      'electronics','jewelry','tumblers_bottles','others'
    ));

-- 2. Item code column (nullable first, backfill, then constrain)
ALTER TABLE public.found_items
  ADD COLUMN IF NOT EXISTS item_code text;

-- 3. Backfill existing rows
WITH numbered AS (
  SELECT id,
    CASE category
      WHEN 'cash_wallet' THEN 'CSH'
      WHEN 'clothing' THEN 'CLO'
      WHEN 'documents_books' THEN 'DOC'
      WHEN 'electronics' THEN 'ELE'
      WHEN 'jewelry' THEN 'JEW'
      WHEN 'tumblers_bottles' THEN 'TUM'
      ELSE 'OTH'
    END AS prefix,
    to_char(date_found, 'YYMMDD') AS datepart,
    ROW_NUMBER() OVER (
      PARTITION BY category, date_found
      ORDER BY created_at, id
    ) AS seq
  FROM public.found_items
  WHERE item_code IS NULL
)
UPDATE public.found_items fi
SET item_code = n.prefix || '-' || n.datepart || '-' || LPAD(n.seq::text, 3, '0')
FROM numbered n
WHERE fi.id = n.id;

-- 4. Uniqueness + not null
ALTER TABLE public.found_items
  ADD CONSTRAINT found_items_item_code_key UNIQUE (item_code);
ALTER TABLE public.found_items
  ALTER COLUMN item_code SET NOT NULL;

-- 5. Trigger function + trigger for new inserts
CREATE OR REPLACE FUNCTION public.generate_found_item_code()
RETURNS trigger AS $$
DECLARE
  prefix text;
  datepart text;
  next_seq int;
BEGIN
  IF NEW.item_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  prefix := CASE NEW.category
    WHEN 'cash_wallet' THEN 'CSH'
    WHEN 'clothing' THEN 'CLO'
    WHEN 'documents_books' THEN 'DOC'
    WHEN 'electronics' THEN 'ELE'
    WHEN 'jewelry' THEN 'JEW'
    WHEN 'tumblers_bottles' THEN 'TUM'
    ELSE 'OTH'
  END;

  datepart := to_char(NEW.date_found, 'YYMMDD');

  -- Advisory lock keyed on a stable hash of (prefix, datepart) avoids race
  -- condition where two concurrent inserts pick the same sequence number.
  PERFORM pg_advisory_xact_lock(hashtext(prefix || '-' || datepart));

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(item_code FROM '[0-9]+$') AS int)
  ), 0) + 1
  INTO next_seq
  FROM public.found_items
  WHERE item_code LIKE prefix || '-' || datepart || '-%';

  NEW.item_code := prefix || '-' || datepart || '-' || LPAD(next_seq::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_found_item_code ON public.found_items;
CREATE TRIGGER set_found_item_code
BEFORE INSERT ON public.found_items
FOR EACH ROW EXECUTE FUNCTION public.generate_found_item_code();
