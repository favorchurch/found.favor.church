-- Add audit trail columns to found_items
ALTER TABLE public.found_items 
  ADD COLUMN created_by uuid REFERENCES auth.users(id),
  ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Helper function to check if the current user is an admin
-- Only allows users with @favor.church email domain
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') ILIKE '%@favor.church';
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
