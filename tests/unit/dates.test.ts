import { describe, expect, it } from 'vitest'

import { formatGregorian, formatHebrew, formatTime, isoDate } from '@/lib/dates'

describe('dates', () => {
  it('formats Gregorian and Hebrew dates in Israel time', () => {
    expect(formatGregorian('2026-09-12T12:00:00Z')).toBe('12 בספטמבר 2026')
    expect(formatHebrew('2026-09-12T12:00:00Z')).toContain('תשרי')
    expect(formatTime('2026-09-12T17:30:00Z')).toBe('20:30')
  })

  it('returns null for missing or invalid input', () => {
    expect(formatGregorian(null)).toBeNull()
    expect(formatHebrew('nope')).toBeNull()
    expect(isoDate(undefined)).toBeUndefined()
  })
})
