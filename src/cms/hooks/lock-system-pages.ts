import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

import { SITE_MAP, type SystemPageKey } from '@/config/site-map'

/**
 * System pages (home, 11 tabs, legal) take their title, slug, template and
 * order from the code registry, whatever the request sends (task T08,
 * ADR-0003/0004). Editors therefore cannot rename a tab or change its URL.
 * The systemKey itself cannot change after creation.
 */
export const lockSystemPageFields: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
  collection,
}) => {
  const key = (operation === 'update' ? originalDoc?.systemKey : data.systemKey) as SystemPageKey | undefined
  const entry = SITE_MAP.find((page) => page.key === key)
  if (!entry) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [{ path: 'systemKey', message: 'עמוד חייב להיות משויך לאחד מעמודי האתר הקבועים.' }],
    })
  }
  return {
    ...data,
    systemKey: entry.key,
    title: entry.name,
    slug: entry.slug,
    template: entry.template,
    order: entry.order,
  }
}
