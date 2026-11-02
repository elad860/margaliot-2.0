/**
 * Security headers and Content-Security-Policy (task T16; ARCHITECTURE-PROPOSAL §10).
 * Pure, so next.config.ts uses it and unit tests check it.
 *
 * - CSP is ENFORCED only in production and REPORT-ONLY elsewhere, so preview
 *   can surface violations (admin, live preview, embeds) before go-live.
 * - 'unsafe-inline' scripts are needed by Next.js inline bootstrap scripts
 *   without nonces (nonces would force every page to render dynamically).
 * - Third parties allowed: Cloudflare Turnstile (forms), youtube-nocookie
 *   (video embeds), Vercel Blob (media). Nothing else.
 * - frame-ancestors 'self': the admin's live preview frames the site; no
 *   other origin may frame it.
 */
import type { SiteEnv } from '@/lib/env'

export type Header = { key: string; value: string }

export function contentSecurityPolicy(env: SiteEnv): string {
  const dev = env === 'development'
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://challenges.cloudflare.com',
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://*.public.blob.vercel-storage.com',
      'https://i.ytimg.com',
    ],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https://challenges.cloudflare.com', ...(dev ? ['ws:'] : [])],
    'frame-src': ['https://www.youtube-nocookie.com', 'https://challenges.cloudflare.com'],
    'frame-ancestors': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'object-src': ["'none'"],
  }
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`)
  if (env === 'production') policy.push('upgrade-insecure-requests')
  return policy.join('; ')
}

export function securityHeaders(env: SiteEnv): Header[] {
  const headers: Header[] = [
    {
      key: env === 'production' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
      value: contentSecurityPolicy(env),
    },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    },
  ]
  // HSTS only where HTTPS is guaranteed. No "preload" without the owner's approval (it is hard to undo).
  if (env === 'production') {
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' })
  }
  return headers
}
