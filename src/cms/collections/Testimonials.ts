import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { tabOptions } from '@/config/activities'

import { draftContentAccess } from '../access'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'

/**
 * A testimonial can only be published once the owner confirms the person
 * agreed to publication. Runs on every save, so it also guards REST/API publishes.
 */
export const requireConsentToPublish: CollectionBeforeChangeHook = ({ data, originalDoc, collection }) => {
  const status = data._status ?? originalDoc?._status
  const consent = data.consentConfirmed ?? originalDoc?.consentConfirmed
  if (status === 'published' && consent !== true) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [{ path: 'consentConfirmed', message: 'אי אפשר לפרסם המלצה בלי אישור הסכמה לפרסום.' }],
    })
  }
  return data
}

/**
 * Testimonials (task T09; ADR-0004). Owner-supplied only — never invented.
 * Publishing requires `consentConfirmed`.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'המלצה', plural: 'המלצות' },
  admin: {
    group: 'תוכן',
    useAsTitle: 'attribution',
    defaultColumns: ['attribution', 'featured', 'consentConfirmed', '_status'],
    description: 'המלצות אמיתיות בלבד, באישור האדם שכתב אותן.',
  },
  defaultSort: '-createdAt',
  versions: { drafts: true, maxPerDoc: 20 },
  access: draftContentAccess,
  hooks: {
    beforeChange: [requireConsentToPublish],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: 'quote', type: 'textarea', label: 'ההמלצה', required: true },
    {
      name: 'attribution',
      type: 'text',
      label: 'שם או ראשי תיבות',
      admin: { description: 'כפי שהאדם הסכים שיופיע.' },
    },
    {
      name: 'activities',
      type: 'select',
      label: 'עמודים רלוונטיים',
      hasMany: true,
      options: tabOptions,
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'המלצה נבחרת',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'consentConfirmed',
      type: 'checkbox',
      label: 'התקבלה הסכמה לפרסום',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'חובה לפני פרסום.' },
    },
  ],
}
