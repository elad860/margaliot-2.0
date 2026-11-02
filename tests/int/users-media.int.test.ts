import type { Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'

import { getTestPayload, strongPassword } from './helpers'

let payload: Payload
let admin: User
let editor: User

async function tinyPng(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } } })
    .png()
    .toBuffer()
}

beforeAll(async () => {
  payload = await getTestPayload()
  // First account: created like /admin/create-first-user would, without roles → becomes admin.
  admin = (await payload.create({
    collection: 'users',
    data: { email: 'first@example.test', password: strongPassword() } as never,
  })) as User
  editor = (await payload.create({
    collection: 'users',
    data: { email: 'editor@example.test', password: strongPassword(), roles: ['editor'] },
  })) as User
})

afterAll(async () => {
  await payload?.destroy()
})

describe('Users: roles and access (T07)', () => {
  it('makes the very first account an admin', () => {
    expect(admin.roles).toEqual(['admin'])
    expect(editor.roles).toEqual(['editor'])
  })

  it('denies anonymous reads of users', async () => {
    await expect(payload.find({ collection: 'users', overrideAccess: false })).rejects.toMatchObject({
      status: 403,
    })
  })

  it('lets an editor see only their own account', async () => {
    const result = await payload.find({ collection: 'users', overrideAccess: false, user: editor })
    expect(result.docs.map((u) => u.id)).toEqual([editor.id])
  })

  it('does not let an editor create, delete or edit other users', async () => {
    await expect(
      payload.create({
        collection: 'users',
        data: { email: 'x@example.test', password: strongPassword(), roles: ['editor'] },
        overrideAccess: false,
        user: editor,
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.delete({ collection: 'users', id: admin.id, overrideAccess: false, user: editor }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.update({
        collection: 'users',
        id: admin.id,
        data: { name: 'x' },
        overrideAccess: false,
        user: editor,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('does not let an editor promote themselves', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: editor.id,
      data: { roles: ['admin'] },
      overrideAccess: false,
      user: editor,
    })
    expect(updated.roles).toEqual(['editor'])
  })

  it('lets an admin create users', async () => {
    const created = await payload.create({
      collection: 'users',
      data: { email: 'second-admin@example.test', password: strongPassword(), roles: ['admin'] },
      overrideAccess: false,
      user: admin,
    })
    expect(created.roles).toEqual(['admin'])
    await payload.delete({ collection: 'users', id: created.id, overrideAccess: false, user: admin })
  })

  it('never removes the last admin', async () => {
    await expect(
      payload.update({
        collection: 'users',
        id: admin.id,
        data: { roles: ['editor'] },
        overrideAccess: false,
        user: admin,
      }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      payload.delete({ collection: 'users', id: admin.id, overrideAccess: false, user: admin }),
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('Users: password policy and lockout (T07)', () => {
  it.each(['short', 'aaaaaaaaaaaa', 'password1234', 'weakuser-is-here-123'])(
    'rejects "%s"',
    async (password) => {
      await expect(
        payload.create({
          collection: 'users',
          data: { email: 'weakuser@example.test', password, roles: ['editor'] },
        }),
      ).rejects.toMatchObject({ name: 'ValidationError' })
    },
  )

  it('applies the policy to password changes and resets', async () => {
    await expect(
      payload.update({ collection: 'users', id: editor.id, data: { password: 'short' } as never }),
    ).rejects.toMatchObject({ name: 'ValidationError' })

    const token = await payload.forgotPassword({
      collection: 'users',
      data: { email: editor.email },
      disableEmail: true,
    })
    expect(token).toBeTruthy()
    await expect(
      payload.resetPassword({
        collection: 'users',
        data: { token: token as string, password: 'short' },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('locks an account after 5 failed logins', async () => {
    const email = 'lockme@example.test'
    await payload.create({
      collection: 'users',
      data: { email, password: strongPassword(), roles: ['editor'] },
    })
    for (let i = 0; i < 5; i++) {
      await expect(
        payload.login({ collection: 'users', data: { email, password: 'wrong-password-123' } }),
      ).rejects.toBeTruthy()
    }
    await expect(
      payload.login({ collection: 'users', data: { email, password: 'wrong-password-123' } }),
    ).rejects.toMatchObject({ name: 'LockedAuth' })
  })
})

describe('Media (T07)', () => {
  it('rejects an upload without alt text', async () => {
    const data = await tinyPng()
    await expect(
      payload.create({
        collection: 'media',
        data: {} as never,
        file: { data, mimetype: 'image/png', name: 'no-alt.png', size: data.length },
        overrideAccess: false,
        user: editor,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('accepts an upload with alt text and generates the image sizes', async () => {
    const data = await tinyPng()
    const doc = await payload.create({
      collection: 'media',
      data: { alt: 'בדיקה' },
      file: { data, mimetype: 'image/png', name: 'with-alt.png', size: data.length },
      overrideAccess: false,
      user: editor,
    })
    expect(doc.alt).toBe('בדיקה')
    expect(Object.keys(doc.sizes ?? {})).toEqual(expect.arrayContaining(['thumbnail', 'card', 'hero', 'og']))
    await payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
  })

  it('rejects non-image uploads such as SVG', async () => {
    const data = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'x' },
        file: { data, mimetype: 'image/svg+xml', name: 'x.svg', size: data.length },
        overrideAccess: true,
      }),
    ).rejects.toBeTruthy()
  })

  it('does not let anonymous visitors upload', async () => {
    const data = await tinyPng()
    await expect(
      payload.create({
        collection: 'media',
        data: { alt: 'x' },
        file: { data, mimetype: 'image/png', name: 'anon.png', size: data.length },
        overrideAccess: false,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })
})
