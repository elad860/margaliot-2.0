import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seedSystemPages } from '@/cms/seed/system-pages'
import type { Page, User } from '@/payload-types'

import { getTestPayload, strongPassword } from './helpers'

let payload: Payload
let editor: User

async function pageByKey(key: string): Promise<Page> {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { systemKey: { equals: key } },
    draft: true,
    overrideAccess: true,
    limit: 1,
  })
  return docs[0]!
}

beforeAll(async () => {
  payload = await getTestPayload()
  await seedSystemPages(payload)
  editor = (await payload.create({
    collection: 'users',
    data: { email: 'blocks-editor@example.test', password: strongPassword(), roles: ['editor'] },
  })) as User
})

afterAll(async () => {
  await payload?.destroy()
})

describe('Pages.layout per-template allow-lists (T11)', () => {
  it('seeded pages start with an empty layout', async () => {
    expect((await pageByKey('home')).layout ?? []).toEqual([])
  })

  it('accepts an allowed block in a draft and keeps its variant', async () => {
    const page = await pageByKey('parasha')
    const updated = await payload.update({
      collection: 'pages',
      id: page.id,
      draft: true,
      overrideAccess: false,
      user: editor,
      data: { layout: [{ blockType: 'cta' }] },
    })
    expect(updated.layout?.[0]).toMatchObject({ blockType: 'cta', variant: 'default' })
    expect(updated._status).toBe('draft')
  })

  it('rejects a block the template does not allow, even in a draft', async () => {
    const page = await pageByKey('parasha') // library: no form block
    await expect(
      payload.update({
        collection: 'pages',
        id: page.id,
        draft: true,
        overrideAccess: false,
        user: editor,
        data: { layout: [{ blockType: 'form' } as never] },
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('legal pages accept no blocks', async () => {
    const page = await pageByKey('privacy')
    await expect(
      payload.update({
        collection: 'pages',
        id: page.id,
        draft: true,
        overrideAccess: true,
        data: { layout: [{ blockType: 'hero' }] },
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('a Video block only accepts YouTube links when publishing', async () => {
    const page = await pageByKey('about')
    await expect(
      payload.update({
        collection: 'pages',
        id: page.id,
        overrideAccess: true,
        data: {
          _status: 'published',
          layout: [{ blockType: 'video', url: 'https://vimeo.com/1', title: 't' }],
        },
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
    expect((await payload.find({ collection: 'pages', overrideAccess: false })).totalDocs).toBe(0)
  })

  it('a CTA block defaults to no registration button and rejects "onsite"', async () => {
    const page = await pageByKey('home')
    const updated = await payload.update({
      collection: 'pages',
      id: page.id,
      draft: true,
      overrideAccess: true,
      data: { layout: [{ blockType: 'cta', heading: '[תוכן יתווסף]' }] },
    })
    const cta = updated.layout?.[0]
    expect(cta?.blockType === 'cta' && cta.registration?.mode).toBe('none')
    await expect(
      payload.update({
        collection: 'pages',
        id: page.id,
        draft: true,
        overrideAccess: true,
        data: { layout: [{ blockType: 'cta', registration: { mode: 'onsite' } }] },
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })
})
