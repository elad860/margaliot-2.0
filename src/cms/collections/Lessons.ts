import type { CollectionConfig } from 'payload'

import { checkHttpsUrl } from '@/lib/validators'
import { checkYouTubeUrl } from '@/lib/youtube'

import { draftContentAccess } from '../access'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'
import { slugField } from '../fields/slug'

type Sibling = { kind?: 'recorded' | 'live' } | undefined

/**
 * Lessons (task T09; ADR-0004): online classes, at /online-classes/[slug].
 * Paid or member-only access is an open decision (ADR-0005), so no access field.
 */
export const Lessons: CollectionConfig = {
  slug: 'lessons',
  labels: { singular: 'שיעור', plural: 'שיעורים' },
  admin: {
    group: 'לימוד',
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'topic', '_status'],
    listSearchableFields: ['title', 'slug'],
  },
  defaultSort: '-createdAt',
  versions: { drafts: true, maxPerDoc: 50 },
  access: draftContentAccess,
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', label: 'שם השיעור', required: true },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          label: 'סוג',
          required: true,
          defaultValue: 'recorded',
          options: [
            { value: 'recorded', label: 'מוקלט' },
            { value: 'live', label: 'שידור חי' },
          ],
        },
        { name: 'topic', type: 'relationship', relationTo: 'topics', label: 'נושא' },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'קישור לסרטון ביוטיוב',
      validate: (value: unknown) => checkYouTubeUrl(value),
    },
    {
      name: 'liveStart',
      type: 'date',
      label: 'מועד השידור',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_, sibling: Sibling) => sibling?.kind === 'live',
      },
    },
    {
      name: 'joinUrl',
      type: 'text',
      label: 'קישור להצטרפות לשידור',
      validate: (value: unknown) => checkHttpsUrl(value),
      admin: { condition: (_, sibling: Sibling) => sibling?.kind === 'live' },
    },
    { name: 'body', type: 'richText', label: 'תוכן' },
  ],
}
