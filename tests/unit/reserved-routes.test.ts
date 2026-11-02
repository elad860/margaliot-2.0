import { describe, expect, it } from 'vitest'

import { isReservedFutureRoute, isReservedSlug, isSystemRoute } from '@/config/reserved-routes'

describe('reserved routes (ADR-0005)', () => {
  it.each([
    '/next-trip/register',
    '/account',
    '/account/bookings',
    '/api/booking',
    '/api/booking/123',
    '/api/webhooks/payments/cardcom',
    '/account/',
  ])('%s is reserved for a future phase', (path) => expect(isReservedFutureRoute(path)).toBe(true))

  it.each(['/next-trip', '/accounting', '/api/bookings-list', '/', '/about'])('%s is not reserved', (path) =>
    expect(isReservedFutureRoute(path)).toBe(false),
  )

  it('detects system routes', () => {
    expect(isSystemRoute('/admin')).toBe(true)
    expect(isSystemRoute('/admin/collections/pages')).toBe(true)
    expect(isSystemRoute('/api/pages?draft=true')).toBe(true)
    expect(isSystemRoute('/robots.txt')).toBe(true)
    expect(isSystemRoute('/administrator')).toBe(false)
  })

  it('rejects reserved slugs case-insensitively', () => {
    expect(isReservedSlug('register')).toBe(true)
    expect(isReservedSlug('Account')).toBe(true)
    expect(isReservedSlug('vayera')).toBe(false)
  })
})
