import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import type { ReactNode } from 'react'

import { LivePreviewListener } from '@/components/cms/LivePreviewListener'
import { SkipLink } from '@/components/layout/SkipLink'
import { getServerEnv } from '@/lib/env'
import '@/styles/theme.css'

export const metadata: Metadata = {
  title: 'מרגליות',
}

/**
 * Root layout of the public site. Language and direction are set here once,
 * never per component (ARCHITECTURE-PROPOSAL §10).
 * The header and footer landmarks are empty until the Header/Footer tasks (T23, T26).
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const { isEnabled: preview } = await draftMode()
  return (
    <html lang="he" dir="rtl">
      <body>
        <SkipLink />
        <header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer />
        {preview ? <LivePreviewListener serverURL={getServerEnv().NEXT_PUBLIC_SITE_URL} /> : null}
      </body>
    </html>
  )
}
