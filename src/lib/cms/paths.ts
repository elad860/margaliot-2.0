/**
 * Public URL of a CMS document (task T12; ADR-0003). Pure, so it is shared by
 * the admin preview links, revalidation and the sitemap.
 */
import { SITE_MAP, pathFor } from '@/config/site-map'

/** Parent tab slug of each child collection. */
export const CHILD_ROUTES = {
  trips: 'uman-trips',
  parashot: 'parasha',
  lessons: 'online-classes',
} as const

export type ChildCollection = keyof typeof CHILD_ROUTES

export function childPath(collection: ChildCollection, slug: string): string {
  return `/${CHILD_ROUTES[collection]}/${slug}`
}

/** Path for a document, or null if the collection has no public page or the doc has no slug yet. */
export function docPath(
  collection: string,
  doc: { systemKey?: unknown; slug?: unknown } | null | undefined,
): string | null {
  if (!doc) return null
  if (collection === 'pages') {
    const entry = SITE_MAP.find((page) => page.key === doc.systemKey)
    return entry ? pathFor(entry) : null
  }
  if (collection in CHILD_ROUTES && typeof doc.slug === 'string' && doc.slug !== '') {
    return childPath(collection as ChildCollection, doc.slug)
  }
  return null
}

/**
 * A safe in-site redirect target: a single leading slash, no protocol-relative
 * `//`, no backslashes, and not the admin or API.
 */
export function isSafeSitePath(path: unknown): path is string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return false
  if (path.includes('\\') || /[\u0000-\u001f]/.test(path)) return false
  return !/^\/(admin|api)(\/|$|\?)/.test(path)
}
