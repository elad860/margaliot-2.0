import type { CollectionConfig } from 'payload'

import { checkYouTubeUrl } from '@/lib/youtube'

import { draftContentAccess } from '../access'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'
import { slugField } from '../fields/slug'

export const TORAH_BOOKS = [
  { value: 'genesis', label: 'בראשית' },
  { value: 'exodus', label: 'שמות' },
  { value: 'leviticus', label: 'ויקרא' },
  { value: 'numbers', label: 'במדבר' },
  { value: 'deuteronomy', label: 'דברים' },
] as const

/**
 * Parashot (task T09; ADR-0004): the weekly Torah portion, at /parasha/[slug].
 * How the parasha is published (video / file / text) is still open
 * (OPEN-DECISIONS #11), so every content field is optional.
 */
export const Parashot: CollectionConfig = {
  slug: 'parashot',
  labels: { singular: 'פרשה', plural: 'פרשות' },
  admin: {
    group: 'לימוד',
    useAsTitle: 'name',
    defaultColumns: ['name', 'book', 'publishDate', '_status'],
    listSearchableFields: ['name', 'slug'],
  },
  defaultSort: '-publishDate',
  versions: { drafts: true, maxPerDoc: 50 },
  access: draftContentAccess,
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', label: 'שם הפרשה', required: true },
    slugField('חלק הכתובת באתר, בתעתיק לאנגלית (למשל: vayera).'),
    {
      type: 'row',
      fields: [
        { name: 'book', type: 'select', label: 'חומש', required: true, options: [...TORAH_BOOKS] },
        { name: 'order', type: 'number', label: 'מספר הפרשה בחומש', min: 1 },
        { name: 'hebrewYear', type: 'text', label: 'שנה עברית' },
      ],
    },
    {
      name: 'publishDate',
      type: 'date',
      label: 'תאריך פרסום',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'קישור לסרטון ביוטיוב',
      validate: (value: unknown) => checkYouTubeUrl(value),
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'תמונה' },
    { name: 'body', type: 'richText', label: 'תוכן' },
  ],
}
