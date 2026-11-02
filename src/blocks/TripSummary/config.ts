import type { Block } from 'payload'

import { variantField } from '@/cms/fields/variant'

type Sibling = { source?: 'nextTrip' | 'trip' } | undefined

/** Summary of a trip. By default the trip selected in site settings (המסע הקרוב). Hidden when no published trip. */
export const TripSummaryBlock: Block = {
  slug: 'tripSummary',
  interfaceName: 'TripSummaryBlock',
  labels: { singular: 'תקציר מסע', plural: 'תקצירי מסע' },
  fields: [
    { name: 'heading', type: 'text', label: 'כותרת' },
    {
      name: 'source',
      type: 'select',
      label: 'איזה מסע',
      required: true,
      defaultValue: 'nextTrip',
      options: [
        { value: 'nextTrip', label: 'המסע הקרוב (מהגדרות האתר)' },
        { value: 'trip', label: 'מסע מסוים' },
      ],
    },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      label: 'מסע',
      admin: { condition: (_, sibling: Sibling) => sibling?.source === 'trip' },
      validate: (value: unknown, { siblingData }: { siblingData: Sibling }) =>
        siblingData?.source !== 'trip' || Boolean(value) || 'יש לבחור מסע.',
    },
    variantField(),
  ],
}
