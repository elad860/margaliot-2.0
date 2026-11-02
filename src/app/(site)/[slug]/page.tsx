import { notFound } from 'next/navigation'

import { SITE_MAP, findBySlug } from '@/config/site-map'
import { CHILD_ROUTES } from '@/lib/cms/paths'
import { NOT_FOUND_METADATA, systemPageMetadata } from '@/lib/seo/page-metadata'
import { SystemPageView } from '@/templates/SystemPageView'

/** Tabs that have their own route folder because they also have child pages. */
const OWN_FOLDERS = new Set<string>(Object.values(CHILD_ROUTES))

/** Only registry slugs exist; every other single-segment URL is a 404 without rendering (ADR-0003). */
export const dynamicParams = false

export function generateStaticParams() {
  return SITE_MAP.filter((page) => page.slug && !OWN_FOLDERS.has(page.slug)).map((page) => ({
    slug: page.slug,
  }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const entry = findBySlug((await params).slug)
  return entry ? systemPageMetadata(entry.key) : NOT_FOUND_METADATA
}

/** Tab and legal pages, resolved through the registry; unpublished pages are 404s. */
export default async function SystemPage({ params }: Props) {
  const { slug } = await params
  const entry = findBySlug(slug)
  if (!entry || OWN_FOLDERS.has(slug)) notFound()
  return <SystemPageView pageKey={entry.key} />
}
