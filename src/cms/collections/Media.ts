import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

import { anyone, isStaff } from '../access'
import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidate'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Media library (task T07). Images only; `alt` is required (IS 5568).
 * Storage: local `media/` folder in development (git-ignored); Vercel Blob
 * when BLOB_READ_WRITE_TOKEN is set (preview/production), see payload.config.ts.
 * SVG is not accepted (can carry scripts).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'קובץ מדיה', plural: 'מדיה' },
  admin: {
    group: 'תוכן',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'טקסט חלופי (alt)',
      required: true,
      admin: {
        description: 'תיאור קצר של מה שרואים בתמונה, עבור קוראי מסך. חובה.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'כיתוב',
    },
    {
      name: 'credit',
      type: 'text',
      label: 'קרדיט צילום',
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../../media'),
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumbnail',
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 800 },
      { name: 'hero', width: 1920 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
}
