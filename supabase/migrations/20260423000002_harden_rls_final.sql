-- Make is_admin check even more robust
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check email claim in JWT, ensuring it ends with exactly @favor.church
  -- We use split_part to get the domain part and compare it
  RETURN split_part(auth.jwt() ->> 'email', '@', 2) = 'favor.church';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Ensure RLS is active
ALTER TABLE public.found_items ENABLE ROW LEVEL SECURITY;

-- Reset policies to ensure clean state
DROP POLICY IF EXISTS "Anyone can read public found_items" ON public.found_items;
DROP POLICY IF EXISTS "Public can read public found_items" ON public.found_items;
DROP POLICY IF EXISTS "Admins can do everything on found_items" ON public.found_items;

-- 1. Anyone (even not logged in) can see public non-archived items
CREATE POLICY "Public items are visible to all"
  ON public.found_items FOR SELECT
  TO public
  USING (is_public = true AND archived_at IS NULL);

-- 2. Authenticated admins can do everything
CREATE POLICY "Admins have full access"
  ON public.found_items FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Update storage policies
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;

CREATE POLICY "Storage is public for reading"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'item-images');

CREATE POLICY "Storage is admin-only for writes"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'item-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'item-images' AND public.is_admin());
