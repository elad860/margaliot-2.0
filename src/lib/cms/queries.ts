/**
 * CMS queries (task T12; ADR-0004 "draft/publish").
 *
 * Every function takes the Payload instance and a `Viewer`. With a public
 * viewer (the default) it returns PUBLISHED content only, enforced twice: an
 * explicit `_status = published` filter and Payload access control
 * (`overrideAccess: false`, no user). Drafts are returned only for a preview
 * viewer, which carries a verified staff user (see viewer.ts).
 *
 * Kept free of Next.js APIs so integration tests can call it directly.
 */
import type { Payload, Where } from 'payload'

import { isStaffUser } from '@/cms/access/roles'
import type { SystemPageKey } from '@/config/site-map'
import type { Event, Lesson, Navigation, Page, Parashot, SiteSetting, Trip, User } from '@/payload-types'

export type Viewer = { draft: false; user: null } | { draft: true; user: User }

export const PUBLIC_VIEWER: Viewer = { draft: false, user: null }

/** A preview viewer only exists for a signed-in admin or editor. */
export function previewViewer(user: unknown): Viewer {
  return isStaffUser(user as object | null) ? { draft: true, user: user as User } : PUBLIC_VIEWER
}

const PUBLISHED: Where = { _status: { equals: 'published' } }

function scoped(viewer: Viewer, where: Where): Where {
  return viewer.draft ? where : { and: [where, PUBLISHED] }
}

function readOptions(viewer: Viewer) {
  return viewer.draft
    ? ({ draft: true, overrideAccess: false, user: viewer.user } as const)
    : ({ draft: false, overrideAccess: false } as const)
}

type DraftCollection = 'pages' | 'trips' | 'events' | 'parashot' | 'lessons'

async function findOne<T>(
  payload: Payload,
  viewer: Viewer,
  collection: DraftCollection,
  where: Where,
  depth = 1,
): Promise<T | null> {
  const { docs } = await payload.find({
    collection,
    where: scoped(viewer, where),
    limit: 1,
    depth,
    pagination: false,
    ...readOptions(viewer),
  })
  return (docs[0] as T | undefined) ?? null
}

export function findPage(payload: Payload, viewer: Viewer, key: SystemPageKey): Promise<Page | null> {
  return findOne<Page>(payload, viewer, 'pages', { systemKey: { equals: key } }, 2)
}

/** Keys of all PUBLISHED system pages. Navigation, sitemap and home cards use this, never drafts. */
export async function findPublishedPageKeys(payload: Payload): Promise<SystemPageKey[]> {
  const { docs } = await payload.find({
    collection: 'pages',
    where: PUBLISHED,
    draft: false,
    overrideAccess: false,
    depth: 0,
    limit: 100,
    pagination: false,
    select: { systemKey: true },
  })
  return docs.map((doc) => doc.systemKey as SystemPageKey)
}

export function findTripBySlug(payload: Payload, viewer: Viewer, slug: string): Promise<Trip | null> {
  return findOne<Trip>(payload, viewer, 'trips', { slug: { equals: slug } }, 2)
}

export function findTripById(payload: Payload, viewer: Viewer, id: number): Promise<Trip | null> {
  return findOne<Trip>(payload, viewer, 'trips', { id: { equals: id } }, 2)
}

export async function findTrips(payload: Payload, viewer: Viewer): Promise<Trip[]> {
  const { docs } = await payload.find({
    collection: 'trips',
    where: scoped(viewer, {}),
    sort: '-startDate',
    depth: 1,
    limit: 100,
    pagination: false,
    ...readOptions(viewer),
  })
  return docs
}

/** Published site settings (globals have no drafts). Always read without a user, so access rules apply. */
export function findSiteSettings(payload: Payload): Promise<SiteSetting> {
  return payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: false })
}

/** A media document (public collection), or null. */
export async function findMedia(payload: Payload, id: number | null | undefined) {
  if (typeof id !== 'number') return null
  try {
    return await payload.findByID({ collection: 'media', id, depth: 0, overrideAccess: false })
  } catch {
    return null
  }
}

/** Id of the trip selected as המסע הקרוב (not checked for publish status). */
export function nextTripId(settings: SiteSetting): number | null {
  const ref = settings.nextTrip
  const id = typeof ref === 'object' && ref !== null ? ref.id : ref
  return typeof id === 'number' ? id : null
}

export function findNavigation(payload: Payload): Promise<Navigation> {
  return payload.findGlobal({ slug: 'navigation', depth: 0, overrideAccess: false })
}

/** The trip selected as המסע הקרוב, if it is visible to this viewer (published, or draft in preview). */
export async function findNextTrip(payload: Payload, viewer: Viewer): Promise<Trip | null> {
  const id = nextTripId(await findSiteSettings(payload))
  return id === null ? null : findTripById(payload, viewer, id)
}

export type ActivityKey = Extract<SystemPageKey, Event['activityType']>

/** Upcoming dates (from the start of today) for one activity tab, or all activities. */
export async function findUpcomingEvents(
  payload: Payload,
  viewer: Viewer,
  activityTypes?: readonly ActivityKey[],
  now: Date = new Date(),
): Promise<Event[]> {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const where: Where = {
    and: [
      { start: { greater_than_equal: startOfToday.toISOString() } },
      ...(activityTypes && activityTypes.length > 0 ? [{ activityType: { in: [...activityTypes] } }] : []),
    ],
  }
  const { docs } = await payload.find({
    collection: 'events',
    where: scoped(viewer, where),
    sort: 'start',
    depth: 1,
    limit: 100,
    pagination: false,
    ...readOptions(viewer),
  })
  return docs
}

export async function findParashot(payload: Payload, viewer: Viewer): Promise<Parashot[]> {
  const { docs } = await payload.find({
    collection: 'parashot',
    where: scoped(viewer, {}),
    sort: '-publishDate',
    depth: 1,
    limit: 200,
    pagination: false,
    ...readOptions(viewer),
  })
  return docs
}

export function findParashaBySlug(payload: Payload, viewer: Viewer, slug: string): Promise<Parashot | null> {
  return findOne<Parashot>(payload, viewer, 'parashot', { slug: { equals: slug } }, 2)
}

export async function findLessons(payload: Payload, viewer: Viewer): Promise<Lesson[]> {
  const { docs } = await payload.find({
    collection: 'lessons',
    where: scoped(viewer, {}),
    sort: '-createdAt',
    depth: 1,
    limit: 200,
    pagination: false,
    ...readOptions(viewer),
  })
  return docs
}

export function findLessonBySlug(payload: Payload, viewer: Viewer, slug: string): Promise<Lesson | null> {
  return findOne<Lesson>(payload, viewer, 'lessons', { slug: { equals: slug } }, 2)
}

/** Published slugs of a child collection (generateStaticParams, sitemap). */
export async function findPublishedSlugs(
  payload: Payload,
  collection: 'trips' | 'parashot' | 'lessons',
): Promise<{ slug: string; updatedAt: string }[]> {
  const { docs } = await payload.find({
    collection,
    where: PUBLISHED,
    draft: false,
    overrideAccess: false,
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true, updatedAt: true },
  })
  return docs.map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt }))
}
