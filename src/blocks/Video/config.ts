import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'
import { checkYouTubeUrl } from '@/lib/youtube'

/** YouTube only, embedded through youtube-nocookie.com with a click-to-load facade (renderer: T29). */
export const VideoBlock: Block = {
  slug: 'video',
  interfaceName: 'VideoBlock',
  labels: { singular: 'סרטון', plural: 'סרטונים' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    {
      name: 'url',
      type: 'text',
      label: 'קישור לסרטון ביוטיוב',
      required: true,
      validate: (value: unknown) => (value ? checkYouTubeUrl(value) : 'יש להזין קישור לסרטון.'),
    },
    {
      name: 'title',
      type: 'text',
      label: 'שם הסרטון (לקוראי מסך)',
      required: true,
      admin: { description: 'נדרש לנגישות: כך קוראי מסך מתארים את הסרטון.' },
    },
    { name: 'caption', type: 'textarea', label: 'כיתוב' },
    variantField(),
  ],
}
