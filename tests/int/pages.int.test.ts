import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SITE_MAP } from '@/config/site-map'
import { PLACEHOLDER, seedSystemPages } from '@/cms/seed/system-pages'
import type { Page, User } from '@/payload-types'

import { getTestPayload, strongPassword } from './helpers'

let payload: Payload
let admin: User
let editor: User

async function pageByKey(key: string): Promise<Page> {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { systemKey: { equals: key } },
    draft: true,
    overrideAccess: true,
    limit: 1,
  })
  const doc = docs[0]
  if (!doc) throw new Error(`page ${key} not found`)
  return doc
}

beforeAll(async () => {
  payload = await getTestPayload()
  admin = (await payload.create({
    collection: 'users',
    data: { email: 'pages-admin@example.test', password: strongPassword() } as never,
  })) as User
  editor = (await payload.create({
    collection: 'users',
    data: { email: 'pages-editor@example.test', password: strongPassword(), roles: ['editor'] },
  })) as User
})

afterAll(async () => {
  await payload?.destroy()
})

describe('seed (T08)', () => {
  it('creates the 15 system pages as drafts, with registry names and only the placeholder', async () => {
    const first = await seedSystemPages(payload)
    expect(first.created).toHaveLength(15)

    const { docs } = await payload.find({
      collection: 'pages',
      draft: true,
      overrideAccess: true,
      limit: 100,
      sort: 'order',
    })
    expect(docs).toHaveLength(15)
    expect(docs.map((d) => d.title)).toEqual(SITE_MAP.map((p) => p.name))
    expect(docs.map((d) => d.slug ?? '')).toEqual(SITE_MAP.map((p) => p.slug))
    for (const doc of docs) {
      expect(doc._status).toBe('draft')
      expect(doc.hero?.heading ?? null).toBeNull()
      expect(doc.hero?.subheading).toBe(PLACEHOLDER)
    }
  })

  it('is idempotent and never overwrites existing pages', async () => {
    const about = await pageByKey('about')
    await payload.update({
      collection: 'pages',
      id: about.id,
      data: { whatsappMessage: 'edited' },
      draft: true,
      overrideAccess: true,
    })

    const second = await seedSystemPages(payload)
    expect(second.created).toHaveLength(0)
    expect(second.existing).toHaveLength(15)
    expect((await payload.count({ collection: 'pages', overrideAccess: true })).totalDocs).toBe(15)
    expect((await pageByKey('about')).whatsappMessage).toBe('edited')
  })

  it('publishes nothing', async () => {
    const published = await payload.find({
      collection: 'pages',
      where: { _status: { equals: 'published' } },
      overrideAccess: true,
    })
    expect(published.totalDocs).toBe(0)
    const versions = await payload.findVersions({
      collection: 'pages',
      where: { 'version._status': { equals: 'published' } },
      overrideAccess: true,
    })
    expect(versions.totalDocs).toBe(0)
  })

  it('creates no users', async () => {
    expect((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs).toBe(2)
  })
})

describe('draft pages are not public (T08)', () => {
  it('returns no pages to anonymous visitors', async () => {
    const anon = await payload.find({ collection: 'pages', overrideAccess: false })
    expect(anon.totalDocs).toBe(0)
    const anonDraft = await payload.find({ collection: 'pages', overrideAccess: false, draft: true })
    expect(anonDraft.totalDocs).toBe(0)
  })

  it('denies an anonymous direct read of a draft page', async () => {
    const home = await pageByKey('home')
    await expect(
      payload.findByID({ collection: 'pages', id: home.id, overrideAccess: false }),
    ).rejects.toBeTruthy()
  })

  it('lets staff see drafts', async () => {
    const asEditor = await payload.find({
      collection: 'pages',
      overrideAccess: false,
      user: editor,
      draft: true,
    })
    expect(asEditor.totalDocs).toBe(15)
  })
})

describe('system pages are locked (T08)', () => {
  it('an editor cannot delete a system page, and neither can an admin', async () => {
    const contact = await pageByKey('contact')
    await expect(
      payload.delete({ collection: 'pages', id: contact.id, overrideAccess: false, user: editor }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.delete({ collection: 'pages', id: contact.id, overrideAccess: false, user: admin }),
    ).rejects.toBeTruthy()
    expect((await payload.count({ collection: 'pages', overrideAccess: true })).totalDocs).toBe(15)
  })

  it('an editor cannot rename a page or change its URL, template or key', async () => {
    const page = await pageByKey('womensEvenings')
    const updated = await payload.update({
      collection: 'pages',
      id: page.id,
      draft: true,
      overrideAccess: false,
      user: editor,
      data: { title: 'שם אחר', slug: 'other', template: 'legal', systemKey: 'contact', order: 99 } as never,
    })
    expect(updated.title).toBe('ערבי נשים')
    expect(updated.slug).toBe('womens-evenings')
    expect(updated.template).toBe('activity')
    expect(updated.systemKey).toBe('womensEvenings')
    expect(updated.order).toBe(6)
  })

  it('an editor can edit content and save a draft, which stays unpublished', async () => {
    const page = await pageByKey('parasha')
    const updated = await payload.update({
      collection: 'pages',
      id: page.id,
      draft: true,
      overrideAccess: false,
      user: editor,
      data: { hero: { subheading: PLACEHOLDER } },
    })
    expect(updated._status).toBe('draft')
    expect((await payload.find({ collection: 'pages', overrideAccess: false })).totalDocs).toBe(0)
  })

  it('an editor cannot create pages', async () => {
    await expect(
      payload.create({
        collection: 'pages',
        data: { systemKey: 'home', title: 'x' },
        overrideAccess: false,
        user: editor,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rejects a page without a registry key, and a second page for the same key', async () => {
    await expect(
      payload.create({ collection: 'pages', data: { title: 'x' } as never, overrideAccess: true }),
    ).rejects.toBeTruthy()
    await expect(
      payload.create({
        collection: 'pages',
        data: { systemKey: 'home', title: 'x' },
        draft: true,
        overrideAccess: true,
      }),
    ).rejects.toBeTruthy()
  })

  it('accepts only site paths or https links for the primary action', async () => {
    const page = await pageByKey('consultation')
    // Payload validates fields when publishing (draft saves are not validated), so try to publish.
    for (const href of ['javascript:alert(1)', 'http://example.test', '//evil.test']) {
      await expect(
        payload.update({
          collection: 'pages',
          id: page.id,
          overrideAccess: true,
          data: { _status: 'published', primaryAction: { href } },
        }),
      ).rejects.toMatchObject({ name: 'ValidationError' })
    }
    expect((await payload.find({ collection: 'pages', overrideAccess: false })).totalDocs).toBe(0)
    const ok = await payload.update({
      collection: 'pages',
      id: page.id,
      draft: true,
      overrideAccess: true,
      data: { primaryAction: { href: '/contact' } },
    })
    expect(ok.primaryAction?.href).toBe('/contact')
  })
})
