import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'

import { disallowedBlocks } from '@/blocks/allowed'

/**
 * Rejects blocks that the page's template does not allow (task T11).
 * Runs after lockSystemPageFields, so `data.template` comes from the registry.
 * Unlike field validation, hooks also run for draft saves and API writes.
 */
export const enforceTemplateBlocks: CollectionBeforeChangeHook = ({ data, collection }) => {
  const rejected = disallowedBlocks(data.template, data.layout)
  if (rejected.length > 0) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [
        {
          path: 'layout',
          message: `הרכיבים הבאים אינם זמינים בתבנית של עמוד זה: ${[...new Set(rejected)].join(', ')}`,
        },
      ],
    })
  }
  return data
}
