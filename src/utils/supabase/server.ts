/**
 * @file server.ts
 * @description Anonymous Supabase client for public server-side queries. Admin
 * data access goes through getAdminClient in ./admin.ts after requireAdmin.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates the anon-key client used by public pages. Missing credentials (for
 * example during a build) fall back to a placeholder so imports never throw.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createSupabaseClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
