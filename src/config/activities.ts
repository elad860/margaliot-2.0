/**
 * Activity tabs that have dated events (Events.activityType; ADR-0004).
 * Derived from the site-map registry: every page that uses the "activity" template.
 */
import { SITE_MAP, TABS, type SystemPageKey } from './site-map'

export const ACTIVITY_PAGES = SITE_MAP.filter((page) => page.template === 'activity')

export const ACTIVITY_KEYS = ACTIVITY_PAGES.map((page) => page.key) as SystemPageKey[]

/** Select options (value = registry key, label = fixed Hebrew name). */
export const activityOptions = ACTIVITY_PAGES.map((page) => ({ value: page.key, label: page.name }))

/** Select options for all 11 tabs (Testimonials.activities). */
export const tabOptions = TABS.map((page) => ({ value: page.key, label: page.name }))
