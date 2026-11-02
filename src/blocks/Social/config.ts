import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'

/** Social links from site settings. Only links that are set are shown; with none, the block is hidden. */
export const SocialBlock: Block = {
  slug: 'social',
  interfaceName: 'SocialBlock',
  labels: { singular: 'רשתות חברתיות', plural: 'רשתות חברתיות' },
  admin: { disableBlockName: true },
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'כותרת',
      admin: { description: 'הקישורים עצמם נלקחים מהגדרות האתר.' },
    },
    variantField(),
  ],
}
