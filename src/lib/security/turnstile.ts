/**
 * Cloudflare Turnstile server-side verification (task T16).
 * Fails closed: no secret, no token, a network error or a non-success
 * answer all mean "not verified".
 */
export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(args: {
  token: unknown
  secret: string | undefined
  ip?: string
  fetchImpl?: typeof fetch
}): Promise<boolean> {
  const { token, secret, ip, fetchImpl = fetch } = args
  if (!secret || typeof token !== 'string' || token.length === 0 || token.length > 2048) return false
  const body = new URLSearchParams({ secret, response: token })
  if (ip && ip !== 'unknown') body.set('remoteip', ip)
  try {
    const response = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) return false
    const result = (await response.json()) as { success?: unknown }
    return result.success === true
  } catch {
    return false
  }
}
