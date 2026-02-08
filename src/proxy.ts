import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirects for old URLs to new /apps structure
  const redirects: Record<string, string> = {
    '/whoop-dashboard': '/apps/fitness-dashboard',
    '/live-data': '/apps/fitness-dashboard',
    '/tools/social-media-pipeline': '/apps/social-media-pipeline',
    '/tools': '/apps',
  }

  if (redirects[pathname]) {
    const url = request.nextUrl.clone()
    url.pathname = redirects[pathname]
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/whoop-dashboard',
    '/live-data',
    '/tools/:path*',
  ],
}
