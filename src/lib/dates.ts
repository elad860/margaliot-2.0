/**
 * Date formatting: Gregorian and Hebrew calendars via the built-in Intl API
 * (ARCHITECTURE-PROPOSAL §3.1; no dependency). Times are shown in Israel time.
 */
export const SITE_TIME_ZONE = 'Asia/Jerusalem'

const gregorian = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: SITE_TIME_ZONE,
})
const hebrew = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: SITE_TIME_ZONE,
})
const time = new Intl.DateTimeFormat('he-IL', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: SITE_TIME_ZONE,
})

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "12 בספטמבר 2026" */
export function formatGregorian(value: string | Date | null | undefined): string | null {
  const date = toDate(value)
  return date ? gregorian.format(date) : null
}

/** Hebrew-calendar date as produced by Intl, e.g. "1 בתשרי 5787". */
export function formatHebrew(value: string | Date | null | undefined): string | null {
  const date = toDate(value)
  return date ? hebrew.format(date) : null
}

export function formatTime(value: string | Date | null | undefined): string | null {
  const date = toDate(value)
  return date ? time.format(date) : null
}

/** ISO string for <time dateTime>. */
export function isoDate(value: string | Date | null | undefined): string | undefined {
  return toDate(value)?.toISOString()
}
