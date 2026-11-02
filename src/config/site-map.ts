/**
 * THE site-map registry (task T06; ADR-0003, approved 2026-11-02).
 *
 * Fixed facts that editors must not change live here, in code, under test:
 * the exact Hebrew names and order of the 11 tabs (CLAUDE.md), the home and
 * legal pages, their URL slugs, templates and default menu group.
 *
 * Changing a name, the order, a slug or a group is an owner decision and a
 * reviewed code change — never a CMS edit. tests/unit/site-map.test.ts fails
 * if a tab name differs from CLAUDE.md by even one character.
 *
 * Editable facts (group labels, per-tab descriptions, publish status) live in
 * the CMS (Navigation global, Pages collection).
 */

export type TemplateKey = 'home' | 'information' | 'trip' | 'activity' | 'library' | 'legal'

export type PageKind = 'home' | 'tab' | 'legal'

/** Menu groups approved 2026-11-02 (OPEN-DECISIONS #3). */
export type NavGroupKey = 'trips' | 'activities' | 'learning'

export type NavGroup = {
  key: NavGroupKey
  /** Approved default label. The Navigation global (T10) may override the label, not the membership. */
  defaultLabel: string
  order: number
}

export const NAV_GROUPS: readonly NavGroup[] = [
  { key: 'trips', defaultLabel: 'מסעות', order: 1 },
  { key: 'activities', defaultLabel: 'פעילויות', order: 2 },
  { key: 'learning', defaultLabel: 'לימוד והתחזקות', order: 3 },
] as const

export type SystemPageKey =
  | 'home'
  | 'about'
  | 'consultation'
  | 'nextTrip'
  | 'umanTrips'
  | 'tzadikimIsrael'
  | 'womensEvenings'
  | 'channeling'
  | 'toolsCourse'
  | 'parasha'
  | 'onlineClasses'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'accessibility'

export type SystemPage = {
  /** Stable identifier, stored as Pages.systemKey. Never changes, even if the slug does. */
  key: SystemPageKey
  /** Exact Hebrew name. For tabs: exactly as in CLAUDE.md. */
  name: string
  kind: PageKind
  /** Global order: home = 0, tabs 1–11 as in CLAUDE.md, legal pages after. */
  order: number
  /** URL segment without slashes; '' for the home page. */
  slug: string
  template: TemplateKey
  /** Default menu group; null = direct link in the header (מי אנחנו, יצירת קשר) or not in the header at all. */
  group: NavGroupKey | null
  /** Listed in the footer (when published). */
  inFooter: boolean
}

// One page per line keeps the registry reviewable as a table.
// prettier-ignore
export const SITE_MAP: readonly SystemPage[] = [
  { key: 'home', name: 'עמוד הבית', kind: 'home', order: 0, slug: '', template: 'home', group: null, inFooter: false },

  // The 11 tabs — names and order fixed by CLAUDE.md.
  { key: 'about', name: 'מי אנחנו', kind: 'tab', order: 1, slug: 'about', template: 'information', group: null, inFooter: true },
  { key: 'consultation', name: 'פגישת ייעוץ', kind: 'tab', order: 2, slug: 'consultation', template: 'information', group: 'activities', inFooter: true },
  { key: 'nextTrip', name: 'המסע הקרוב', kind: 'tab', order: 3, slug: 'next-trip', template: 'trip', group: 'trips', inFooter: true },
  { key: 'umanTrips', name: 'מסעות לאומן', kind: 'tab', order: 4, slug: 'uman-trips', template: 'trip', group: 'trips', inFooter: true },
  { key: 'tzadikimIsrael', name: 'קברי צדיקים בארץ', kind: 'tab', order: 5, slug: 'tzadikim-israel', template: 'activity', group: 'trips', inFooter: true },
  { key: 'womensEvenings', name: 'ערבי נשים', kind: 'tab', order: 6, slug: 'womens-evenings', template: 'activity', group: 'activities', inFooter: true },
  { key: 'channeling', name: 'תקשור בציבור', kind: 'tab', order: 7, slug: 'channeling', template: 'activity', group: 'activities', inFooter: true },
  { key: 'toolsCourse', name: 'קורס הארת הכלים', kind: 'tab', order: 8, slug: 'tools-course', template: 'activity', group: 'activities', inFooter: true },
  { key: 'parasha', name: 'פרשת השבוע', kind: 'tab', order: 9, slug: 'parasha', template: 'library', group: 'learning', inFooter: true },
  { key: 'onlineClasses', name: 'שיעורי התחזקות אונליין', kind: 'tab', order: 10, slug: 'online-classes', template: 'library', group: 'learning', inFooter: true },
  { key: 'contact', name: 'יצירת קשר', kind: 'tab', order: 11, slug: 'contact', template: 'information', group: null, inFooter: true },

  // Legal pages (footer only).
  { key: 'terms', name: 'תקנון ומדיניות ביטול', kind: 'legal', order: 12, slug: 'terms', template: 'legal', group: null, inFooter: true },
  { key: 'privacy', name: 'מדיניות פרטיות', kind: 'legal', order: 13, slug: 'privacy', template: 'legal', group: null, inFooter: true },
  { key: 'accessibility', name: 'הצהרת נגישות', kind: 'legal', order: 14, slug: 'accessibility', template: 'legal', group: null, inFooter: true },
] as const

/** The 11 tabs, in CLAUDE.md order. */
export const TABS: readonly SystemPage[] = SITE_MAP.filter((p) => p.kind === 'tab')

/** Public path of a system page ('/' for home). */
export function pathFor(page: Pick<SystemPage, 'slug'>): string {
  return page.slug === '' ? '/' : `/${page.slug}`
}

export function getSystemPage(key: SystemPageKey): SystemPage {
  const page = SITE_MAP.find((p) => p.key === key)
  if (!page) throw new Error(`Unknown system page key: ${key}`)
  return page
}

/** Resolve a single URL segment to a tab or legal page (not home). */
export function findBySlug(slug: string): SystemPage | undefined {
  if (!slug) return undefined
  return SITE_MAP.find((p) => p.slug === slug)
}

/** All non-empty system slugs ('about', 'next-trip', …). */
export const SYSTEM_SLUGS: readonly string[] = SITE_MAP.map((p) => p.slug).filter(Boolean)
