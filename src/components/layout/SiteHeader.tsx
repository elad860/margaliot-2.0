import Link from 'next/link'

import { SITE_NAME } from '@/lib/seo/metadata'
import type { SiteNavigation } from '@/lib/navigation'

/**
 * Header (UNSTYLED stub, T14). Data and order are final (T13); the visual
 * header, disclosure dropdowns and mobile menu replace this in T23–T25.
 * Published pages only; nothing is rendered for empty groups or a missing CTA.
 */
export function SiteHeader({ nav }: { nav: SiteNavigation }) {
  return (
    <header>
      {nav.home ? <Link href={nav.home.href}>{SITE_NAME}</Link> : null}
      {nav.header.length > 0 ? (
        <nav aria-label="ראשי">
          <ul>
            {nav.header.map((entry) =>
              entry.type === 'link' ? (
                <li key={entry.link.key}>
                  <Link href={entry.link.href}>{entry.link.label}</Link>
                </li>
              ) : entry.displayAs === 'link' ? (
                <li key={entry.key}>
                  <Link href={entry.links[0]!.href}>{entry.links[0]!.label}</Link>
                </li>
              ) : (
                <li key={entry.key}>
                  <span>{entry.label}</span>
                  <ul>
                    {entry.links.map((link) => (
                      <li key={link.key}>
                        <Link href={link.href}>{link.label}</Link>
                        {link.description ? <span> {link.description}</span> : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
        </nav>
      ) : null}
      {nav.cta ? <Link href={nav.cta.href}>{nav.cta.label}</Link> : null}
    </header>
  )
}
