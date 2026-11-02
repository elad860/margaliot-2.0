import type { CollectionConfig } from 'payload'

import { publicContentAccess } from '../access'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'

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
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [{ name: 'name', type: 'text', label: 'שם הנושא', required: true, unique: true }],
}
