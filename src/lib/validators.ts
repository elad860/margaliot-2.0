/**
 * Pure validators shared by CMS fields and the site (tasks T09–T11).
 * Each returns `true` when valid, otherwise a Hebrew message for the admin UI.
 * They are pure so they can be unit-tested without a database.
 */
import { RESERVED_SLUGS } from '@/config/reserved-routes'
import { SYSTEM_SLUGS } from '@/config/site-map'

export type ValidationResult = true | string

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SLUG_MAX_LENGTH = 80

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

/**
 * URL slug for child items (trips, parashot, lessons; ADR-0003):
 * lowercase Latin letters, digits and single hyphens only, and never a
 * registry slug or a reserved route segment.
 */
export function checkSlug(value: unknown): ValidationResult {
  if (isEmpty(value)) return 'יש להזין כתובת (slug).'
  if (typeof value !== 'string') return 'כתובת לא תקינה.'
  if (value.length > SLUG_MAX_LENGTH) return `הכתובת יכולה להכיל עד ${SLUG_MAX_LENGTH} תווים.`
  if (!SLUG_PATTERN.test(value)) {
    return 'הכתובת יכולה להכיל רק אותיות אנגליות קטנות, ספרות ומקפים בודדים (למשל: example-page).'
  }
  if (RESERVED_SLUGS.includes(value)) return 'הכתובת הזו שמורה למערכת. יש לבחור כתובת אחרת.'
  if (SYSTEM_SLUGS.includes(value))
    return 'הכתובת הזו כבר שייכת לאחד מעמודי האתר הקבועים. יש לבחור כתובת אחרת.'
  return true
}

/** Optional absolute https:// URL. `#`, http://, javascript: and relative values are rejected. */
export function checkHttpsUrl(value: unknown): ValidationResult {
  if (isEmpty(value)) return true
  if (typeof value !== 'string') return 'כתובת לא תקינה.'
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname.includes('.')) {
      return 'יש להזין כתובת מלאה שמתחילה ב-https://'
    }
    return true
  } catch {
    return 'יש להזין כתובת מלאה שמתחילה ב-https://'
  }
}

/** Optional link: a site path (/contact) or an absolute https:// URL. */
export function checkLinkHref(value: unknown): ValidationResult {
  if (isEmpty(value)) return true
  if (typeof value === 'string' && /^\/(?!\/)\S*$/.test(value)) return true
  return checkHttpsUrl(value) === true ? true : 'יש להזין כתובת באתר (מתחילה ב-/) או כתובת https:// מלאה.'
}

/** Optional https URL whose host is one of `hosts` (or a subdomain of one). */
export function checkUrlOnHosts(
  value: unknown,
  hosts: readonly string[],
  siteName: string,
): ValidationResult {
  if (isEmpty(value)) return true
  const https = checkHttpsUrl(value)
  if (https !== true) return https
  const host = new URL(String(value)).hostname.toLowerCase()
  const ok = hosts.some((h) => host === h || host.endsWith(`.${h}`))
  return ok ? true : `יש להזין קישור של ${siteName}.`
}

/**
 * Phone / WhatsApp number in international form: optional +, then 9–15 digits.
 * Spaces and hyphens are allowed for readability and stripped by `normalisePhone`.
 */
export function checkPhone(value: unknown): ValidationResult {
  if (isEmpty(value)) return true
  if (typeof value !== 'string') return 'מספר לא תקין.'
  const digits = normalisePhone(value)
  if (!/^\+?\d{9,15}$/.test(digits)) return 'יש להזין מספר טלפון תקין: 9–15 ספרות, אפשר עם + בהתחלה.'
  return true
}

export function normalisePhone(value: string): string {
  return value.replace(/[\s\-().]/g, '')
}
