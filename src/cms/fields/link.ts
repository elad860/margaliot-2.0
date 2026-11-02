import type { GroupField } from 'payload'

import { checkLinkHref } from '@/lib/validators'

/** Shared link group: label + site path (/contact) or https URL. Hidden on the site while empty. */
export function linkField(name = 'link', label = 'קישור'): GroupField {
  return {
    name,
    type: 'group',
    label,
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'label', type: 'text', label: 'טקסט' },
          {
            name: 'href',
            type: 'text',
            label: 'כתובת',
            validate: (value: unknown) => checkLinkHref(value),
            admin: { description: 'כתובת באתר (מתחילה ב-/) או כתובת https:// מלאה.' },
          },
        ],
      },
    ],
  }
}
