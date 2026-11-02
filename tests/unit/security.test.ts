import { describe, expect, it, vi } from 'vitest'

import { validateSubmission } from '@/lib/forms/validate-submission'
import { contentSecurityPolicy, securityHeaders } from '@/lib/security/headers'
import { clientIp, createRateLimiter } from '@/lib/security/rate-limit'
import { TURNSTILE_VERIFY_URL, verifyTurnstile } from '@/lib/security/turnstile'

const names = (env: 'development' | 'preview' | 'production') => securityHeaders(env).map((h) => h.key)

describe('security headers (T16)', () => {
  it('sets the baseline headers everywhere', () => {
    for (const env of ['development', 'preview', 'production'] as const) {
      expect(names(env)).toEqual(
        expect.arrayContaining([
          'X-Content-Type-Options',
          'Referrer-Policy',
          'X-Frame-Options',
          'Cross-Origin-Opener-Policy',
          'Permissions-Policy',
        ]),
      )
    }
  })

  it('enforces CSP and HSTS only in production; report-only in preview', () => {
    expect(names('production')).toContain('Content-Security-Policy')
    expect(names('production')).toContain('Strict-Transport-Security')
    expect(names('preview')).toContain('Content-Security-Policy-Report-Only')
    expect(names('preview')).not.toContain('Content-Security-Policy')
    expect(names('preview')).not.toContain('Strict-Transport-Security')
  })

  it('CSP allows only the expected third parties and blocks framing by others', () => {
    const csp = contentSecurityPolicy('production')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain('https://www.youtube-nocookie.com')
    expect(csp).toContain('https://challenges.cloudflare.com')
    expect(csp).not.toContain("'unsafe-eval'")
    expect(csp).not.toMatch(/https:\/\/www\.youtube\.com/)
    expect(contentSecurityPolicy('development')).toContain("'unsafe-eval'")
  })
})

describe('rate limiter (T16)', () => {
  it('allows `limit` hits per window per key', () => {
    const check = createRateLimiter({ limit: 2, windowMs: 1000 })
    expect(check('a', 0).allowed).toBe(true)
    expect(check('a', 10).allowed).toBe(true)
    expect(check('a', 20)).toEqual({ allowed: false, retryAfterSeconds: 1 })
    expect(check('b', 20).allowed).toBe(true)
    expect(check('a', 1001).allowed).toBe(true)
  })

  it('reads the client IP from proxy headers', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.1, 10.0.0.1' }))).toBe('203.0.113.1')
    expect(clientIp(new Headers({ 'x-real-ip': '203.0.113.2' }))).toBe('203.0.113.2')
    expect(clientIp(undefined)).toBe('unknown')
  })
})

describe('Turnstile verification (T16)', () => {
  const ok = () => Promise.resolve(new Response(JSON.stringify({ success: true })))
  const fail = () => Promise.resolve(new Response(JSON.stringify({ success: false })))

  it('fails closed without a secret or token', async () => {
    const fetchImpl = vi.fn(ok)
    expect(await verifyTurnstile({ token: 't', secret: undefined, fetchImpl })).toBe(false)
    expect(await verifyTurnstile({ token: '', secret: 's', fetchImpl })).toBe(false)
    expect(await verifyTurnstile({ token: undefined, secret: 's', fetchImpl })).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('posts to siteverify and trusts only success === true', async () => {
    const fetchImpl = vi.fn(ok)
    expect(await verifyTurnstile({ token: 't', secret: 's', ip: '203.0.113.1', fetchImpl })).toBe(true)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(TURNSTILE_VERIFY_URL)
    expect(String(init.body)).toContain('remoteip=203.0.113.1')
    expect(await verifyTurnstile({ token: 't', secret: 's', fetchImpl: vi.fn(fail) })).toBe(false)
    expect(
      await verifyTurnstile({
        token: 't',
        secret: 's',
        fetchImpl: vi.fn(() => Promise.reject(new Error('net'))),
      }),
    ).toBe(false)
  })
})

describe('validateSubmission (T16)', () => {
  const fields = [
    { blockType: 'text', name: 'name', required: true },
    { blockType: 'email', name: 'email', required: true },
    { blockType: 'select', name: 'topic', options: [{ value: 'a' }, { value: 'b' }] },
    { blockType: 'checkbox', name: 'consent', required: true },
    { blockType: 'message' },
  ]
  const valid = [
    { field: 'name', value: 'x' },
    { field: 'email', value: 'x@example.test' },
    { field: 'topic', value: 'a' },
    { field: 'consent', value: 'true' },
  ]

  it('accepts a valid submission', () => {
    expect(validateSubmission(fields, valid)).toEqual([])
  })

  it('rejects missing, unknown, duplicate, malformed and oversized values', () => {
    expect(validateSubmission(fields, valid.slice(1))).toHaveLength(1)
    expect(validateSubmission(fields, [...valid, { field: 'extra', value: 'x' }])).toHaveLength(1)
    expect(validateSubmission(fields, [...valid, { field: 'name', value: 'y' }])).toHaveLength(1)
    expect(
      validateSubmission(
        fields,
        valid.map((e) => (e.field === 'email' ? { ...e, value: 'nope' } : e)),
      ),
    ).toHaveLength(1)
    expect(
      validateSubmission(
        fields,
        valid.map((e) => (e.field === 'topic' ? { ...e, value: 'z' } : e)),
      ),
    ).toHaveLength(1)
    expect(
      validateSubmission(
        fields,
        valid.map((e) => (e.field === 'consent' ? { ...e, value: 'false' } : e)),
      ),
    ).toHaveLength(1)
    expect(
      validateSubmission(
        fields,
        valid.map((e) => (e.field === 'name' ? { ...e, value: 'x'.repeat(5001) } : e)),
      ),
    ).toHaveLength(1)
    expect(validateSubmission(fields, 'nope')).toHaveLength(1)
    expect(
      validateSubmission(
        fields,
        Array.from({ length: 51 }, () => ({ field: 'name', value: 'x' })),
      ),
    ).toHaveLength(1)
  })
})
