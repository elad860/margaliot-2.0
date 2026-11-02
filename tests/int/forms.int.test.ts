import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Form, User } from '@/payload-types'

import { getTestPayload, strongPassword } from './helpers'

let payload: Payload
let editor: User
let form: Form

const goodData = () => [
  { field: 'name', value: 'בדיקה' },
  { field: 'email', value: 'test@example.test' },
]

beforeAll(async () => {
  payload = await getTestPayload()
  editor = (await payload.create({
    collection: 'users',
    data: { email: 'forms-editor@example.test', password: strongPassword(), roles: ['editor'] },
  })) as User
  form = (await payload.create({
    collection: 'forms',
    overrideAccess: true,
    data: {
      title: 'טופס בדיקה',
      confirmationType: 'redirect',
      redirect: { type: 'custom', url: '/' },
      fields: [
        { blockType: 'text', name: 'name', label: 'שם', required: true },
        { blockType: 'email', name: 'email', label: 'דוא"ל', required: true },
      ],
    } as never,
  })) as Form
})

afterAll(async () => {
  vi.unstubAllGlobals()
  await payload?.destroy()
})

function anonymousSubmit(extra: Record<string, unknown>, submissionData = goodData()) {
  return payload.create({
    collection: 'form-submissions',
    overrideAccess: false,
    data: { form: form.id, submissionData, ...extra } as never,
  })
}

describe('form submissions (T16)', () => {
  it('forms have no e-mail settings (delivery is off until decided)', () => {
    expect(form).not.toHaveProperty('emails')
  })

  it('rejects an anonymous submission without a Turnstile token', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    await expect(anonymousSubmit({})).rejects.toMatchObject({ status: 403 })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a filled honeypot before anything else', async () => {
    await expect(anonymousSubmit({ website: 'spam', turnstileToken: 'x' })).rejects.toMatchObject({
      status: 400,
    })
  })

  it('rejects invalid data server-side', async () => {
    await expect(
      anonymousSubmit({ turnstileToken: 'x' }, [{ field: 'email', value: 'not-an-email' }]),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('accepts a verified submission, stores no token, sends no e-mail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ success: true })))),
    )
    const sendEmail = vi.spyOn(payload, 'sendEmail')
    const created = await anonymousSubmit({ turnstileToken: 'valid-token', website: '' })
    expect(created.id).toBeDefined()
    expect(created).not.toHaveProperty('turnstileToken')
    expect(created).not.toHaveProperty('website')
    expect(sendEmail).not.toHaveBeenCalled()
    sendEmail.mockRestore()
  })

  it('anonymous visitors cannot read submissions; editors can; nobody edits them', async () => {
    await expect(
      payload.find({ collection: 'form-submissions', overrideAccess: false }),
    ).rejects.toMatchObject({
      status: 403,
    })
    const asEditor = await payload.find({
      collection: 'form-submissions',
      overrideAccess: false,
      user: editor,
    })
    expect(asEditor.totalDocs).toBe(1)
    await expect(
      payload.update({
        collection: 'form-submissions',
        id: asEditor.docs[0]!.id,
        data: { submissionData: [] },
        overrideAccess: false,
        user: editor,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rate-limits repeated anonymous submissions', async () => {
    // Earlier tests used 4 of the 5 allowed attempts from this (unknown) client.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ success: true })))),
    )
    await anonymousSubmit({ turnstileToken: 'valid-token' })
    await expect(anonymousSubmit({ turnstileToken: 'valid-token' })).rejects.toMatchObject({ status: 429 })
  })
})
