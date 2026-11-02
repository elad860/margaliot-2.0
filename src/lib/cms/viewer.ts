import { draftMode, headers } from 'next/headers'
import { cache } from 'react'

import { getPayloadClient } from './payload'
import { PUBLIC_VIEWER, previewViewer, type Viewer } from './queries'

/**
 * Who is looking at this request (task T12).
 *
 * Drafts are shown only when BOTH hold: Next.js draft mode is on (set by the
 * authenticated /api/preview route) AND the request still carries a valid
 * Payload session of an admin or editor. A leaked or stale draft-mode cookie
 * therefore never reveals drafts. Request headers are read only in draft mode,
 * so public pages stay statically rendered.
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return PUBLIC_VIEWER
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })
  return previewViewer(user)
})
