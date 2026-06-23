/**
 * @file server.ts
 * @description Supabase client helper for server-side use (Route Handlers, Server Actions, Server Components).
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates and returns a Supabase server client configured for server context.
 * In development environment, this helper will automatically substitute the service-role key
 * (from SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY) if no client-side authorization
 * cookie is present and useServiceRole is not explicitly disabled. This allows bypassing RLS
 * for admin functionalities during local development.
 * 
 * @param options - Configuration options
 * @param options.useServiceRole - Set to false to force the anonymous key even when development bypass is active
 * @returns A promise resolving to the initialized Supabase server client
 */
export async function createClient(options?: { useServiceRole?: boolean }) {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return createServerClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {},
        },
      }
    )
  }

  const isDev = process.env.NODE_ENV === 'development'
  const hasAuthCookie = cookieStore.getAll().some(c => c.name.includes('-auth-token'))
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  const forceAnon = options?.useServiceRole === false
  const activeKey = (isDev && !hasAuthCookie && serviceKey && !forceAnon) ? serviceKey : supabaseKey

  return createServerClient(
    supabaseUrl,
    activeKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}
