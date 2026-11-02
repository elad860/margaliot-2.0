import type { FieldHook, TextField } from 'payload'
import { ValidationError } from 'payload'

import { checkSlug } from '@/lib/validators'

/**
 * Payload skips field `validate` when saving a draft, so the format and
 * reserved-word rules are also enforced in a beforeChange hook, which runs
 * for drafts too. Uniqueness is guaranteed by the database index.
 */
const enforceSlugRules: FieldHook = ({ value, collection }) => {
  if (value === undefined || value === null || value === '') return value
  const result = checkSlug(value)
  if (result !== true) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [{ path: 'slug', message: result }],
    })
  }
  return value
}

/** Shared `slug` field for child items (Trips, Parashot, Lessons; ADR-0003). */
export function slugField(
  description = 'חלק הכתובת של העמוד באתר. אותיות אנגליות קטנות, ספרות ומקפים בלבד.',
): TextField {
  return {
    name: 'slug',
    type: 'text',
    label: 'כתובת (slug)',
    required: true,
    unique: true,
    index: true,
    validate: (value: unknown) => checkSlug(value),
    hooks: { beforeChange: [enforceSlugRules] },
    admin: { position: 'sidebar', description },
  }
}
