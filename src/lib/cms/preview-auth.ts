import { timingSafeEqual } from 'node:crypto'

/** Constant-time comparison of the preview secret. No configured secret = no secret check. */
export function previewSecretMatches(expected: string | undefined, given: string | null): boolean {
  if (!expected) return true
  if (!given) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(given)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Headers for every preview-related response: never cached, never indexed. */
export const PREVIEW_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
} as const
