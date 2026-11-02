import { notFound } from 'next/navigation'

import { getSystemPage, type SystemPageKey } from '@/config/site-map'
import { getPage } from '@/lib/cms'
import type { ActivityKey } from '@/lib/cms/queries'

import { ActivityTemplate } from './ActivityTemplate'
import { HomeTemplate } from './HomeTemplate'
import { InformationTemplate } from './InformationTemplate'
import { LegalTemplate } from './LegalTemplate'
import { LibraryTemplate } from './LibraryTemplate'
import { TripTemplate } from './TripTemplate'

/**
 * Template dispatch for the 15 system pages (T14; ADR-0003 §resolution).
 * A page that is not published (and not previewed by an editor) is a 404.
 */
export async function SystemPageView({ pageKey }: { pageKey: SystemPageKey }) {
  const page = await getPage(pageKey)
  if (!page) notFound()
  const entry = getSystemPage(pageKey)

  switch (entry.template) {
    case 'home':
      return <HomeTemplate page={page} />
    case 'information':
      return <InformationTemplate page={page} />
    case 'trip':
      return <TripTemplate page={page} mode={pageKey === 'nextTrip' ? 'next' : 'overview'} />
    case 'activity':
      return <ActivityTemplate page={page} activity={pageKey as ActivityKey} />
    case 'library':
      return <LibraryTemplate page={page} kind={pageKey === 'parasha' ? 'parashot' : 'lessons'} />
    case 'legal':
      return <LegalTemplate page={page} />
  }
}
