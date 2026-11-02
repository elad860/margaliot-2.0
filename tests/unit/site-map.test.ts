import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  NAV_GROUPS,
  SITE_MAP,
  SYSTEM_SLUGS,
  TABS,
  findBySlug,
  getSystemPage,
  pathFor,
} from '@/config/site-map'
import { RESERVED_SLUGS, isReservedFutureRoute, isSystemRoute } from '@/config/reserved-routes'

import fixture from '../fixtures/claude-md-tabs.json'

const root = path.resolve(__dirname, '../..')

/** Reads the numbered tab list straight from CLAUDE.md, so the fixture cannot drift. */
function tabsFromClaudeMd(): string[] {
  const text = readFileSync(path.join(root, 'CLAUDE.md'), 'utf8')
  const section = text.split('## The 11 tabs')[1]?.split('\n## ')[0] ?? ''
  return [...section.matchAll(/^\d+\.\s+(.+?)\s*$/gm)].map((m) => m[1] ?? '')
}

describe('site-map registry: the 11 tabs', () => {
  it('has exactly 15 entries: home + 11 tabs + 3 legal pages', () => {
    expect(SITE_MAP).toHaveLength(15)
    expect(SITE_MAP.filter((p) => p.kind === 'home')).toHaveLength(1)
    expect(TABS).toHaveLength(11)
    expect(SITE_MAP.filter((p) => p.kind === 'legal')).toHaveLength(3)
  })

  it('fixture matches CLAUDE.md exactly', () => {
    expect(tabsFromClaudeMd()).toEqual(fixture.tabs)
  })

  it('tab names and order match the fixture character for character', () => {
    expect(TABS.map((t) => t.name)).toEqual(fixture.tabs)
    // Strict per-character comparison (catches invisible differences such as RLM marks or niqqud).
    TABS.forEach((tab, i) => {
      expect([...tab.name].map((c) => c.codePointAt(0))).toEqual(
        [...(fixture.tabs[i] ?? '')].map((c) => c.codePointAt(0)),
      )
    })
  })

  it('tab order values run 1..11 in CLAUDE.md order', () => {
    expect(TABS.map((t) => t.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    const sorted = [...SITE_MAP].sort((a, b) => a.order - b.order)
    expect(sorted.map((p) => p.key)).toEqual(SITE_MAP.map((p) => p.key))
  })

  it('names contain no stray whitespace or directional control characters', () => {
    for (const page of SITE_MAP) {
      expect(page.name).toBe(page.name.trim())
      expect(page.name).not.toMatch(/[‎‏‪-‮⁦-⁩]/)
    }
  })
})

describe('site-map registry: routes (ADR-0003)', () => {
  it('uses the approved English slugs', () => {
    expect(Object.fromEntries(SITE_MAP.map((p) => [p.name, pathFor(p)]))).toEqual({
      'עמוד הבית': '/',
      'מי אנחנו': '/about',
      'פגישת ייעוץ': '/consultation',
      'המסע הקרוב': '/next-trip',
      'מסעות לאומן': '/uman-trips',
      'קברי צדיקים בארץ': '/tzadikim-israel',
      'ערבי נשים': '/womens-evenings',
      'תקשור בציבור': '/channeling',
      'קורס הארת הכלים': '/tools-course',
      'פרשת השבוע': '/parasha',
      'שיעורי התחזקות אונליין': '/online-classes',
      'יצירת קשר': '/contact',
      'תקנון ומדיניות ביטול': '/terms',
      'מדיניות פרטיות': '/privacy',
      'הצהרת נגישות': '/accessibility',
    })
  })

  it('keys and slugs are unique', () => {
    expect(new Set(SITE_MAP.map((p) => p.key)).size).toBe(SITE_MAP.length)
    expect(new Set(SITE_MAP.map((p) => p.slug)).size).toBe(SITE_MAP.length)
  })

  it('slugs are lowercase Latin, digits and hyphens only', () => {
    for (const slug of SYSTEM_SLUGS) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('no slug collides with a reserved or system route', () => {
    for (const page of SITE_MAP.filter((p) => p.slug)) {
      expect(RESERVED_SLUGS).not.toContain(page.slug)
      expect(isReservedFutureRoute(pathFor(page))).toBe(false)
      expect(isSystemRoute(pathFor(page))).toBe(false)
    }
  })

  it('resolves slugs and keys', () => {
    expect(findBySlug('next-trip')?.name).toBe('המסע הקרוב')
    expect(findBySlug('')).toBeUndefined()
    expect(findBySlug('register')).toBeUndefined()
    expect(getSystemPage('contact').slug).toBe('contact')
  })
})

describe('site-map registry: templates and navigation groups', () => {
  it('assigns the templates from ADR-0004', () => {
    const byTemplate = (t: string) => SITE_MAP.filter((p) => p.template === t).map((p) => p.key)
    expect(byTemplate('home')).toEqual(['home'])
    expect(byTemplate('information')).toEqual(['about', 'consultation', 'contact'])
    expect(byTemplate('trip')).toEqual(['nextTrip', 'umanTrips'])
    expect(byTemplate('activity')).toEqual(['tzadikimIsrael', 'womensEvenings', 'channeling', 'toolsCourse'])
    expect(byTemplate('library')).toEqual(['parasha', 'onlineClasses'])
    expect(byTemplate('legal')).toEqual(['terms', 'privacy', 'accessibility'])
  })

  it('has the 3 approved groups with the approved labels, in order', () => {
    expect(NAV_GROUPS.map((g) => [g.key, g.defaultLabel])).toEqual([
      ['trips', 'מסעות'],
      ['activities', 'פעילויות'],
      ['learning', 'לימוד והתחזקות'],
    ])
  })

  it('places tabs in the approved groups (owner decision 2026-11-02)', () => {
    const members = (g: string) => TABS.filter((t) => t.group === g).map((t) => t.name)
    expect(members('trips')).toEqual(['המסע הקרוב', 'מסעות לאומן', 'קברי צדיקים בארץ'])
    expect(members('activities')).toEqual(['פגישת ייעוץ', 'ערבי נשים', 'תקשור בציבור', 'קורס הארת הכלים'])
    expect(members('learning')).toEqual(['פרשת השבוע', 'שיעורי התחזקות אונליין'])
    expect(TABS.filter((t) => t.group === null).map((t) => t.name)).toEqual(['מי אנחנו', 'יצירת קשר'])
  })

  it('lists every tab and legal page in the footer, not the home page', () => {
    expect(SITE_MAP.filter((p) => p.inFooter).map((p) => p.kind)).not.toContain('home')
    expect(SITE_MAP.filter((p) => p.inFooter)).toHaveLength(14)
    expect(SITE_MAP.filter((p) => p.kind === 'legal').every((p) => p.group === null)).toBe(true)
  })
})
