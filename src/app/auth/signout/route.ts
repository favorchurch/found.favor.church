import { type NextRequest, NextResponse } from 'next/server'

/** Legacy sign-out endpoint used by the admin sidebar form; Auth0 owns the actual logout. */
export async function POST(req: NextRequest) {
  return NextResponse.redirect(new URL('/auth/logout', req.url), { status: 303 })
}
