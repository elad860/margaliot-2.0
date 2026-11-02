import { cache } from 'react'

import type { SystemPageKey } from '@/config/site-map'

import { getLesson, getParasha, getPublishedPageKeys, getTrip, getViewer } from './index'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * A child page (trip, parasha, lesson) is public only when it is published AND
 * its parent tab is published, so nothing hangs below an unready tab.
 * In preview, an editor sees drafts regardless of the parent.
 */
async function parentVisible(parent: SystemPageKey): Promise<boolean> {
  if ((await getViewer()).draft) return true
  return (await getPublishedPageKeys()).includes(parent)
}

export const loadTripPage = cache(async (slug: string) => {
  if (!SLUG_PATTERN.test(slug) || !(await parentVisible('umanTrips'))) return null
  return getTrip(slug)
})

export const loadParashaPage = cache(async (slug: string) => {
  if (!SLUG_PATTERN.test(slug) || !(await parentVisible('parasha'))) return null
  return getParasha(slug)
})

export const loadLessonPage = cache(async (slug: string) => {
  if (!SLUG_PATTERN.test(slug) || !(await parentVisible('onlineClasses'))) return null
  return getLesson(slug)
})
