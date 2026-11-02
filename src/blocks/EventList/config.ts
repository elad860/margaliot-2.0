import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'
import { activityOptions } from '@/config/activities'

/** Upcoming published dates from Events. Shows an empty state when there are none. */
export const EventListBlock: Block = {
  slug: 'eventList',
  interfaceName: 'EventListBlock',
  labels: { singular: 'רשימת מועדים', plural: 'רשימות מועדים' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    {
      name: 'activityTypes',
      type: 'select',
      label: 'פעילויות',
      hasMany: true,
      options: activityOptions,
      admin: { description: 'אם ריק, מוצגים המועדים של כל הפעילויות.' },
    },
    { name: 'limit', type: 'number', label: 'מספר מועדים מרבי', min: 1, max: 50 },
    variantField(),
  ],
}
