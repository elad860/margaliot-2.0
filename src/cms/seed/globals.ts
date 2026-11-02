import type { Payload } from 'payload'

import { DEFAULT_HEADER_CTA_LABEL, DEFAULT_HEADER_ITEMS } from '@/config/navigation-defaults'
import { NAV_GROUPS } from '@/config/site-map'

/**
 * Saves the Navigation global once with the registry-provided defaults
 * (header order, approved group labels, CTA label), so they exist as editable
 * data (task T10). Never overwrites a saved Navigation.
 *
 * SiteSettings is deliberately NOT seeded: contact details, socials and the
 * WhatsApp number stay empty until the owner supplies them.
 */
export async function seedNavigation(payload: Payload): Promise<'created' | 'existing'> {
  const current = await payload.findGlobal({ slug: 'navigation', overrideAccess: true, depth: 0 })
  if (current.createdAt) return 'existing'
  await payload.updateGlobal({
    slug: 'navigation',
    overrideAccess: true,
    data: {
      headerItems: DEFAULT_HEADER_ITEMS.map((item) => ({ ...item })),
      groupLabels: Object.fromEntries(NAV_GROUPS.map((g) => [g.key, g.defaultLabel])),
      headerCta: { label: DEFAULT_HEADER_CTA_LABEL },
    },
  })
  return 'created'
}
