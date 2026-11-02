/**
 * Metadata builder (T14/T15; ARCHITECTURE-PROPOSAL §10 SEO).
 *
 * - Title template "%s | מרגליות" (set in the root layout); home uses an absolute title.
 * - Canonical URL on every page (relative; resolved against metadataBase).
 *   Tracking parameters never reach the canonical because it is built from the path.
 * - Open Graph / WhatsApp preview with the page image or the site default.
 * - noindex whenever the environment is not production, or a draft is previewed.
 */
import type { Metadata } from 'next'

import type { Media } from '@/payload-types'

export const SITE_NAME = 'מרגליות'

export type MetadataInput = {
  title: string
  description?: string | null
  path: string
  image?: string | null
  /** Force noindex (preview, 404). */
  noindex?: boolean
  /** Production flag from env; anything else is always noindex (ADR-0002). */
  production: boolean
  absoluteTitle?: boolean
}

export function buildMetadata(input: MetadataInput): Metadata {
  const description = input.description?.trim() || undefined
  const noindex = input.noindex || !input.production
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description,
      url: input.path,
      siteName: SITE_NAME,
      locale: 'he_IL',
      type: 'website',
      ...(input.image ? { images: [{ url: input.image }] } : {}),
    },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  }
}

/** Best share-image URL of a populated Media document (the 1200×630 "og" size if present). */
export function mediaShareUrl(media: number | Media | null | undefined): string | null {
  if (!media || typeof media === 'number') return null
  return media.sizes?.og?.url ?? media.url ?? null
}

/** The canonical path of a trip page (ADR-0003): /next-trip while it is the selected, published next trip. */
export function tripCanonicalPath(args: {
  tripId: number
  tripPath: string
  nextTripId: number | null
  nextTripPagePublished: boolean
}): string {
  return args.nextTripPagePublished && args.nextTripId === args.tripId ? '/next-trip' : args.tripPath
}
