import type { CollectionConfig } from 'payload'

import { activityOptions } from '@/config/activities'

import { draftContentAccess } from '../access'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'
import { registrationField } from '../fields/registration'

/**
 * Events (task T09; ADR-0004): dated occurrences of the four activity tabs.
 * Listed on their tab page; no detail pages in Phase A (ADR-0003).
 * No capacity, sold-out or audience fields (ADR-0005).
 */
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'מועד', plural: 'מועדים' },
  admin: {
    group: 'מסעות ופעילויות',
    useAsTitle: 'title',
    defaultColumns: ['title', 'activityType', 'start', '_status'],
    listSearchableFields: ['title'],
    description: 'מועדים של קברי צדיקים בארץ, ערבי נשים, תקשור בציבור וקורס הארת הכלים.',
  },
  defaultSort: 'start',
  versions: { drafts: true, maxPerDoc: 50 },
  access: draftContentAccess,
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', label: 'כותרת', required: true },
    {
      name: 'activityType',
      type: 'select',
      label: 'פעילות',
      required: true,
      index: true,
      options: activityOptions,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'start',
          type: 'date',
          label: 'התחלה',
          required: true,
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        { name: 'end', type: 'date', label: 'סיום', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'location', type: 'text', label: 'מקום' },
    { name: 'departurePoint', type: 'text', label: 'נקודת יציאה' },
    {
      name: 'priceDisplay',
      type: 'text',
      label: 'מחיר (טקסט לתצוגה)',
      admin: { description: 'מוצג רק אם מולא.' },
    },
    registrationField,
  ],
}
