import { formatGregorian, formatHebrew, isoDate } from '@/lib/dates'

/** A date in both calendars: "12 בספטמבר 2026 · 1 בתשרי 5787" (unstyled). */
export function DateText({ value }: { value: string | null | undefined }) {
  const gregorian = formatGregorian(value)
  if (!gregorian) return null
  const hebrew = formatHebrew(value)
  return (
    <time dateTime={isoDate(value)}>
      {gregorian}
      {hebrew ? ` (${hebrew})` : null}
    </time>
  )
}
