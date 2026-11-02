import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { isSafeSitePath } from '@/lib/cms/paths'
import { PREVIEW_HEADERS } from '@/lib/cms/preview-auth'
import { getServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

/** Turns draft mode off and returns to the given page (or home). */
export async function GET(request: NextRequest) {
  ;(await draftMode()).disable()
  const requested = request.nextUrl.searchParams.get('path')
  const path = isSafeSitePath(requested) ? requested : '/'
  return NextResponse.redirect(new URL(path, getServerEnv().NEXT_PUBLIC_SITE_URL), {
    status: 307,
    headers: PREVIEW_HEADERS,
  })
}
