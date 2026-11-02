import Link from 'next/link'

import { DateText } from '@/components/content/DateText'
import { NoTripState, TripDetails } from '@/components/content/TripDetails'
import { getNextTrip, getTrips } from '@/lib/cms'
import { childPath } from '@/lib/cms/paths'
import type { Page } from '@/payload-types'

import { TemplateFrame } from './TemplateFrame'

/**
 * המסע הקרוב (`next`): the trip selected in SiteSettings.nextTrip, or a neutral
 * empty state (OPEN-DECISIONS #9). Sold-out and registration states are off.
 * מסעות לאומן (`overview`): published trips, newest first.
 */
export async function TripTemplate({ page, mode }: { page: Page; mode: 'next' | 'overview' }) {
  if (mode === 'next') {
    const trip = await getNextTrip()
    return (
      <TemplateFrame page={page} template="trip">
        {trip ? <TripDetails trip={trip} /> : <NoTripState />}
      </TemplateFrame>
    )
  }

  const trips = await getTrips()
  return (
    <TemplateFrame page={page} template="trip">
      {trips.length > 0 ? (
        <ul data-region="trips">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link href={childPath('trips', trip.slug)}>{trip.title}</Link>
              {trip.startDate ? (
                <>
                  {' '}
                  <DateText value={trip.startDate} />
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </TemplateFrame>
  )
}
