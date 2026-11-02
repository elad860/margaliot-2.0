import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'

/** A form-builder form. Submissions are stored in the CMS only; no e-mail (OPEN-DECISIONS #5). */
export const FormBlock: Block = {
  slug: 'form',
  interfaceName: 'FormBlock',
  labels: { singular: 'טופס', plural: 'טפסים' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    { name: 'intro', type: 'textarea', label: 'פתיח' },
    { name: 'form', type: 'relationship', relationTo: 'forms', label: 'טופס', required: true },
    variantField(),
  ],
}
