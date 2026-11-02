/**
 * Navigation defaults (task T10). Stored as data in the Navigation global and
 * editable there; these values are used when the global has never been saved
 * and as a fallback for empty labels.
 *
 * Header order (RTL, start → end), decided by the main session 2026-11-02 on
 * the approved menu structure (OPEN-DECISIONS #3):
 *   logo · מסעות · פעילויות · לימוד והתחזקות · מי אנחנו · יצירת קשר · "למסע הקרוב" CTA
 * The logo is fixed at the start and the CTA at the end; the five items in
 * between are the editable `headerItems`. The CTA renders only when its
 * destination (/next-trip) is published.
 */
import { NAV_GROUPS, SITE_MAP, type NavGroupKey, type SystemPageKey } from './site-map'

/** Tabs shown in the header as direct links (no group). Unit-tested against the registry. */
export type DirectLinkPageKey = Extract<SystemPageKey, 'about' | 'contact'>

export type HeaderItem = { type: 'group'; group: NavGroupKey } | { type: 'page'; page: DirectLinkPageKey }

/** Tabs that appear in the header as direct links (no group): מי אנחנו, יצירת קשר. */
export const DIRECT_LINK_PAGES = SITE_MAP.filter((page) => page.kind === 'tab' && page.group === null).map(
  (page) => page.key as DirectLinkPageKey,
)

export const DEFAULT_HEADER_ITEMS: readonly HeaderItem[] = [
  ...NAV_GROUPS.map((group): HeaderItem => ({ type: 'group', group: group.key })),
  ...DIRECT_LINK_PAGES.map((page): HeaderItem => ({ type: 'page', page })),
]

/** The header CTA always leads to המסע הקרוב; only its label is editable. */
export const HEADER_CTA_PAGE: SystemPageKey = 'nextTrip'
export const DEFAULT_HEADER_CTA_LABEL = 'למסע הקרוב'

/** Item identity for duplicate checks: "group:trips", "page:about". */
export function headerItemId(item: {
  type?: string | null
  group?: string | null
  page?: string | null
}): string {
  return item.type === 'group' ? `group:${item.group ?? ''}` : `page:${item.page ?? ''}`
}

/**
 * The header must contain every group and every direct link exactly once, in
 * any order, so a tab can never disappear from the menu by an edit.
 */
export function checkHeaderItems(items: unknown): true | string {
  if (!Array.isArray(items)) return 'יש להגדיר את פריטי התפריט.'
  const expected = DEFAULT_HEADER_ITEMS.map(headerItemId).sort()
  const actual = items.map((item) => headerItemId(item ?? {})).sort()
  if (actual.length !== expected.length || actual.some((id, i) => id !== expected[i])) {
    return 'התפריט חייב לכלול את שלוש הקבוצות ואת שני הקישורים הישירים, כל אחד פעם אחת. אפשר לשנות רק את הסדר.'
  }
  return true
}
