// SIMPLE AUTH MIDDLEWARE - Minimal intrusion
// This will be enhanced gradually without breaking your app

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, just pass through - we'll add auth checks later
  // This ensures your app keeps working while we set up auth
  
  const response = NextResponse.next()
  
  // You can add basic auth checks here when ready
  // Example: check cookies, redirect to login, etc.
  
  return response
}

export const config = {
  matcher: [
    // Apply to all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
