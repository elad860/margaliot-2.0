import type { Metadata } from 'next'

import { getSystemPage, pathFor, type SystemPageKey } from '@/config/site-map'
import { getMedia, getPage, getSiteSettings, getViewer } from '@/lib/cms'
import { isProduction } from '@/lib/env'
import { SITE_NAME, buildMetadata, mediaShareUrl } from '@/lib/seo/metadata'

/** Metadata for 404s: never indexed. */
export const NOT_FOUND_METADATA: Metadata = { title: 'הדף לא נמצא', robots: { index: false, follow: false } }

/** Default share image from SiteSettings, if any. */
export async function defaultShareImage(): Promise<string | null> {
  const settings = await getSiteSettings()
  const ref = settings.defaultSeoImage
  return mediaShareUrl(typeof ref === 'number' ? await getMedia(ref) : ref)
}

/** Metadata for one of the 15 system pages. */
export async function systemPageMetadata(key: SystemPageKey): Promise<Metadata> {
  const page = await getPage(key)
  if (!page) return NOT_FOUND_METADATA
  const [viewer, fallbackImage, settings] = await Promise.all([
    getViewer(),
    defaultShareImage(),
    getSiteSettings(),
  ])
  const isHome = key === 'home'
  return buildMetadata({
    title: page.meta?.title?.trim() || (isHome ? settings.organisationName?.trim() || SITE_NAME : page.title),
    description: page.meta?.description,
    path: pathFor(getSystemPage(key)),
    image: mediaShareUrl(page.meta?.image) ?? fallbackImage,
    noindex: viewer.draft,
    production: isProduction(),
    absoluteTitle: isHome,
  })
}
