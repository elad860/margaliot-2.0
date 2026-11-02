import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seedSystemPages } from '@/cms/seed/system-pages'
import * as q from '@/lib/cms/queries'
import type { User } from '@/payload-types'

import { getTestPayload, strongPassword } from './helpers'

let payload: Payload
let editor: User
let preview: q.Viewer

beforeAll(async () => {
  payload = await getTestPayload()
  await seedSystemPages(payload)
  editor = (await payload.create({
    collection: 'users',
    data: { email: 'data-editor@example.test', password: strongPassword(), roles: ['editor'] },
  })) as User
  preview = q.previewViewer(editor)
})

afterAll(async () => {
  await payload?.destroy()
})

const pub = q.PUBLIC_VIEWER

describe('pages: anonymous never receives drafts (T12)', () => {
  it('draft pages are invisible publicly and visible in preview', async () => {
    expect(await q.findPage(payload, pub, 'about')).toBeNull()
    expect(await q.findPublishedPageKeys(payload)).toEqual([])
    expect((await q.findPage(payload, preview, 'about'))?.title).toBe('מי אנחנו')
  })

  it('publishing makes a page public; a newer draft never leaks', async () => {
    const draft = await q.findPage(payload, preview, 'womensEvenings')
    await payload.update({
      collection: 'pages',
      id: draft!.id,
      overrideAccess: true,
      data: { _status: 'published', hero: { heading: 'published heading' } },
    })
    await payload.update({
      collection: 'pages',
      id: draft!.id,
      overrideAccess: true,
      draft: true,
      data: { hero: { heading: 'secret draft heading' } },
    })
    expect((await q.findPage(payload, pub, 'womensEvenings'))?.hero?.heading).toBe('published heading')
    expect((await q.findPage(payload, preview, 'womensEvenings'))?.hero?.heading).toBe('secret draft heading')
    expect(await q.findPublishedPageKeys(payload)).toEqual(['womensEvenings'])
  })

  it('a non-staff "preview" viewer gets nothing extra', async () => {
    expect(q.previewViewer({ roles: [] })).toBe(pub)
  })
})

describe('collections: published only (T12)', () => {
  it('trips, next trip, events, parashot and lessons', async () => {
    const draftTrip = await payload.create({
      collection: 'trips',
      draft: true,
      overrideAccess: true,
      data: { title: 'draft', slug: 'draft-trip-da' },
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      overrideAccess: true,
      data: { nextTrip: draftTrip.id },
    })
    expect(await q.findNextTrip(payload, pub)).toBeNull()
    expect((await q.findNextTrip(payload, preview))?.slug).toBe('draft-trip-da')
    expect(await q.findTripBySlug(payload, pub, 'draft-trip-da')).toBeNull()
    expect(await q.findTrips(payload, pub)).toEqual([])

    await payload.update({
      collection: 'trips',
      id: draftTrip.id,
      overrideAccess: true,
      data: { _status: 'published' },
    })
    expect((await q.findNextTrip(payload, pub))?.slug).toBe('draft-trip-da')
    expect(await q.findPublishedSlugs(payload, 'trips')).toEqual([
      expect.objectContaining({ slug: 'draft-trip-da' }),
    ])

    const tomorrow = new Date(Date.now() + 86_400_000).toISOString()
    const yesterday = new Date(Date.now() - 2 * 86_400_000).toISOString()
    await payload.create({
      collection: 'events',
      draft: true,
      overrideAccess: true,
      data: { title: 'draft event', activityType: 'channeling', start: tomorrow },
    })
    await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: 'live event',
        activityType: 'channeling',
        start: tomorrow,
        _status: 'published',
        registration: { mode: 'none' },
      },
    })
    await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: 'past event',
        activityType: 'channeling',
        start: yesterday,
        _status: 'published',
        registration: { mode: 'none' },
      },
    })
    await payload.create({
      collection: 'events',
      overrideAccess: true,
      data: {
        title: 'other activity',
        activityType: 'toolsCourse',
        start: tomorrow,
        _status: 'published',
        registration: { mode: 'none' },
      },
    })
    expect((await q.findUpcomingEvents(payload, pub, ['channeling'])).map((e) => e.title)).toEqual([
      'live event',
    ])
    expect((await q.findUpcomingEvents(payload, preview, ['channeling'])).map((e) => e.title).sort()).toEqual(
      ['draft event', 'live event'],
    )
    expect(await q.findUpcomingEvents(payload, pub)).toHaveLength(2)

    await payload.create({
      collection: 'parashot',
      draft: true,
      overrideAccess: true,
      data: { name: 'p', slug: 'draft-parasha', book: 'genesis', publishDate: tomorrow },
    })
    expect(await q.findParashot(payload, pub)).toEqual([])
    expect(await q.findParashaBySlug(payload, pub, 'draft-parasha')).toBeNull()
    expect(await q.findParashaBySlug(payload, preview, 'draft-parasha')).not.toBeNull()

    await payload.create({
      collection: 'lessons',
      draft: true,
      overrideAccess: true,
      data: { title: 'l', slug: 'draft-lesson' },
    })
    expect(await q.findLessons(payload, pub)).toEqual([])
    expect(await q.findLessonBySlug(payload, pub, 'draft-lesson')).toBeNull()
    expect(await q.findPublishedSlugs(payload, 'lessons')).toEqual([])
  })
})
