/**
 * Navigation data layer (task T13; ARCHITECTURE-PROPOSAL §7; UX review F3, F4, F9, F13).
 *
 * ONE published-only source for every surface that lists pages: header,
 * mobile menu, footer, home-page cards, contact-form topics, breadcrumbs and
 * the sitemap. Pure: it takes the set of published page keys and the
 * Navigation global, so it is fully unit-tested.
 *
 * Rules:
 * - Only published pages appear anywhere. A group with no published tab is hidden.
 * - A group with exactly one published tab is marked `displayAs: 'link'` (UX F4).
 * - Tab order inside a group always follows the registry; header order follows
 *   the Navigation global (default: the 3 groups, then מי אנחנו, יצירת קשר).
 * - Labels and descriptions come from the Navigation global, falling back to
 *   the approved defaults. Empty descriptions are omitted, never invented.
 * - The header CTA exists only while המסע הקרוב is published.
 */
import {
  DEFAULT_HEADER_CTA_LABEL,
  DEFAULT_HEADER_ITEMS,
  HEADER_CTA_PAGE,
  checkHeaderItems,
  type HeaderItem,
} from '@/config/navigation-defaults'
import {
  NAV_GROUPS,
  SITE_MAP,
  getSystemPage,
  pathFor,
  type NavGroupKey,
  type SystemPageKey,
} from '@/config/site-map'

/** The parts of the Navigation global this module reads (all optional: the global may be unsaved). */
export type NavigationSettings = {
  headerItems?: ({ type?: string | null; group?: string | null; page?: string | null } | null)[] | null
  groupLabels?: Partial<Record<NavGroupKey, string | null>> | null
  tabDescriptions?: Partial<Record<SystemPageKey, string | null>> | null
  headerCta?: { label?: string | null } | null
  footerLinks?: ({ label?: string | null; href?: string | null } | null)[] | null
}

export type NavLink = {
  key: SystemPageKey
  label: string
  href: string
  description?: string
}

export type NavGroupEntry = {
  type: 'group'
  key: NavGroupKey
  label: string
  links: NavLink[]
  /** 'link' when the group has a single published tab: render it as a direct link (UX F4). */
  displayAs: 'dropdown' | 'link'
}

export type NavDirectEntry = { type: 'link'; link: NavLink }

export type HeaderEntry = NavGroupEntry | NavDirectEntry

export type SiteNavigation = {
  /** Header items between the logo and the CTA, in display order. */
  header: HeaderEntry[]
  /** The mobile menu uses the same groups and order as the header (UX F3/F7). */
  mobile: HeaderEntry[]
  /** "למסע הקרוב" — null unless /next-trip is published. */
  cta: { label: string; href: string } | null
  footer: {
    groups: { key: NavGroupKey; label: string; links: NavLink[] }[]
    direct: NavLink[]
    legal: NavLink[]
    extra: { label: string; href: string }[]
  }
  /** Published tabs in registry order (home-page cards). */
  publishedTabs: NavLink[]
  /** Published tabs that belong to a group (contact-form topics). */
  contactTopics: NavLink[]
  /** Every published system path (sitemap). */
  publishedPaths: string[]
  home: NavLink | null
}

function clean(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function headerItems(settings: NavigationSettings | null | undefined): readonly HeaderItem[] {
  const items = settings?.headerItems
  return checkHeaderItems(items) === true ? (items as HeaderItem[]) : DEFAULT_HEADER_ITEMS
}

export function groupLabel(key: NavGroupKey, settings?: NavigationSettings | null): string {
  const fallback = NAV_GROUPS.find((g) => g.key === key)?.defaultLabel ?? key
  return clean(settings?.groupLabels?.[key]) ?? fallback
}

export function buildNavigation(
  publishedKeys: Iterable<SystemPageKey>,
  settings?: NavigationSettings | null,
): SiteNavigation {
  const published = new Set(publishedKeys)
  const pages = SITE_MAP.filter((page) => published.has(page.key)) // registry order

  const toLink = (key: SystemPageKey): NavLink => {
    const page = getSystemPage(key)
    const description = clean(settings?.tabDescriptions?.[key])
    return { key, label: page.name, href: pathFor(page), ...(description ? { description } : {}) }
  }

  const groupLinks = (group: NavGroupKey): NavLink[] =>
    pages.filter((page) => page.kind === 'tab' && page.group === group).map((page) => toLink(page.key))

  const header: HeaderEntry[] = []
  for (const item of headerItems(settings)) {
    if (item.type === 'group') {
      const links = groupLinks(item.group)
      if (links.length === 0) continue
      header.push({
        type: 'group',
        key: item.group,
        label: groupLabel(item.group, settings),
        links,
        displayAs: links.length === 1 ? 'link' : 'dropdown',
      })
    } else if (published.has(item.page)) {
      header.push({ type: 'link', link: toLink(item.page) })
    }
  }

  const footerGroups = NAV_GROUPS.map((group) => ({
    key: group.key,
    label: groupLabel(group.key, settings),
    links: groupLinks(group.key).filter((link) => getSystemPage(link.key).inFooter),
  })).filter((group) => group.links.length > 0)

  const publishedTabs = pages.filter((page) => page.kind === 'tab').map((page) => toLink(page.key))

  return {
    header,
    mobile: header,
    cta: published.has(HEADER_CTA_PAGE)
      ? {
          label: clean(settings?.headerCta?.label) ?? DEFAULT_HEADER_CTA_LABEL,
          href: pathFor(getSystemPage(HEADER_CTA_PAGE)),
        }
      : null,
    footer: {
      groups: footerGroups,
      direct: pages
        .filter((page) => page.kind === 'tab' && page.group === null && page.inFooter)
        .map((page) => toLink(page.key)),
      legal: pages.filter((page) => page.kind === 'legal' && page.inFooter).map((page) => toLink(page.key)),
      extra: (settings?.footerLinks ?? []).flatMap((link) => {
        const label = clean(link?.label)
        const href = clean(link?.href)
        return label && href ? [{ label, href }] : []
      }),
    },
    publishedTabs,
    contactTopics: publishedTabs.filter((link) => getSystemPage(link.key).group !== null),
    publishedPaths: pages.map((page) => pathFor(page)),
    home: published.has('home') ? toLink('home') : null,
  }
}

export type Crumb = { label: string; href?: string }

/**
 * Breadcrumb trail for a second-level page, e.g. עמוד הבית ‹ פרשת השבוע ‹ וירא (UX F9).
 * Only published ancestors are included; the current item has no href.
 */
export function breadcrumbTrail(
  publishedKeys: Iterable<SystemPageKey>,
  parent: SystemPageKey,
  current: { label: string },
): Crumb[] {
  const published = new Set(publishedKeys)
  const trail: Crumb[] = []
  for (const key of ['home', parent] as SystemPageKey[]) {
    if (!published.has(key)) continue
    const page = getSystemPage(key)
    trail.push({ label: page.name, href: pathFor(page) })
  }
  trail.push({ label: current.label })
  return trail
}
