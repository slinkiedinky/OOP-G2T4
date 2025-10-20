import { NextResponse } from 'next/server'

export function middleware(req) {
  const { pathname } = req.nextUrl

  // Protect appointments and admin routes
  if (pathname.startsWith('/appointments') || pathname.startsWith('/admin')) {
    const token = req.cookies.get('aqms_token')?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/appointments/:path*', '/admin/:path*']
}
