import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { isStaffUser } from '@/cms/access/roles'
import { isSafeSitePath } from '@/lib/cms/paths'
import { getPayloadClient } from '@/lib/cms/payload'
import { PREVIEW_HEADERS, previewSecretMatches } from '@/lib/cms/preview-auth'
import { getServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

function deny(status: 400 | 401 | 403, message: string) {
  return NextResponse.json({ error: message }, { status, headers: PREVIEW_HEADERS })
}

/**
 * Turns on draft mode for a signed-in admin or editor and redirects to the page (task T12).
 * - 400 for a missing or unsafe path (only in-site paths; never /admin or /api).
 * - 401 without a valid Payload session (or a wrong preview secret).
 * - 403 for a signed-in user without a staff role.
 */
export async function GET(request: NextRequest) {
  const env = getServerEnv()
  const path = request.nextUrl.searchParams.get('path')
  if (!isSafeSitePath(path)) return deny(400, 'Invalid preview path.')
  if (!previewSecretMatches(env.PREVIEW_SECRET, request.nextUrl.searchParams.get('secret'))) {
    return deny(401, 'Preview requires a valid link and a signed-in editor.')
  }

  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return deny(401, 'Preview requires a valid link and a signed-in editor.')
  if (!isStaffUser(user)) return deny(403, 'Not allowed.')

  ;(await draftMode()).enable()
  return NextResponse.redirect(new URL(path, env.NEXT_PUBLIC_SITE_URL), {
    status: 307,
    headers: PREVIEW_HEADERS,
  })
}
