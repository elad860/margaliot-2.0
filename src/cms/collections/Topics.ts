import type { CollectionConfig } from 'payload'

import { publicContentAccess } from '../access'

/** Topics (task T09): filters for online lessons. */
export const Topics: CollectionConfig = {
  slug: 'topics',
  labels: { singular: 'נושא', plural: 'נושאים' },
  admin: {
    group: 'לימוד',
    useAsTitle: 'name',
  },
  defaultSort: 'name',
  access: publicContentAccess,
  fields: [{ name: 'name', type: 'text', label: 'שם הנושא', required: true, unique: true }],
}
