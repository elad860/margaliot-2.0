import type { Block } from 'payload'

import { linkField } from '@/cms/fields/link'
import { variantField } from '@/cms/fields/variant'

export const CardsBlock: Block = {
  slug: 'cards',
  interfaceName: 'CardsBlock',
  labels: { singular: 'כרטיסים', plural: 'כרטיסים' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    { name: 'intro', type: 'textarea', label: 'פתיח' },
    {
      name: 'cards',
      type: 'array',
      label: 'כרטיסים',
      labels: { singular: 'כרטיס', plural: 'כרטיסים' },
      fields: [
        { name: 'title', type: 'text', label: 'כותרת', required: true },
        { name: 'text', type: 'textarea', label: 'טקסט' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'תמונה' },
        linkField(),
      ],
    },
    variantField(),
  ],
}
