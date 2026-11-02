import type { Block } from 'payload'

import { linkField } from '@/cms/fields/link'
import { registrationField } from '@/cms/fields/registration'
import { variantField } from '@/cms/fields/variant'

/** Call to action: a plain link and/or the shared registration setting (default: none). */
export const CTABlock: Block = {
  slug: 'cta',
  interfaceName: 'CTABlock',
  labels: { singular: 'קריאה לפעולה', plural: 'קריאות לפעולה' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    { name: 'text', type: 'textarea', label: 'טקסט' },
    linkField(),
    registrationField,
    variantField(),
  ],
}
