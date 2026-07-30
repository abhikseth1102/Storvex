import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')

  // 1. ALWAYS let NextAuth API routes pass through without checking!
  if (isAuthRoute) {
    return NextResponse.next()
  }

  // 2. If user is NOT logged in and trying to access the app, send them to login
  if (!isLoggedIn) {
    let callbackUrl = req.nextUrl.pathname
    if (req.nextUrl.search) {
      callbackUrl += req.nextUrl.search
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    
    return NextResponse.redirect(
      new URL(`/api/auth/signin?callbackUrl=${encodedCallbackUrl}`, req.url)
    )
  }

  // 3. Otherwise, let them through to the protected route!
  return NextResponse.next()
})

// ==============================================================================
// THE CRITICAL MATCHER:
// Notice the negative lookahead (?!...) below! This tells Next.js to completely
// SKIP running proxy.ts on /api/auth routes, images, and static Next.js bundles!
// ==============================================================================
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}