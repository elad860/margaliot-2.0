import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'

export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'גלריה', plural: 'גלריות' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, label: 'תמונות', required: true },
    variantField(),
  ],
}
