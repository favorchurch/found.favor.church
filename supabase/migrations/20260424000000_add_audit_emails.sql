-- Add audit email columns to found_items
ALTER TABLE public.found_items 
  ADD COLUMN IF NOT EXISTS created_by_email text,
  ADD COLUMN IF NOT EXISTS updated_by_email text;
