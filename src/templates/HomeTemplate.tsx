import Link from 'next/link'

import { TripDetails } from '@/components/content/TripDetails'
import { getNavigation, getNextTrip, getParashot } from '@/lib/cms'
import { childPath } from '@/lib/cms/paths'
import type { Page } from '@/payload-types'

import { TemplateFrame } from './TemplateFrame'

/**
 * Home (T14 stub; composed in T33): next-trip summary, a link per published
 * tab, latest parasha. Every region is hidden when it has no published data.
 */
export async function HomeTemplate({ page }: { page: Page }) {
  const [trip, nav, parashot] = await Promise.all([getNextTrip(), getNavigation(), getParashot()])
  const latest = parashot[0]
  return (
    <TemplateFrame page={page} template="home">
      {trip ? <TripDetails trip={trip} /> : null}
      {nav.publishedTabs.length > 0 ? (
        <ul data-region="tabs">
          {nav.publishedTabs.map((tab) => (
            <li key={tab.key}>
              <Link href={tab.href}>{tab.label}</Link>
            </li>
          ))}
        </ul>
      ) : null}
      {latest ? (
        <p data-region="latest-parasha">
          <Link href={childPath('parashot', latest.slug)}>{latest.name}</Link>
        </p>
      ) : null}
    </TemplateFrame>
  )
}
