import { describe, expect, it } from 'vitest'

import { DEFAULT_HEADER_ITEMS } from '@/config/navigation-defaults'
import { SITE_MAP, TABS, type SystemPageKey } from '@/config/site-map'
import { breadcrumbTrail, buildNavigation, type NavGroupEntry } from '@/lib/navigation'

const ALL = SITE_MAP.map((p) => p.key)

describe('buildNavigation (T13)', () => {
  it('with nothing published there are no groups, links, CTA or footer entries', () => {
    const nav = buildNavigation([])
    expect(nav.header).toEqual([])
    expect(nav.mobile).toEqual([])
    expect(nav.cta).toBeNull()
    expect(nav.footer).toEqual({ groups: [], direct: [], legal: [], extra: [] })
    expect(nav.publishedTabs).toEqual([])
    expect(nav.contactTopics).toEqual([])
    expect(nav.publishedPaths).toEqual([])
    expect(nav.home).toBeNull()
  })

  it('publishing ערבי נשים alone shows only its group, containing only that tab', () => {
    const nav = buildNavigation(['womensEvenings'])
    expect(nav.header).toEqual([
      {
        type: 'group',
        key: 'activities',
        label: 'פעילויות',
        links: [{ key: 'womensEvenings', label: 'ערבי נשים', href: '/womens-evenings' }],
        displayAs: 'link',
      },
    ])
    expect(nav.cta).toBeNull()
    expect(nav.publishedPaths).toEqual(['/womens-evenings'])
    expect(nav.footer.groups).toHaveLength(1)
  })

  it('keeps registry order inside groups regardless of publish order', () => {
    const nav = buildNavigation(['toolsCourse', 'consultation', 'channeling', 'womensEvenings'])
    const group = nav.header[0] as NavGroupEntry
    expect(group.links.map((l) => l.label)).toEqual([
      'פגישת ייעוץ',
      'ערבי נשים',
      'תקשור בציבור',
      'קורס הארת הכלים',
    ])
    expect(group.displayAs).toBe('dropdown')
  })

  it('with everything published follows the approved header order', () => {
    const nav = buildNavigation(ALL)
    expect(nav.header.map((e) => (e.type === 'group' ? e.label : e.link.label))).toEqual([
      'מסעות',
      'פעילויות',
      'לימוד והתחזקות',
      'מי אנחנו',
      'יצירת קשר',
    ])
    const trips = nav.header[0] as NavGroupEntry
    expect(trips.links.map((l) => l.label)).toEqual(['המסע הקרוב', 'מסעות לאומן', 'קברי צדיקים בארץ'])
    expect(nav.cta).toEqual({ label: 'למסע הקרוב', href: '/next-trip' })
    expect(nav.publishedTabs.map((t) => t.label)).toEqual(TABS.map((t) => t.name))
    expect(nav.footer.legal.map((l) => l.href)).toEqual(['/terms', '/privacy', '/accessibility'])
    expect(nav.footer.direct.map((l) => l.href)).toEqual(['/about', '/contact'])
    expect(nav.contactTopics.map((l) => l.key)).not.toContain('about')
    expect(nav.contactTopics.map((l) => l.key)).not.toContain('contact')
    expect(nav.publishedPaths).toHaveLength(15)
    expect(nav.home?.href).toBe('/')
  })

  it('takes labels, descriptions, CTA label, order and footer links from the Navigation global', () => {
    const nav = buildNavigation(ALL, {
      headerItems: [...DEFAULT_HEADER_ITEMS].reverse(),
      groupLabels: { trips: 'מסעות וסיורים', activities: '  ' },
      tabDescriptions: { parasha: 'שורת תיאור', about: '' },
      headerCta: { label: 'תווית אחרת' },
      footerLinks: [
        { label: 'קישור', href: '/x' },
        { label: '', href: '/y' },
      ],
    })
    expect(nav.header[0]).toMatchObject({ type: 'link', link: { key: 'contact' } })
    const labels = nav.header.filter((e): e is NavGroupEntry => e.type === 'group').map((g) => g.label)
    expect(labels).toEqual(['לימוד והתחזקות', 'פעילויות', 'מסעות וסיורים'])
    const learning = nav.header.find((e) => e.type === 'group' && e.key === 'learning') as NavGroupEntry
    expect(learning.links[0]).toMatchObject({ key: 'parasha', description: 'שורת תיאור' })
    expect(nav.header.find((e) => e.type === 'link' && e.link.key === 'about')).not.toHaveProperty(
      'link.description',
    )
    expect(nav.cta?.label).toBe('תווית אחרת')
    expect(nav.footer.extra).toEqual([{ label: 'קישור', href: '/x' }])
  })

  it('ignores an invalid header order from the global and falls back to the default', () => {
    const nav = buildNavigation(ALL, { headerItems: [{ type: 'page', page: 'about' }] })
    expect(nav.header).toHaveLength(5)
    expect(nav.header[0]).toMatchObject({ type: 'group', key: 'trips' })
  })

  it('never lists a draft anywhere', () => {
    const published: SystemPageKey[] = ['about', 'parasha', 'terms']
    const nav = buildNavigation(published)
    const everyHref = [
      ...nav.header.flatMap((e) => (e.type === 'group' ? e.links : [e.link])).map((l) => l.href),
      ...nav.footer.groups.flatMap((g) => g.links.map((l) => l.href)),
      ...nav.footer.direct.map((l) => l.href),
      ...nav.footer.legal.map((l) => l.href),
      ...nav.publishedTabs.map((l) => l.href),
      ...nav.contactTopics.map((l) => l.href),
      ...nav.publishedPaths,
    ]
    expect(new Set(everyHref)).toEqual(new Set(['/about', '/parasha', '/terms']))
  })
})

describe('breadcrumbTrail (T13)', () => {
  it('includes only published ancestors', () => {
    expect(breadcrumbTrail(['home', 'parasha'], 'parasha', { label: 'וירא' })).toEqual([
      { label: 'עמוד הבית', href: '/' },
      { label: 'פרשת השבוע', href: '/parasha' },
      { label: 'וירא' },
    ])
    expect(breadcrumbTrail(['parasha'], 'parasha', { label: 'וירא' })).toEqual([
      { label: 'פרשת השבוע', href: '/parasha' },
      { label: 'וירא' },
    ])
  })
})
