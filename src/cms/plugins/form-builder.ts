import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import type { Field } from 'payload'

import { anyone, isAdmin, isStaff, nobody } from '../access'
import { protectSubmissions } from '../hooks/protect-submissions'

/**
 * Forms and form submissions (@payloadcms/plugin-form-builder; ADR-0001, ADR-0004).
 *
 * - Submissions are stored in the CMS only. E-mail delivery is OFF until the
 *   owner decides where submissions go (OPEN-DECISIONS #5): the `emails`
 *   field is removed from forms and `beforeEmail` drops anything left.
 * - Submissions are readable by staff only, never editable, deletable by admins.
 * - Public submissions pass a rate limit, a honeypot, server-side validation
 *   against the form and Cloudflare Turnstile (hooks/protect-submissions.ts, T16).
 * - Payment fields are disabled (no payments in Phase A).
 */
export const formBuilder = formBuilderPlugin({
  fields: {
    text: true,
    textarea: true,
    email: true,
    select: true,
    checkbox: true,
    message: true,
    number: false,
    country: false,
    state: false,
    date: false,
    upload: false,
    payment: false,
  },
  redirectRelationships: ['pages'],
  beforeEmail: () => [],
  formOverrides: {
    labels: { singular: 'טופס', plural: 'טפסים' },
    admin: { group: 'טפסים' },
    access: {
      read: anyone,
      create: isStaff,
      update: isStaff,
      delete: isAdmin,
    },
    fields: ({ defaultFields }) =>
      defaultFields.filter((field: Field) => !('name' in field && field.name === 'emails')),
  },
  formSubmissionOverrides: {
    labels: { singular: 'פנייה', plural: 'פניות מטפסים' },
    admin: { group: 'טפסים' },
    access: {
      create: anyone,
      read: isStaff,
      update: nobody,
      delete: isAdmin,
    },
    hooks: {
      beforeOperation: [protectSubmissions],
    },
  },
})
