import type { CollectionConfig } from 'payload'

import { draftContentAccess } from '../access'
import { registrationField } from '../fields/registration'
import { slugField } from '../fields/slug'

/**
 * Trips (task T09; ADR-0004, ADR-0005). The single trip record that the
 * future booking system will reference by id.
 *
 * Deliberately NOT here (unapproved product decisions, ADR-0005 / OPEN-DECISIONS
 * #8, #15–#20): capacity, sold-out switch, rooms, audience, passport data,
 * refund rules, invoices, numeric price. `priceDisplay` is free text, shown only
 * if filled.
 */
export const Trips: CollectionConfig = {
  slug: 'trips',
  labels: { singular: 'מסע', plural: 'מסעות' },
  admin: {
    group: 'מסעות ופעילויות',
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
  },
  defaultSort: '-startDate',
  versions: { drafts: true, maxPerDoc: 50 },
  access: draftContentAccess,
  fields: [
    { name: 'title', type: 'text', label: 'שם המסע', required: true },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'תאריך יציאה',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'תאריך חזרה',
          admin: { date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    { name: 'summary', type: 'textarea', label: 'תקציר' },
    { name: 'guides', type: 'relationship', relationTo: 'team', hasMany: true, label: 'מדריכים' },
    {
      name: 'tziunim',
      type: 'array',
      label: 'ציונים',
      labels: { singular: 'ציון', plural: 'ציונים' },
      fields: [
        { name: 'name', type: 'text', label: 'שם', required: true },
        { name: 'description', type: 'textarea', label: 'תיאור' },
      ],
    },
    {
      name: 'itinerary',
      type: 'array',
      label: 'מסלול',
      labels: { singular: 'יום', plural: 'ימים' },
      fields: [
        { name: 'title', type: 'text', label: 'כותרת היום', required: true },
        { name: 'description', type: 'textarea', label: 'תיאור' },
      ],
    },
    { name: 'included', type: 'richText', label: 'מה כלול' },
    { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, label: 'גלריה' },
    {
      name: 'faq',
      type: 'array',
      label: 'שאלות נפוצות',
      labels: { singular: 'שאלה', plural: 'שאלות' },
      fields: [
        { name: 'question', type: 'text', label: 'שאלה', required: true },
        { name: 'answer', type: 'textarea', label: 'תשובה', required: true },
      ],
    },
    {
      name: 'priceDisplay',
      type: 'text',
      label: 'מחיר (טקסט לתצוגה)',
      admin: { description: 'מוצג רק אם מולא. זהו טקסט בלבד; אין בו חישוב או תשלום.' },
    },
    registrationField,
  ],
}
