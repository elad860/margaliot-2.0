import type { GlobalConfig } from 'payload'

import { checkPhone, checkUrlOnHosts } from '@/lib/validators'

import { anyone, isStaff } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/** Social networks stored once and used everywhere (UX review F11). Each is optional. */
export const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'אינסטגרם', hosts: ['instagram.com'] },
  { key: 'tiktok', label: 'טיקטוק', hosts: ['tiktok.com'] },
  { key: 'youtube', label: 'יוטיוב', hosts: ['youtube.com', 'youtu.be'] },
  { key: 'whatsappCommunity', label: 'קבוצת וואטסאפ', hosts: ['chat.whatsapp.com', 'whatsapp.com', 'wa.me'] },
] as const

export type SocialKey = (typeof SOCIAL_NETWORKS)[number]['key']

/**
 * Site settings (task T10; ARCHITECTURE-PROPOSAL §8.4).
 *
 * EVERYTHING here is empty by default: no phone number, e-mail, link or
 * address is ever pre-filled (CLAUDE.md; OPEN-DECISIONS #10). Every element
 * that uses a value from here is hidden while the value is empty (T13 helpers).
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'הגדרות האתר',
  admin: {
    group: 'הגדרות',
    description: 'פרטי קשר, רשתות חברתיות והמסע הקרוב. כל שדה שנשאר ריק פשוט לא מוצג באתר.',
  },
  hooks: { afterChange: [revalidateGlobal] },
  access: {
    read: anyone,
    update: isStaff,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'כללי',
          fields: [
            { name: 'organisationName', type: 'text', label: 'שם הארגון' },
            { name: 'tagline', type: 'text', label: 'סלוגן' },
            {
              name: 'nextTrip',
              type: 'relationship',
              relationTo: 'trips',
              label: 'המסע הקרוב',
              admin: {
                description:
                  'המסע שמוצג בכתובת הקבועה /next-trip. מוצג רק אם המסע מפורסם. אם ריק, העמוד מציג מצב "אין מסע פתוח".',
              },
            },
            {
              name: 'defaultSeoImage',
              type: 'upload',
              relationTo: 'media',
              label: 'תמונת שיתוף ברירת מחדל',
              admin: {
                description: 'התמונה שמופיעה בשיתוף קישור (וואטסאפ, פייסבוק) כשלעמוד אין תמונה משלו.',
              },
            },
          ],
        },
        {
          label: 'פרטי קשר',
          fields: [
            {
              name: 'phones',
              type: 'array',
              label: 'טלפונים',
              labels: { singular: 'טלפון', plural: 'טלפונים' },
              fields: [
                { name: 'label', type: 'text', label: 'תיאור (לא חובה)' },
                {
                  name: 'number',
                  type: 'text',
                  label: 'מספר',
                  required: true,
                  validate: (value: unknown) => (value ? checkPhone(value) : 'יש להזין מספר.'),
                },
              ],
            },
            {
              name: 'whatsappNumber',
              type: 'text',
              label: 'מספר וואטסאפ',
              validate: (value: unknown) => checkPhone(value),
              admin: {
                description: 'בפורמט בינלאומי, כולל קידומת מדינה. אם ריק, כפתורי הוואטסאפ לא יוצגו.',
              },
            },
            {
              name: 'defaultWhatsappMessage',
              type: 'textarea',
              label: 'הודעת וואטסאפ ברירת מחדל',
            },
            { name: 'email', type: 'email', label: 'דוא"ל' },
            { name: 'officeHours', type: 'textarea', label: 'שעות פעילות' },
          ],
        },
        {
          label: 'רשתות חברתיות',
          fields: [
            {
              name: 'socials',
              type: 'group',
              label: 'קישורים',
              admin: { description: 'קישור מלא שמתחיל ב-https://. רשת בלי קישור לא תוצג.' },
              fields: SOCIAL_NETWORKS.map((network) => ({
                name: network.key,
                type: 'text' as const,
                label: network.label,
                validate: (value: unknown) => checkUrlOnHosts(value, network.hosts, network.label),
              })),
            },
          ],
        },
        {
          label: 'נגישות',
          fields: [
            {
              name: 'accessibilityCoordinator',
              type: 'group',
              label: 'רכז/ת נגישות',
              admin: { description: 'הפרטים מוצגים בהצהרת הנגישות.' },
              fields: [
                { name: 'name', type: 'text', label: 'שם' },
                {
                  name: 'phone',
                  type: 'text',
                  label: 'טלפון',
                  validate: (value: unknown) => checkPhone(value),
                },
                { name: 'email', type: 'email', label: 'דוא"ל' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
