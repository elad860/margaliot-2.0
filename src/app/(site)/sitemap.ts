import type { MetadataRoute } from 'next'

import type { SystemPageKey } from '@/config/site-map'
import { getNavigation, getPublishedPageKeys, getPublishedSlugs, getSiteSettings } from '@/lib/cms'
import { childPath, type ChildCollection } from '@/lib/cms/paths'
import { getPayloadClient } from '@/lib/cms/payload'
import { PUBLIC_VIEWER, findTripById, nextTripId } from '@/lib/cms/queries'
import { getServerEnv } from '@/lib/env'
import { absoluteUrl } from '@/lib/seo/json-ld'

const PARENT: Record<ChildCollection, SystemPageKey> = {
  trips: 'umanTrips',
  parashot: 'parasha',
  lessons: 'onlineClasses',
}

/**
 * sitemap.xml (task T15): PUBLISHED pages only, from the same navigation
 * source as the menus (T13), plus published child items whose parent tab is
 * published. The selected next trip is listed once, as /next-trip (its
 * canonical, ADR-0003). Revalidated whenever public content changes (T12).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getServerEnv().NEXT_PUBLIC_SITE_URL
  const [nav, keys, settings] = await Promise.all([
    getNavigation(),
    getPublishedPageKeys(),
    getSiteSettings(),
  ])

  const entries: MetadataRoute.Sitemap = nav.publishedPaths.map((path) => ({
    url: absoluteUrl(siteUrl, path),
  }))

  const selectedTripId = keys.includes('nextTrip') ? nextTripId(settings) : null
  const selectedTrip =
    selectedTripId === null
      ? null
      : await findTripById(await getPayloadClient(), PUBLIC_VIEWER, selectedTripId)

  for (const collection of Object.keys(PARENT) as ChildCollection[]) {
    if (!keys.includes(PARENT[collection])) continue
    for (const { slug, updatedAt } of await getPublishedSlugs(collection)) {
      if (collection === 'trips' && selectedTrip?.slug === slug) continue
      entries.push({ url: absoluteUrl(siteUrl, childPath(collection, slug)), lastModified: updatedAt })
    }
  }
  return entries
}
