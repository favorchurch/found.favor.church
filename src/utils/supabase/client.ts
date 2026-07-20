/**
 * @file client.ts
 * @description Supabase client helper for browser/client-side use.
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates and returns a Supabase client configured for execution in the browser.
 * Safely handles missing credentials during build/prerendering by returning a placeholder.
 * 
 * @returns An initialized Supabase browser client instance
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    // During build/prerendering, these might be missing.
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  )
}
