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
