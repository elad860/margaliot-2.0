import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { getTestPayload, strongPassword } from './helpers'

let payload: Payload
let editor: User

beforeAll(async () => {
  payload = await getTestPayload()
  editor = (await payload.create({
    collection: 'users',
    data: { email: 'content-editor@example.test', password: strongPassword(), roles: ['editor'] },
  })) as User
})

afterAll(async () => {
  await payload?.destroy()
})

describe('slug validation (T09)', () => {
  it('rejects reserved words, registry slugs and Hebrew, even in drafts', async () => {
    for (const slug of ['register', 'account', 'about', 'פרשה', 'Bad Slug']) {
      await expect(
        payload.create({
          collection: 'trips',
          draft: true,
          data: { title: 't', slug },
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ name: 'ValidationError' })
      await expect(
        payload.create({
          collection: 'parashot',
          draft: true,
          data: { name: 'p', slug, book: 'genesis', publishDate: new Date().toISOString() },
          overrideAccess: true,
        }),
      ).rejects.toMatchObject({ name: 'ValidationError' })
    }
  })

  it('rejects duplicate slugs', async () => {
    await payload.create({
      collection: 'lessons',
      draft: true,
      data: { title: 'a', slug: 'dup-lesson' },
      overrideAccess: true,
    })
    await expect(
      payload.create({
        collection: 'lessons',
        draft: true,
        data: { title: 'b', slug: 'dup-lesson' },
        overrideAccess: true,
      }),
    ).rejects.toBeTruthy()
  })
})

describe('drafts and access (T09)', () => {
  it('new trips start as drafts and are invisible to anonymous visitors', async () => {
    const trip = await payload.create({
      collection: 'trips',
      draft: true,
      data: { title: 'draft trip', slug: 'draft-trip' },
      overrideAccess: true,
    })
    expect(trip._status).toBe('draft')
    expect(trip.registration?.mode).toBe('none')
    expect((await payload.find({ collection: 'trips', overrideAccess: false })).totalDocs).toBe(0)
    const asEditor = await payload.find({
      collection: 'trips',
      overrideAccess: false,
      user: editor,
      draft: true,
    })
    expect(asEditor.totalDocs).toBeGreaterThan(0)
  })

  it('anonymous visitors cannot write content', async () => {
    await expect(
      payload.create({ collection: 'topics', data: { name: 'x' }, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.create({
        collection: 'events',
        draft: true,
        data: { title: 'x', activityType: 'channeling', start: new Date().toISOString() },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('anonymous visitors cannot read form submissions', async () => {
    await expect(
      payload.find({ collection: 'form-submissions', overrideAccess: false }),
    ).rejects.toMatchObject({
      status: 403,
    })
  })
})

describe('registration mode (T09)', () => {
  it('rejects the reserved "onsite" mode, even in drafts', async () => {
    await expect(
      payload.create({
        collection: 'events',
        draft: true,
        data: {
          title: 'e',
          activityType: 'womensEvenings',
          start: new Date().toISOString(),
          registration: { mode: 'onsite' },
        },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('requires an https link for external mode when publishing', async () => {
    await expect(
      payload.create({
        collection: 'events',
        data: {
          title: 'e',
          activityType: 'womensEvenings',
          start: new Date().toISOString(),
          _status: 'published',
          registration: { mode: 'external', externalUrl: 'http://example.test' },
        },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })
})

describe('testimonials need consent to publish (T09)', () => {
  it('blocks publishing without consent and allows it with consent', async () => {
    await expect(
      payload.create({
        collection: 'testimonials',
        data: { quote: 'q', _status: 'published' },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })

    const draft = await payload.create({
      collection: 'testimonials',
      draft: true,
      data: { quote: 'q' },
      overrideAccess: true,
    })
    await expect(
      payload.update({
        collection: 'testimonials',
        id: draft.id,
        data: { _status: 'published' },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })

    const published = await payload.update({
      collection: 'testimonials',
      id: draft.id,
      data: { _status: 'published', consentConfirmed: true },
      overrideAccess: true,
    })
    expect(published._status).toBe('published')
  })
})

describe('YouTube-only video fields (T09)', () => {
  it('rejects a non-YouTube video URL on publish', async () => {
    await expect(
      payload.create({
        collection: 'parashot',
        data: {
          name: 'p',
          slug: 'video-check',
          book: 'genesis',
          publishDate: new Date().toISOString(),
          videoUrl: 'https://vimeo.com/1',
          _status: 'published',
        },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })
})
