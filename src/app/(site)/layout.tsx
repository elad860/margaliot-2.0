import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import type { ReactNode } from 'react'

import { LivePreviewListener } from '@/components/cms/LivePreviewListener'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SkipLink } from '@/components/layout/SkipLink'
import { getNavigation, getSiteSettings } from '@/lib/cms'
import { getContactDetails, getSocialLinks } from '@/lib/contact'
import { getServerEnv, isProduction } from '@/lib/env'
import { SITE_NAME } from '@/lib/seo/metadata'
import '@/styles/theme.css'

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getServerEnv().NEXT_PUBLIC_SITE_URL),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    // Every non-production environment is noindex, whatever the content (ADR-0002).
    robots: isProduction() ? undefined : { index: false, follow: false },
  }
}

/**
 * Root layout of the public site. Language and direction are set here once,
 * never per component (ARCHITECTURE-PROPOSAL §10).
 * Header and footer are unstyled stubs fed by the published-only navigation
 * (T13); their designed versions come in T23–T26.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [{ isEnabled: preview }, nav, settings] = await Promise.all([
    draftMode(),
    getNavigation(),
    getSiteSettings(),
  ])
  return (
    <html lang="he" dir="rtl">
      <body>
        <SkipLink />
        <SiteHeader nav={nav} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter nav={nav} contact={getContactDetails(settings)} socials={getSocialLinks(settings)} />
        {preview ? <LivePreviewListener serverURL={getServerEnv().NEXT_PUBLIC_SITE_URL} /> : null}
      </body>
    </html>
  )
}
