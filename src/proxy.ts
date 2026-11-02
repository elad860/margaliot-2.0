import { NextResponse, type NextRequest } from 'next/server'

/** Next.js draft-mode cookie (set only by the authenticated /api/preview route). */
const DRAFT_COOKIE = '__prerender_bypass'

/**
 * Edge proxy for the public site (Next.js 16 "proxy", formerly middleware).
 *
 * Preview (T12): any response rendered for a draft-mode browser is private,
 * never stored by caches and never indexed — even though the page itself
 * decides whether drafts are shown (it re-checks the editor's session).
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  if (request.cookies.has(DRAFT_COOKIE)) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}

export const config = {
  // Site pages only: not Next internals, the admin, the API or static files.
  matcher: ['/((?!_next/|admin|api/|favicon.ico|.*\\.[a-z0-9]+$).*)'],
}
