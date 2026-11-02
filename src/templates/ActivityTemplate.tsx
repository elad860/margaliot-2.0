import { DateText } from '@/components/content/DateText'
import { RegistrationAction } from '@/components/content/RegistrationAction'
import { PLACEHOLDER } from '@/config/placeholder'
import { getEvents } from '@/lib/cms'
import type { ActivityKey } from '@/lib/cms/queries'
import type { Page } from '@/payload-types'

import { TemplateFrame } from './TemplateFrame'

/** קברי צדיקים בארץ, ערבי נשים, תקשור בציבור, קורס הארת הכלים: upcoming dates from Events. */
export async function ActivityTemplate({ page, activity }: { page: Page; activity: ActivityKey }) {
  const events = await getEvents(activity)
  return (
    <TemplateFrame page={page} template="activity">
      <section aria-labelledby="dates-heading" data-region="events">
        <h2 id="dates-heading">מועדים</h2>
        {events.length === 0 ? (
          <p>{PLACEHOLDER}</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <h3>{event.title}</h3>
                <p>
                  <DateText value={event.start} />
                </p>
                {event.location ? <p>{event.location}</p> : null}
                {event.departurePoint ? <p>{event.departurePoint}</p> : null}
                {event.priceDisplay ? <p>{event.priceDisplay}</p> : null}
                <RegistrationAction registration={event.registration} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </TemplateFrame>
  )
}
