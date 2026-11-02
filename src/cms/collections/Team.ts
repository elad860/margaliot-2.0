import type { CollectionConfig } from 'payload'

import { publicContentAccess } from '../access'

/** Team (task T09): people shown on מי אנחנו and as trip guides. */
export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'איש צוות', plural: 'צוות' },
  admin: {
    group: 'תוכן',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order'],
  },
  defaultSort: 'order',
  access: publicContentAccess,
  fields: [
    { name: 'name', type: 'text', label: 'שם', required: true },
    { name: 'role', type: 'text', label: 'תפקיד' },
    { name: 'photo', type: 'upload', relationTo: 'media', label: 'תמונה' },
    { name: 'bio', type: 'textarea', label: 'קצת עליי' },
    { name: 'order', type: 'number', label: 'סדר תצוגה', admin: { position: 'sidebar' } },
  ],
}
