import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'

export const FAQBlock: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  labels: { singular: 'שאלות נפוצות', plural: 'שאלות נפוצות' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    {
      name: 'items',
      type: 'array',
      label: 'שאלות',
      labels: { singular: 'שאלה', plural: 'שאלות' },
      fields: [
        { name: 'question', type: 'text', label: 'שאלה', required: true },
        { name: 'answer', type: 'textarea', label: 'תשובה', required: true },
      ],
    },
    variantField(),
  ],
}
