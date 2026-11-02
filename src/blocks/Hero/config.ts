import type { Block } from 'payload'

import { linkField } from '@/cms/fields/link'
import { variantField } from '@/cms/fields/variant'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'פתיח', plural: 'פתיחים' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    { name: 'subheading', type: 'textarea', label: 'טקסט משנה' },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'תמונה' },
    linkField('action', 'כפתור'),
    variantField(),
  ],
}
