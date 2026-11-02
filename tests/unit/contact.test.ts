import { describe, expect, it } from 'vitest'

import { getContactDetails, getSocialLinks, hasAnyContact, whatsappHref } from '@/lib/contact'

describe('getSocialLinks (T13)', () => {
  it('returns nothing for empty settings', () => {
    expect(getSocialLinks(undefined)).toEqual([])
    expect(getSocialLinks({})).toEqual([])
    expect(getSocialLinks({ socials: { instagram: '', tiktok: null, youtube: '  ' } })).toEqual([])
  })

  it('omits empty and invalid entries and keeps a fixed order', () => {
    const links = getSocialLinks({
      socials: {
        tiktok: 'https://www.tiktok.com/@x',
        instagram: 'https://www.instagram.com/x',
        youtube: '#',
        whatsappCommunity: 'https://example.test/x',
      },
    })
    expect(links.map((l) => l.key)).toEqual(['instagram', 'tiktok'])
    expect(links[0]).toEqual({ key: 'instagram', label: 'אינסטגרם', href: 'https://www.instagram.com/x' })
  })
})

describe('whatsappHref (T13)', () => {
  it('is null without a valid number', () => {
    expect(whatsappHref(undefined)).toBeNull()
    expect(whatsappHref('')).toBeNull()
    expect(whatsappHref('123')).toBeNull()
  })

  it('builds a wa.me link with the page message, else the default', () => {
    expect(whatsappHref('+1 555 010 0000')).toBe('https://wa.me/15550100000')
    expect(whatsappHref('+15550100000', 'שלום', 'ברירת מחדל')).toBe(
      `https://wa.me/15550100000?text=${encodeURIComponent('שלום')}`,
    )
    expect(whatsappHref('+15550100000', '', 'ברירת מחדל')).toBe(
      `https://wa.me/15550100000?text=${encodeURIComponent('ברירת מחדל')}`,
    )
  })
})

describe('getContactDetails (T13)', () => {
  it('is empty for empty settings', () => {
    expect(getContactDetails({})).toEqual({ phones: [], email: null, whatsapp: null, officeHours: null })
    expect(hasAnyContact({})).toBe(false)
    expect(hasAnyContact({ phones: [], socials: {} })).toBe(false)
  })

  it('returns only what is set', () => {
    const details = getContactDetails({
      phones: [{ number: '+1 555 010 0000' }, { number: 'bad' }],
      email: 'office@example.test',
    })
    expect(details.phones).toEqual([{ number: '+1 555 010 0000', href: 'tel:+15550100000' }])
    expect(details.email).toEqual({ address: 'office@example.test', href: 'mailto:office@example.test' })
    expect(details.whatsapp).toBeNull()
    expect(hasAnyContact({ email: 'office@example.test' })).toBe(true)
  })
})
