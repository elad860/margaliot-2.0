/**
 * The ONLY data-access layer for the public site (task T12; ADR-0004).
 * Published content only, unless the viewer is a verified preview viewer.
 * Each getter is memoised per request with React `cache`.
 */
import { cache } from 'react'

import type { SystemPageKey } from '@/config/site-map'

import { buildNavigation } from '@/lib/navigation'

import { getPayloadClient } from './payload'
import * as q from './queries'
import { getViewer } from './viewer'

export type { Viewer } from './queries'
export { getViewer } from './viewer'

export const getPage = cache(async (key: SystemPageKey) =>
  q.findPage(await getPayloadClient(), await getViewer(), key),
)

export const getPublishedPageKeys = cache(async () => q.findPublishedPageKeys(await getPayloadClient()))

export const getSiteSettings = cache(async () => q.findSiteSettings(await getPayloadClient()))

export const getNavigationGlobal = cache(async () => q.findNavigation(await getPayloadClient()))

export const getNextTrip = cache(async () => q.findNextTrip(await getPayloadClient(), await getViewer()))

export const getTrip = cache(async (slug: string) =>
  q.findTripBySlug(await getPayloadClient(), await getViewer(), slug),
)

export const getTrips = cache(async () => q.findTrips(await getPayloadClient(), await getViewer()))

export const getEvents = cache(async (activityType?: q.ActivityKey) =>
  q.findUpcomingEvents(
    await getPayloadClient(),
    await getViewer(),
    activityType ? [activityType] : undefined,
  ),
)

export const getParashot = cache(async () => q.findParashot(await getPayloadClient(), await getViewer()))

export const getParasha = cache(async (slug: string) =>
  q.findParashaBySlug(await getPayloadClient(), await getViewer(), slug),
)

export const getLessons = cache(async () => q.findLessons(await getPayloadClient(), await getViewer()))

export const getLesson = cache(async (slug: string) =>
  q.findLessonBySlug(await getPayloadClient(), await getViewer(), slug),
)

export const getPublishedSlugs = cache(async (collection: 'trips' | 'parashot' | 'lessons') =>
  q.findPublishedSlugs(await getPayloadClient(), collection),
)

/** Published-only navigation for header, mobile menu, footer, home cards, contact topics and sitemap (T13). */
export const getNavigation = cache(async () => {
  const [keys, settings] = await Promise.all([getPublishedPageKeys(), getNavigationGlobal()])
  return buildNavigation(keys, settings)
})
