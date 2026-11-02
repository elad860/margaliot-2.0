import { PLACEHOLDER } from '@/config/placeholder'
import type { Trip } from '@/payload-types'

import { DateText } from './DateText'
import { RegistrationAction } from './RegistrationAction'
import { RichTextView } from './RichTextView'

/**
 * Trip details (unstyled stub, T14). Every part renders only when filled.
 * `titleAs` lets /next-trip keep the page name as its h1 (trip title becomes h2).
 */
export function TripDetails({ trip, titleAs: Title = 'h2' }: { trip: Trip; titleAs?: 'h1' | 'h2' }) {
  const Sub = Title === 'h1' ? 'h2' : 'h3'
  return (
    <article data-region="trip">
      <Title>{trip.title}</Title>
      {trip.startDate ? (
        <p>
          <DateText value={trip.startDate} />
          {trip.endDate ? (
            <>
              {' – '}
              <DateText value={trip.endDate} />
            </>
          ) : null}
        </p>
      ) : null}
      {trip.summary ? <p>{trip.summary}</p> : null}
      {trip.priceDisplay ? <p>{trip.priceDisplay}</p> : null}
      {trip.tziunim?.length ? (
        <ul>
          {trip.tziunim.map((tziun, i) => (
            <li key={tziun.id ?? i}>{tziun.name}</li>
          ))}
        </ul>
      ) : null}
      {trip.itinerary?.length ? (
        <ol>
          {trip.itinerary.map((day, i) => (
            <li key={day.id ?? i}>
              <Sub>{day.title}</Sub>
              {day.description ? <p>{day.description}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
      <RichTextView data={trip.included} />
      {trip.faq?.length ? (
        <dl>
          {trip.faq.map((item, i) => (
            <div key={item.id ?? i}>
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <RegistrationAction registration={trip.registration} />
    </article>
  )
}

/** /next-trip with no published trip selected (OPEN-DECISIONS #9): neutral, placeholder only. */
export function NoTripState() {
  return (
    <section data-state="no-trip">
      <p>{PLACEHOLDER}</p>
    </section>
  )
}
