-- Add audit trail columns to found_items
ALTER TABLE public.found_items 
  ADD COLUMN created_by uuid REFERENCES auth.users(id),
  ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Create admins table for RLS checks
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on admins table (only admins can read/write)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for found_items to restrict to admins
DROP POLICY IF EXISTS "Admins can do everything on found_items" ON public.found_items;

CREATE POLICY "Admins can do everything on found_items"
  ON public.found_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Update storage policies to restrict to admins
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;

CREATE POLICY "Admins can upload images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'item-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'item-images' AND public.is_admin());

-- Populate admins table with initial list if needed
-- (This would typically be done via a seed or manual entry, 
-- but we can add a comment here)
-- INSERT INTO public.admins (email) VALUES ('rico@favor.church');
