import type { Metadata } from 'next'

import { SkipLink } from '@/components/layout/SkipLink'
import { PLACEHOLDER } from '@/config/placeholder'
import '@/styles/theme.css'

export const metadata: Metadata = {
  title: 'הדף לא נמצא | מרגליות',
  robots: { index: false, follow: false },
}

/**
 * 404 for URLs that match no route at all (e.g. /next-trip/register, /a/b/c).
 * The app has two root layouts (site and Payload), so this page brings its
 * own <html lang="he" dir="rtl"> (Next.js experimental.globalNotFound).
 */
export default function GlobalNotFound() {
  return (
    <html lang="he" dir="rtl">
      <body>
        <SkipLink />
        <main id="main" tabIndex={-1}>
          <h1>הדף לא נמצא</h1>
          <p>{PLACEHOLDER}</p>
        </main>
      </body>
    </html>
  )
}
