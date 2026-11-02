import type { CollectionConfig } from 'payload'

/** Media library. Caption, credit, image sizes and storage adapters are added in task T07. */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
