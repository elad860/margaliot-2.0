import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'

export const TextImageBlock: Block = {
  slug: 'textImage',
  interfaceName: 'TextImageBlock',
  labels: { singular: 'טקסט ותמונה', plural: 'טקסט ותמונה' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    { name: 'body', type: 'richText', label: 'טקסט' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'תמונה' },
    variantField(),
  ],
}
