/**
 * JSON-LD helpers (task T15; ARCHITECTURE-PROPOSAL §10 SEO): Organization,
 * BreadcrumbList, Event, TouristTrip. Pure functions; values that are not
 * set are omitted (never invented). URLs are absolute.
 */
import type { Crumb } from '@/lib/navigation'

export type JsonLd = Record<string, unknown> & { '@context': 'https://schema.org'; '@type': string }

const CONTEXT = 'https://schema.org' as const

/** Drops undefined/null/empty values so no empty properties are published. */
function compact<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T
}

export function absoluteUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`).toString()
}

export function organizationJsonLd(args: { name: string; siteUrl: string; sameAs?: string[] }): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': 'Organization',
    name: args.name,
    url: absoluteUrl(args.siteUrl, '/'),
    sameAs: args.sameAs,
  })
}

/** BreadcrumbList; the last crumb (current page) uses `currentPath`. */
export function breadcrumbJsonLd(trail: Crumb[], siteUrl: string, currentPath: string): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: absoluteUrl(siteUrl, crumb.href ?? currentPath),
    })),
  }
}

export function eventJsonLd(args: {
  name: string
  start: string
  end?: string | null
  location?: string | null
  url: string
  organizer: { name: string; url: string }
}): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': 'Event',
    name: args.name,
    startDate: args.start,
    endDate: args.end ?? undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: args.location ? { '@type': 'Place', name: args.location } : undefined,
    url: args.url,
    organizer: { '@type': 'Organization', ...args.organizer },
  })
}

export function touristTripJsonLd(args: {
  name: string
  url: string
  description?: string | null
  places?: string[]
  provider: { name: string; url: string }
}): JsonLd {
  return compact({
    '@context': CONTEXT,
    '@type': 'TouristTrip',
    name: args.name,
    url: args.url,
    description: args.description ?? undefined,
    itinerary:
      args.places && args.places.length > 0
        ? {
            '@type': 'ItemList',
            itemListElement: args.places.map((name, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: { '@type': 'Place', name },
            })),
          }
        : undefined,
    provider: { '@type': 'Organization', ...args.provider },
  })
}

/** Safe serialisation for a <script type="application/ld+json"> body. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}
