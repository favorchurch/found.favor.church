-- Add columns for claiming and disposing an item
ALTER TABLE public.found_items 
  ADD COLUMN claimed_date timestamp with time zone,
  ADD COLUMN claimed_by text,
  ADD COLUMN disposed_date timestamp with time zone,
  ADD COLUMN disposed_by text;
