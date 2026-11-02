import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/content/Breadcrumbs'
import { DateText } from '@/components/content/DateText'
import { RichTextView } from '@/components/content/RichTextView'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import { getPublishedPageKeys, getPublishedSlugs, getViewer } from '@/lib/cms'
import { loadLessonPage } from '@/lib/cms/child-pages'
import { childPath } from '@/lib/cms/paths'
import { getServerEnv, isProduction } from '@/lib/env'
import { breadcrumbTrail } from '@/lib/navigation'
import { breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, mediaShareUrl } from '@/lib/seo/metadata'
import { NOT_FOUND_METADATA, defaultShareImage } from '@/lib/seo/page-metadata'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getPublishedSlugs('lessons')).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = await loadLessonPage((await params).slug)
  if (!lesson) return NOT_FOUND_METADATA
  const [viewer, fallbackImage] = await Promise.all([getViewer(), defaultShareImage()])
  return buildMetadata({
    title: lesson.meta?.title?.trim() || lesson.title,
    description: lesson.meta?.description,
    path: childPath('lessons', lesson.slug),
    image: mediaShareUrl(lesson.meta?.image) ?? fallbackImage,
    noindex: viewer.draft,
    production: isProduction(),
  })
}

/** A single lesson at /online-classes/[slug] (unstyled stub). */
export default async function LessonPage({ params }: Props) {
  const lesson = await loadLessonPage((await params).slug)
  if (!lesson) notFound()
  const keys = await getPublishedPageKeys()
  const trail = breadcrumbTrail(keys, 'onlineClasses', { label: lesson.title })
  return (
    <>
      <Breadcrumbs trail={trail} />
      <JsonLdScript
        data={breadcrumbJsonLd(trail, getServerEnv().NEXT_PUBLIC_SITE_URL, childPath('lessons', lesson.slug))}
      />
      <article data-template="library">
        <h1>{lesson.title}</h1>
        {lesson.kind === 'live' && lesson.liveStart ? (
          <p>
            <DateText value={lesson.liveStart} />
          </p>
        ) : null}
        <RichTextView data={lesson.body} />
      </article>
    </>
  )
}
