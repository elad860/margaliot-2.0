/**
 * SEO helpers (T15). JSON-LD is checked against the schema.org shapes we
 * publish: required properties present, correct @type nesting, absolute URLs,
 * no empty values, and safe serialisation.
 */
import { describe, expect, it } from 'vitest'

import {
  absoluteUrl,
  breadcrumbJsonLd,
  eventJsonLd,
  organizationJsonLd,
  serializeJsonLd,
  touristTripJsonLd,
  type JsonLd,
} from '@/lib/seo/json-ld'
import { buildMetadata, mediaShareUrl, tripCanonicalPath } from '@/lib/seo/metadata'

const SITE = 'https://preview.example.test'
const ORG = { name: 'מרגליות', url: `${SITE}/` }

/** Minimal schema.org conformance for the types we emit. */
const REQUIRED: Record<string, string[]> = {
  Organization: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position'],
  Event: ['name', 'startDate'],
  Place: ['name'],
  TouristTrip: ['name'],
  ItemList: ['itemListElement'],
}

function validate(node: unknown, path = '$'): string[] {
  const errors: string[] = []
  if (Array.isArray(node)) {
    node.forEach((child, i) => errors.push(...validate(child, `${path}[${i}]`)))
    return errors
  }
  if (node === null || typeof node !== 'object') return errors
  const obj = node as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') errors.push(`${path}.${key} is empty`)
    if (key === 'url' || key === 'item') {
      if (typeof value === 'string' && !/^https:\/\//.test(value))
        errors.push(`${path}.${key} is not absolute`)
    }
    errors.push(...validate(value, `${path}.${key}`))
  }
  const type = obj['@type']
  if (typeof type === 'string') {
    for (const prop of REQUIRED[type] ?? [])
      if (!(prop in obj)) errors.push(`${path} (${type}) missing ${prop}`)
  }
  return errors
}

function expectValid(data: JsonLd | JsonLd[]) {
  for (const node of Array.isArray(data) ? data : [data]) {
    expect(node['@context']).toBe('https://schema.org')
    expect(typeof node['@type']).toBe('string')
  }
  expect(validate(data)).toEqual([])
  expect(() => JSON.parse(serializeJsonLd(data))).not.toThrow()
}

describe('JSON-LD (T15)', () => {
  it('Organization, without invented sameAs', () => {
    const org = organizationJsonLd({ name: 'מרגליות', siteUrl: SITE })
    expectValid(org)
    expect(org).not.toHaveProperty('sameAs')
    expect(
      organizationJsonLd({ name: 'מרגליות', siteUrl: SITE, sameAs: ['https://www.instagram.com/x'] }).sameAs,
    ).toEqual(['https://www.instagram.com/x'])
  })

  it('BreadcrumbList with absolute URLs and positions', () => {
    const data = breadcrumbJsonLd(
      [{ label: 'עמוד הבית', href: '/' }, { label: 'פרשת השבוע', href: '/parasha' }, { label: 'וירא' }],
      SITE,
      '/parasha/vayera',
    )
    expectValid(data)
    expect(
      (data.itemListElement as { item: string; position: number }[]).map((i) => [i.position, i.item]),
    ).toEqual([
      [1, `${SITE}/`],
      [2, `${SITE}/parasha`],
      [3, `${SITE}/parasha/vayera`],
    ])
  })

  it('Event omits what is not set', () => {
    const data = eventJsonLd({
      name: 'e',
      start: '2027-01-01T18:00:00.000Z',
      url: `${SITE}/channeling`,
      organizer: ORG,
    })
    expectValid(data)
    expect(data).not.toHaveProperty('location')
    expect(data).not.toHaveProperty('endDate')
    expectValid(
      eventJsonLd({
        name: 'e',
        start: '2027-01-01T18:00:00.000Z',
        end: '2027-01-01T20:00:00.000Z',
        location: 'x',
        url: `${SITE}/channeling`,
        organizer: ORG,
      }),
    )
  })

  it('TouristTrip with an itinerary of places, never a price', () => {
    const data = touristTripJsonLd({
      name: 't',
      url: `${SITE}/next-trip`,
      places: ['א', 'ב'],
      provider: ORG,
    })
    expectValid(data)
    expect(JSON.stringify(data)).not.toMatch(/offers|price/i)
    expect(
      touristTripJsonLd({ name: 't', url: `${SITE}/next-trip`, places: [], provider: ORG }),
    ).not.toHaveProperty('itinerary')
  })

  it('serialisation cannot break out of the script tag', () => {
    const out = serializeJsonLd(
      organizationJsonLd({ name: '</script><script>alert(1)</script>', siteUrl: SITE }),
    )
    expect(out).not.toContain('</script>')
    expect(out).not.toContain('<')
  })

  it('absoluteUrl joins paths onto the site URL', () => {
    expect(absoluteUrl('https://a.test', '/x')).toBe('https://a.test/x')
    expect(absoluteUrl('https://a.test/', '/')).toBe('https://a.test/')
  })
})

describe('metadata builder (T15)', () => {
  it('is noindex outside production and for previews', () => {
    expect(buildMetadata({ title: 't', path: '/x', production: false }).robots).toEqual({
      index: false,
      follow: false,
    })
    expect(buildMetadata({ title: 't', path: '/x', production: true, noindex: true }).robots).toEqual({
      index: false,
      follow: false,
    })
    expect(buildMetadata({ title: 't', path: '/x', production: true }).robots).toEqual({
      index: true,
      follow: true,
    })
  })

  it('sets canonical, OG and title template behaviour', () => {
    const md = buildMetadata({
      title: 'מי אנחנו',
      path: '/about',
      production: true,
      image: '/og.jpg',
      description: ' ',
    })
    expect(md.alternates?.canonical).toBe('/about')
    expect(md.title).toBe('מי אנחנו')
    expect(md.description).toBeUndefined()
    expect(md.openGraph).toMatchObject({ url: '/about', locale: 'he_IL', images: [{ url: '/og.jpg' }] })
    expect(
      buildMetadata({ title: 'מרגליות', path: '/', production: true, absoluteTitle: true }).title,
    ).toEqual({
      absolute: 'מרגליות',
    })
  })

  it('trip canonical points at /next-trip only while selected and published (ADR-0003)', () => {
    const base = { tripId: 7, tripPath: '/uman-trips/x' }
    expect(tripCanonicalPath({ ...base, nextTripId: 7, nextTripPagePublished: true })).toBe('/next-trip')
    expect(tripCanonicalPath({ ...base, nextTripId: 7, nextTripPagePublished: false })).toBe('/uman-trips/x')
    expect(tripCanonicalPath({ ...base, nextTripId: 8, nextTripPagePublished: true })).toBe('/uman-trips/x')
    expect(tripCanonicalPath({ ...base, nextTripId: null, nextTripPagePublished: true })).toBe(
      '/uman-trips/x',
    )
  })

  it('prefers the og image size', () => {
    expect(mediaShareUrl(null)).toBeNull()
    expect(mediaShareUrl(3)).toBeNull()
    expect(mediaShareUrl({ url: '/a.jpg', sizes: { og: { url: '/a-og.jpg' } } } as never)).toBe('/a-og.jpg')
    expect(mediaShareUrl({ url: '/a.jpg' } as never)).toBe('/a.jpg')
  })
})
