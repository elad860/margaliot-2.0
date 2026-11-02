import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/content/Breadcrumbs'
import { DateText } from '@/components/content/DateText'
import { RichTextView } from '@/components/content/RichTextView'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import { getPublishedPageKeys, getPublishedSlugs, getViewer } from '@/lib/cms'
import { loadParashaPage } from '@/lib/cms/child-pages'
import { childPath } from '@/lib/cms/paths'
import { getServerEnv, isProduction } from '@/lib/env'
import { breadcrumbTrail } from '@/lib/navigation'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, mediaShareUrl } from '@/lib/seo/metadata'
import { NOT_FOUND_METADATA, defaultShareImage } from '@/lib/seo/page-metadata'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getPublishedSlugs('parashot')).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const parasha = await loadParashaPage((await params).slug)
  if (!parasha) return NOT_FOUND_METADATA
  const [viewer, fallbackImage] = await Promise.all([getViewer(), defaultShareImage()])
  return buildMetadata({
    title: parasha.meta?.title?.trim() || parasha.name,
    description: parasha.meta?.description,
    path: childPath('parashot', parasha.slug),
    image: mediaShareUrl(parasha.meta?.image) ?? mediaShareUrl(parasha.image) ?? fallbackImage,
    noindex: viewer.draft,
    production: isProduction(),
  })
}

/** A single parasha at /parasha/[slug] (unstyled stub; video renderer comes with T29). */
export default async function ParashaItemPage({ params }: Props) {
  const parasha = await loadParashaPage((await params).slug)
  if (!parasha) notFound()
  const keys = await getPublishedPageKeys()
  const trail = breadcrumbTrail(keys, 'parasha', { label: parasha.name })
  return (
    <>
      <Breadcrumbs trail={trail} />
      <JsonLdScript
        data={breadcrumbJsonLd(
          trail,
          getServerEnv().NEXT_PUBLIC_SITE_URL,
          childPath('parashot', parasha.slug),
        )}
      />
      <article data-template="library">
        <h1>{parasha.name}</h1>
        <p>
          <DateText value={parasha.publishDate} />
        </p>
        <RichTextView data={parasha.body} />
      </article>
    </>
  )
}
