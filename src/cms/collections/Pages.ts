import type { Access, CollectionConfig } from 'payload'

import { ALL_BLOCKS, allowedBlocksFor } from '@/blocks'
import { SITE_MAP, type TemplateKey } from '@/config/site-map'

import { isAdmin, isAdminUser, isStaff, publishedOrStaff } from '../access'
import { enforceTemplateBlocks } from '../hooks/enforce-template-blocks'
import { lockSystemPageFields } from '../hooks/lock-system-pages'

const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  home: 'דף בית',
  information: 'מידע',
  trip: 'מסע',
  activity: 'פעילות עם מועדים',
  library: 'ספרייה',
  legal: 'משפטי',
}

/** System pages are never deleted (ADR-0004). Only an admin could delete a non-system page, and none exist in Phase A. */
const deleteNonSystemPagesOnly: Access = ({ req: { user } }) =>
  isAdminUser(user) ? { systemKey: { exists: false } } : false

/**
 * Pages (task T08; ADR-0004). Phase A has exactly the 15 system pages from
 * src/config/site-map.ts, created as drafts by the seed (pnpm seed).
 *
 * - Drafts and versions on; new documents start as drafts.
 * - title / slug / template / order come from the registry (hook) and are
 *   read-only in the admin. systemKey is fixed after creation.
 * - Anonymous reads return published pages only.
 * - `layout` (T11): the page's blocks. Each template allows only its own blocks
 *   (src/blocks/allowed.ts), enforced in the admin (filterOptions) and on every
 *   save, drafts included (enforce-template-blocks hook). Legal pages have no
 *   blocks; they use `body` + `lastUpdated` instead.
 * - Preview and revalidation come in T12.
 * - SEO fields (`meta`) come from @payloadcms/plugin-seo (payload.config.ts).
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'עמוד', plural: 'עמודים' },
  admin: {
    group: 'תוכן',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
    description:
      'עמודי האתר הקבועים: דף הבית, 11 הלשוניות ו-3 העמודים המשפטיים. שמות העמודים וכתובותיהם קבועים.',
  },
  defaultSort: 'order',
  versions: {
    drafts: true,
    maxPerDoc: 50,
  },
  access: {
    read: publishedOrStaff,
    readVersions: isStaff,
    create: isAdmin,
    update: isStaff,
    delete: deleteNonSystemPagesOnly,
  },
  hooks: {
    beforeChange: [lockSystemPageFields, enforceTemplateBlocks],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'שם העמוד',
      required: true,
      admin: { readOnly: true, description: 'נקבע לפי רשימת העמודים הקבועה ואינו ניתן לשינוי.' },
    },
    {
      name: 'hero',
      type: 'group',
      label: 'פתיח העמוד',
      fields: [
        { name: 'heading', type: 'text', label: 'כותרת' },
        { name: 'subheading', type: 'textarea', label: 'טקסט משנה' },
        { name: 'image', type: 'upload', relationTo: 'media', label: 'תמונה' },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'תוכן העמוד',
      labels: { singular: 'רכיב', plural: 'רכיבים' },
      blocks: ALL_BLOCKS,
      filterOptions: ({ data }) => [...allowedBlocksFor(data?.template)],
      admin: {
        condition: (data) => data?.template !== 'legal',
        description: 'רכיבי התוכן של העמוד. כל תבנית מאפשרת רק את הרכיבים המתאימים לה.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'נוסח העמוד',
      admin: { condition: (data) => data?.template === 'legal' },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      label: 'עודכן לאחרונה',
      admin: {
        condition: (data) => data?.template === 'legal',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'primaryAction',
      type: 'group',
      label: 'פעולה עיקרית (כפתור במובייל)',
      admin: { description: 'אם ריק, משתמשים בברירת המחדל של התבנית, או שהכפתור לא מוצג.' },
      fields: [
        { name: 'label', type: 'text', label: 'טקסט הכפתור' },
        {
          name: 'href',
          type: 'text',
          label: 'קישור',
          admin: { description: 'כתובת באתר (מתחילה ב-/) או כתובת מלאה שמתחילה ב-https://' },
          validate: (value: unknown) =>
            value === undefined ||
            value === null ||
            value === '' ||
            /^(\/(?!\/)|https:\/\/)\S*$/.test(String(value))
              ? true
              : 'יש להזין כתובת באתר (מתחילה ב-/) או כתובת https:// מלאה.',
        },
      ],
    },
    {
      name: 'whatsappMessage',
      type: 'textarea',
      label: 'הודעת וואטסאפ מוכנה',
      admin: {
        description: 'הטקסט שנפתח בוואטסאפ מעמוד זה. אם ריק, משתמשים בהודעת ברירת המחדל מהגדרות האתר.',
      },
    },
    // Sidebar: fixed facts from the registry, shown for orientation only.
    {
      name: 'systemKey',
      type: 'select',
      label: 'מזהה עמוד מערכת',
      required: true,
      unique: true,
      index: true,
      options: SITE_MAP.map((page) => ({ value: page.key, label: page.name })),
      access: { update: () => false },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'slug',
      type: 'text',
      label: 'כתובת',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'template',
      type: 'select',
      label: 'תבנית',
      options: (Object.keys(TEMPLATE_LABELS) as TemplateKey[]).map((value) => ({
        value,
        label: TEMPLATE_LABELS[value],
      })),
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'order',
      type: 'number',
      label: 'סדר',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
