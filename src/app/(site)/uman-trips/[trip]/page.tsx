import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/content/Breadcrumbs'
import { TripDetails } from '@/components/content/TripDetails'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import { getPublishedPageKeys, getPublishedSlugs, getSiteSettings, getViewer } from '@/lib/cms'
import { loadTripPage } from '@/lib/cms/child-pages'
import { childPath } from '@/lib/cms/paths'
import { nextTripId } from '@/lib/cms/queries'
import { getServerEnv, isProduction } from '@/lib/env'
import { breadcrumbTrail } from '@/lib/navigation'
import { absoluteUrl, breadcrumbJsonLd } from '@/lib/seo/json-ld'
import { buildMetadata, mediaShareUrl, tripCanonicalPath } from '@/lib/seo/metadata'
import { NOT_FOUND_METADATA, defaultShareImage } from '@/lib/seo/page-metadata'

type Props = { params: Promise<{ trip: string }> }

export async function generateStaticParams() {
  return (await getPublishedSlugs('trips')).map(({ slug }) => ({ trip: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trip = await loadTripPage((await params).trip)
  if (!trip) return NOT_FOUND_METADATA
  const [viewer, settings, keys, fallbackImage] = await Promise.all([
    getViewer(),
    getSiteSettings(),
    getPublishedPageKeys(),
    defaultShareImage(),
  ])
  return buildMetadata({
    title: trip.meta?.title?.trim() || trip.title,
    description: trip.meta?.description ?? trip.summary,
    // ADR-0003: while this trip is the selected next trip, /next-trip is canonical.
    path: tripCanonicalPath({
      tripId: trip.id,
      tripPath: childPath('trips', trip.slug),
      nextTripId: nextTripId(settings),
      nextTripPagePublished: keys.includes('nextTrip'),
    }),
    image: mediaShareUrl(trip.meta?.image) ?? fallbackImage,
    noindex: viewer.draft,
    production: isProduction(),
  })
}

/** A single trip at /uman-trips/[trip]. */
export default async function TripPage({ params }: Props) {
  const trip = await loadTripPage((await params).trip)
  if (!trip) notFound()
  const [keys, settings] = await Promise.all([getPublishedPageKeys(), getSiteSettings()])
  const siteUrl = getServerEnv().NEXT_PUBLIC_SITE_URL
  const path = childPath('trips', trip.slug)
  const canonical = tripCanonicalPath({
    tripId: trip.id,
    tripPath: path,
    nextTripId: nextTripId(settings),
    nextTripPagePublished: keys.includes('nextTrip'),
  })
  const trail = breadcrumbTrail(keys, 'umanTrips', { label: trip.title })
  return (
    <>
      <Breadcrumbs trail={trail} />
      <JsonLdScript data={breadcrumbJsonLd(trail, siteUrl, path)} />
      <TripDetails trip={trip} titleAs="h1" url={absoluteUrl(siteUrl, canonical)} />
    </>
  )
}
