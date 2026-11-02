import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seedNavigation } from '@/cms/seed/globals'
import { DEFAULT_HEADER_ITEMS } from '@/config/navigation-defaults'
import type { User } from '@/payload-types'

import { getTestPayload, strongPassword } from './helpers'

let payload: Payload
let editor: User

beforeAll(async () => {
  payload = await getTestPayload()
  editor = (await payload.create({
    collection: 'users',
    data: { email: 'globals-editor@example.test', password: strongPassword(), roles: ['editor'] },
  })) as User
})

afterAll(async () => {
  await payload?.destroy()
})

describe('SiteSettings is empty by default (T10)', () => {
  it('has no phone, WhatsApp number, e-mail, social link or address', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    expect(settings.phones ?? []).toEqual([])
    expect(settings.whatsappNumber ?? null).toBeNull()
    expect(settings.email ?? null).toBeNull()
    expect(settings.defaultWhatsappMessage ?? null).toBeNull()
    expect(settings.officeHours ?? null).toBeNull()
    expect(settings.nextTrip ?? null).toBeNull()
    expect(Object.values(settings.socials ?? {}).filter(Boolean)).toEqual([])
    expect(Object.values(settings.accessibilityCoordinator ?? {}).filter(Boolean)).toEqual([])
  })

  it('rejects placeholder or foreign social links and malformed numbers', async () => {
    for (const data of [
      { socials: { instagram: '#' } },
      { socials: { instagram: 'https://example.test/x' } },
      { socials: { tiktok: 'http://www.tiktok.com/@x' } },
      { whatsappNumber: '12' },
      { phones: [{ number: 'abc' }] },
    ]) {
      await expect(
        payload.updateGlobal({ slug: 'site-settings', data, overrideAccess: true }),
      ).rejects.toMatchObject({ name: 'ValidationError' })
    }
  })

  it('anonymous visitors can read but not update settings', async () => {
    await expect(payload.findGlobal({ slug: 'site-settings', overrideAccess: false })).resolves.toBeTruthy()
    await expect(
      payload.updateGlobal({ slug: 'site-settings', data: { tagline: 'x' }, overrideAccess: false }),
    ).rejects.toMatchObject({ status: 403 })
  })
})

describe('Navigation defaults (T10)', () => {
  it('seeds the approved header order and labels once', async () => {
    expect(await seedNavigation(payload)).toBe('created')
    const nav = await payload.findGlobal({ slug: 'navigation', overrideAccess: true })
    expect(nav.headerItems?.map(({ type, group, page }) => (type === 'group' ? group : page))).toEqual([
      'trips',
      'activities',
      'learning',
      'about',
      'contact',
    ])
    expect(nav.groupLabels).toMatchObject({
      trips: 'מסעות',
      activities: 'פעילויות',
      learning: 'לימוד והתחזקות',
    })
    expect(nav.headerCta?.label).toBe('למסע הקרוב')
    expect(Object.values(nav.tabDescriptions ?? {}).filter(Boolean)).toEqual([])
    expect(nav.footerLinks ?? []).toEqual([])
    expect(await seedNavigation(payload)).toBe('existing')
  })

  it('lets an editor reorder the header items but not drop or duplicate one', async () => {
    const reordered = [...DEFAULT_HEADER_ITEMS].reverse().map((item) => ({ ...item }))
    const saved = await payload.updateGlobal({
      slug: 'navigation',
      data: { headerItems: reordered },
      overrideAccess: false,
      user: editor,
    })
    expect(saved.headerItems?.[0]).toMatchObject({ type: 'page', page: 'contact' })

    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        data: { headerItems: reordered.slice(1) },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        data: { headerItems: [...reordered.slice(1), { type: 'group', group: 'trips' }] },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('rejects unsafe extra footer links', async () => {
    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        data: { footerLinks: [{ label: 'x', href: 'javascript:alert(1)' }] },
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })
})
