import { docPath } from '@/lib/cms/paths'
import { getServerEnv } from '@/lib/env'

export const PREVIEW_COLLECTIONS = ['pages', 'trips', 'parashot', 'lessons'] as const

/**
 * Admin preview link for a document (task T12): /api/preview?path=…[&secret=…].
 * Generated on the server and shown only inside the admin. The preview route
 * still requires a signed-in admin or editor; the secret (when configured) is
 * a second factor against forged links.
 */
export function previewUrl(collection: string | undefined, doc: unknown): string | null {
  if (!collection) return null
  const path = docPath(collection, doc as { systemKey?: unknown; slug?: unknown })
  if (!path) return null
  const env = getServerEnv()
  const params = new URLSearchParams({ path })
  if (env.PREVIEW_SECRET) params.set('secret', env.PREVIEW_SECRET)
  return `${env.NEXT_PUBLIC_SITE_URL}/api/preview?${params.toString()}`
}
