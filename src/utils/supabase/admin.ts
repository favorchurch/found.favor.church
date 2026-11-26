import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, type AdminUser } from "@/lib/auth/admin";

/**
 * Returns a service-role Supabase client, created only after requireAdmin
 * passes. Service-role access never leaves the server: the key has no
 * NEXT_PUBLIC_ name and this module is server-only.
 */
export async function getAdminClient(options: { redirect?: boolean } = {}) {
  const admin: AdminUser = await requireAdmin(options);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase admin access is not configured");
  }
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { admin, supabase };
}
