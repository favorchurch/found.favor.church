/**
 * @file proxy.ts
 * @description Proxy/middleware helper to refresh sessions and enforce access rules.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the user session and enforces page authorization.
 * Specifically, this middleware/proxy:
 * 1. Checks if a query `code` is present and routes the request to the auth callback.
 * 2. Initializes the Supabase server client and updates cookie storage on request/response.
 * 3. Enforces that `/admin` routes require authenticated access.
 * 4. Bypasses authentication redirects on `/admin` during local development (`process.env.NODE_ENV === 'development'`)
 *    when no authentication cookie is present, using the developer fallback.
 * 
 * @param request - Incoming NextRequest object
 * @returns A NextResponse representing the redirection or next step in the middleware chain
 */
export async function updateSession(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl
  const code = searchParams.get('code')
  if (code && pathname !== '/auth/callback') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing in proxy.ts')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    if (process.env.NODE_ENV !== 'development') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      
      // Create redirect response
      const redirectResponse = NextResponse.redirect(url)
      
      // IMPORTANT: Transfer all session cookies to the redirect response
      // otherwise the login/session refresh will be lost on the next request.
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value)
      })
      
      return redirectResponse
    }
  }

  return response
}
