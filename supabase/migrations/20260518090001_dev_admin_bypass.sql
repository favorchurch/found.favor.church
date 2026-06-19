-- Update is_admin() to recognize service_role as admin for server component queries during development bypass

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  v_role text;
  v_email text;
BEGIN
  v_role := auth.jwt() ->> 'role';
  IF v_role = 'service_role' THEN
    RETURN true;
  END IF;

  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  RETURN split_part(v_email, '@', 2) = 'favor.church';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION public.search_admin_catalog_items(text, text, text[], date, date, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_catalog_item_counts_by_date(date, date) TO service_role;
