import type { CollectionConfig } from 'payload'

/** Admin users. Roles, lockout and password policy are added in task T07. */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [],
}
