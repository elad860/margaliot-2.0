/**
 * Fixed-window rate limiter kept in memory (task T16).
 *
 * Limitation: the count lives in one server process. On serverless hosting
 * each instance counts separately, so this slows abuse rather than stopping
 * it; Turnstile is the main defence. A shared store can replace it later
 * without changing callers.
 */
export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number }

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>()

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
    }
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, retryAfterSeconds: 0 }
    }
    entry.count += 1
    if (entry.count > limit) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) }
    }
    return { allowed: true, retryAfterSeconds: 0 }
  }
}

/** Client IP from proxy headers (first X-Forwarded-For entry), or "unknown". */
export function clientIp(headers: Headers | undefined): string {
  const forwarded = headers?.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers?.get('x-real-ip')?.trim() || 'unknown'
}
