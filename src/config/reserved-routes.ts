/**
 * Routes reserved for later phases or for the system (task T06; ADR-0003, ADR-0005).
 *
 * Booking routes return 404 today and must never be taken by a CMS page.
 * CMS slug validation (T09) rejects every slug in RESERVED_SLUGS and every
 * system slug from the site-map registry.
 */

/** Future booking/account routes — 404 in Phase A (ADR-0005). Prefix match. */
export const RESERVED_FUTURE_ROUTES: readonly string[] = [
  '/next-trip/register',
  '/account',
  '/api/booking',
  '/api/webhooks/payments',
] as const

/** System routes owned by Next.js / Payload. Prefix match. */
export const SYSTEM_ROUTES: readonly string[] = [
  '/admin',
  '/api',
  '/_next',
  '/sitemap.xml',
  '/robots.txt',
] as const

/**
 * Single URL segments a CMS document may never use as its slug, at any level.
 * Covers the first segment of every reserved/system route plus words reserved
 * for the booking phase.
 */
export const RESERVED_SLUGS: readonly string[] = [
  'admin',
  'api',
  '_next',
  'account',
  'register',
  'booking',
  'checkout',
  'webhooks',
  'preview',
  'exit-preview',
  'sitemap.xml',
  'robots.txt',
] as const

function matchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

function normalise(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? ''
  const trimmed = withoutQuery.replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/** True if the path is reserved for a future phase (must return 404 now). */
export function isReservedFutureRoute(path: string): boolean {
  const p = normalise(path)
  return RESERVED_FUTURE_ROUTES.some((prefix) => matchesPrefix(p, prefix))
}

/** True if the path belongs to the system (admin, API, Next internals, sitemap, robots). */
export function isSystemRoute(path: string): boolean {
  const p = normalise(path)
  return SYSTEM_ROUTES.some((prefix) => matchesPrefix(p, prefix))
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase())
}
