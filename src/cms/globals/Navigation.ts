import type { Field, GlobalConfig } from 'payload'

import {
  DEFAULT_HEADER_CTA_LABEL,
  DEFAULT_HEADER_ITEMS,
  DIRECT_LINK_PAGES,
  checkHeaderItems,
} from '@/config/navigation-defaults'
import { NAV_GROUPS, TABS, getSystemPage } from '@/config/site-map'
import { checkLinkHref } from '@/lib/validators'

import { anyone, isStaff } from '../access'

type HeaderItemSibling = { type?: 'group' | 'page' } | undefined

/**
 * Navigation (task T10; ARCHITECTURE-PROPOSAL §7, UX review F3/F4/F6).
 *
 * Editable here: header item order, group labels, optional one-line tab
 * descriptions (shown only when the owner writes them), the CTA label and
 * extra footer links. NOT editable: which tabs exist, their names, their
 * group membership and their order inside a group — those live in the code
 * registry (src/config/site-map.ts). Only published pages ever appear (T13).
 */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'ניווט',
  admin: {
    group: 'הגדרות',
    description:
      'סדר פריטי התפריט, שמות הקבוצות ותיאורים קצרים. רק עמודים שפורסמו מופיעים בתפריט. שמות הלשוניות קבועים.',
  },
  access: {
    read: anyone,
    update: isStaff,
  },
  fields: [
    {
      name: 'headerItems',
      type: 'array',
      label: 'פריטי התפריט העליון (לפי הסדר)',
      labels: { singular: 'פריט', plural: 'פריטים' },
      admin: {
        description:
          'הלוגו תמיד בהתחלה וכפתור "המסע הקרוב" תמיד בסוף. כאן אפשר לשנות רק את סדר הקבוצות והקישורים הישירים.',
      },
      defaultValue: DEFAULT_HEADER_ITEMS.map((item) => ({ ...item })),
      minRows: DEFAULT_HEADER_ITEMS.length,
      maxRows: DEFAULT_HEADER_ITEMS.length,
      validate: (value: unknown) => checkHeaderItems(value),
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'סוג',
          required: true,
          options: [
            { value: 'group', label: 'קבוצה' },
            { value: 'page', label: 'קישור ישיר' },
          ],
        },
        {
          name: 'group',
          type: 'select',
          label: 'קבוצה',
          options: NAV_GROUPS.map((group) => ({ value: group.key, label: group.defaultLabel })),
          admin: { condition: (_, sibling: HeaderItemSibling) => sibling?.type === 'group' },
        },
        {
          name: 'page',
          type: 'select',
          label: 'עמוד',
          options: DIRECT_LINK_PAGES.map((key) => ({ value: key, label: getSystemPage(key).name })),
          admin: { condition: (_, sibling: HeaderItemSibling) => sibling?.type === 'page' },
        },
      ],
    },
    {
      name: 'groupLabels',
      type: 'group',
      label: 'שמות הקבוצות',
      admin: { description: 'אם שדה ריק, מוצג השם שאושר.' },
      fields: NAV_GROUPS.map((group): Field => ({
        name: group.key,
        type: 'text',
        label: group.defaultLabel,
        defaultValue: group.defaultLabel,
      })),
    },
    {
      name: 'tabDescriptions',
      type: 'group',
      label: 'תיאור קצר לכל לשונית (לא חובה)',
      admin: { description: 'שורה אחת שמוצגת מתחת לשם הלשונית בתפריט. מוצגת רק אם נכתבה.' },
      fields: TABS.map((tab): Field => ({
        name: tab.key,
        type: 'text',
        label: tab.name,
      })),
    },
    {
      name: 'headerCta',
      type: 'group',
      label: 'כפתור המסע הקרוב',
      admin: { description: 'הכפתור מוביל תמיד לעמוד "המסע הקרוב", ומוצג רק כשהעמוד מפורסם.' },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'טקסט הכפתור',
          defaultValue: DEFAULT_HEADER_CTA_LABEL,
        },
      ],
    },
    {
      name: 'footerLinks',
      type: 'array',
      label: 'קישורים נוספים בכותרת התחתונה',
      labels: { singular: 'קישור', plural: 'קישורים' },
      fields: [
        { name: 'label', type: 'text', label: 'טקסט', required: true },
        {
          name: 'href',
          type: 'text',
          label: 'כתובת',
          required: true,
          validate: (value: unknown) => (value ? checkLinkHref(value) : 'יש להזין כתובת.'),
        },
      ],
    },
  ],
}
