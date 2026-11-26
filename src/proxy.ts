import { type NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/lib/auth/session'

/**
 * Legacy sign-out endpoint (old form posts). Auth0 middleware would treat it as a plain
 * request and rewrite the rolling session cookie on the response that redirects to
 * /auth/logout, so it is passed through untouched.
 */
const LEGACY_SIGNOUT_PATH = '/auth/signout'

/** Auth0 serves /auth/login, /auth/logout and /auth/callback and keeps the session cookie fresh. */
export async function proxy(request: NextRequest) {
  if (new URL(request.url).pathname === LEGACY_SIGNOUT_PATH) return NextResponse.next()
  return await auth0.middleware(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
