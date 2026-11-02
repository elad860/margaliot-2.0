import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SkipLink } from '@/components/layout/SkipLink'
import '@/styles/theme.css'

export const metadata: Metadata = {
  title: 'מרגליות',
}

/**
 * Root layout of the public site. Language and direction are set here once,
 * never per component (ARCHITECTURE-PROPOSAL §10).
 * The header and footer landmarks are empty until the Header/Footer tasks (T23, T26).
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <SkipLink />
        <header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer />
      </body>
    </html>
  )
}
