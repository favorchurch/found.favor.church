import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Create the next response with updated request headers
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Apply ALL cookies from the request to the response to ensure none are lost
          // if multiple cookies are set during the same session update.
          request.cookies.getAll().forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value)
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          // Ensure all cookies (except the removed one) are present
          request.cookies.getAll().forEach((cookie) => {
            response.cookies.set(cookie.name, cookie.value)
          });
          // Explicitly set the removal on the response
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
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

  return response
}
