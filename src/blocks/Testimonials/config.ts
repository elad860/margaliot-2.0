import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'
import { tabOptions } from '@/config/activities'

type Sibling = { source?: 'featured' | 'activity' | 'selected' } | undefined

/** Published, consented testimonials from the collection. Hidden when none match. */
export const TestimonialsBlock: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  labels: { singular: 'המלצות', plural: 'המלצות' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    {
      name: 'source',
      type: 'select',
      label: 'אילו המלצות',
      required: true,
      defaultValue: 'featured',
      options: [
        { value: 'featured', label: 'המלצות נבחרות' },
        { value: 'activity', label: 'לפי עמוד' },
        { value: 'selected', label: 'בחירה ידנית' },
      ],
    },
    {
      name: 'activity',
      type: 'select',
      label: 'עמוד',
      options: tabOptions,
      admin: { condition: (_, sibling: Sibling) => sibling?.source === 'activity' },
    },
    {
      name: 'items',
      type: 'relationship',
      relationTo: 'testimonials',
      hasMany: true,
      label: 'המלצות',
      admin: { condition: (_, sibling: Sibling) => sibling?.source === 'selected' },
    },
    { name: 'limit', type: 'number', label: 'מספר המלצות מרבי', min: 1, max: 24 },
    variantField(),
  ],
}
