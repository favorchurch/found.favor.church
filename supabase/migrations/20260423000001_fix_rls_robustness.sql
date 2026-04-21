-- Improve is_admin function to be more robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  user_email text;
BEGIN
  -- Get email from JWT claims
  user_email := auth.jwt() ->> 'email';
  
  -- Check if email exists and ends with @favor.church
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN user_email ILIKE '%@favor.church';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Update RLS policies for found_items
-- 1. Public (anyone) can read public items
DROP POLICY IF EXISTS "Public can read public found_items" ON public.found_items;
CREATE POLICY "Anyone can read public found_items"
  ON public.found_items FOR SELECT
  TO public
  USING (is_public = true AND archived_at IS NULL);

-- 2. Admins can do everything
DROP POLICY IF EXISTS "Admins can do everything on found_items" ON public.found_items;
CREATE POLICY "Admins can do everything on found_items"
  ON public.found_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Storage policies
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-images');

DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
CREATE POLICY "Admins can manage images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'item-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'item-images' AND public.is_admin());
