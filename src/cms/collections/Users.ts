import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { APIError, ValidationError } from 'payload'

import {
  ROLES,
  ROLE_LABELS,
  canAccessAdmin,
  isAdmin,
  isAdminField,
  isAdminOrSelf,
  isAdminUser,
} from '../access'
import { checkPasswordPolicy } from '../access/password-policy'

/**
 * Admin users (task T07). Individual accounts only — no shared or seeded
 * accounts. The first admin is created by the owner at /admin/create-first-user.
 *
 * - Roles: admin (everything, incl. users) and editor (content only).
 * - Lockout after 5 failed logins for 15 minutes.
 * - Password policy: see access/password-policy.ts.
 */

const LOCK_MINUTES = 15

/** Enforce the password policy whenever a password is set (create, change). */
const enforcePasswordPolicy: CollectionBeforeValidateHook = ({ data, originalDoc, collection }) => {
  const password = (data as { password?: unknown } | undefined)?.password
  if (password === undefined || password === null || password === '') return data
  const email = (data as { email?: string })?.email ?? (originalDoc as { email?: string } | undefined)?.email
  const result = checkPasswordPolicy(password, { email })
  if (result !== true) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [{ path: 'password', message: result }],
    })
  }
  return data
}

/**
 * Reset-password writes the hash directly and skips beforeValidate, so the
 * policy is enforced on the operation's input as well.
 */
const enforcePasswordPolicyOnReset: CollectionBeforeOperationHook = ({ args, operation, collection }) => {
  if (operation !== 'resetPassword') return args
  const result = checkPasswordPolicy((args as { data?: { password?: unknown } }).data?.password)
  if (result !== true) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [{ path: 'password', message: result }],
    })
  }
  return args
}

/** The very first account is always an admin; later accounts default to editor. */
const firstUserIsAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
  if (totalDocs === 0) return { ...data, roles: ['admin'] }
  if (!Array.isArray(data.roles) || data.roles.length === 0) return { ...data, roles: ['editor'] }
  return data
}

async function countAdmins(req: Parameters<CollectionBeforeDeleteHook>[0]['req']): Promise<number> {
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    where: { roles: { contains: 'admin' } },
    overrideAccess: true,
    req,
  })
  return totalDocs
}

const LAST_ADMIN_MESSAGE = 'לא ניתן להסיר את המנהל/ת האחרון/ה. יש להגדיר מנהל/ת נוסף/ת קודם.'

/** Never leave the site without an admin (demotion). */
const keepOneAdminOnUpdate: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== 'update' || !originalDoc || !isAdminUser(originalDoc)) return data
  if (!Array.isArray(data.roles) || data.roles.includes('admin')) return data
  if ((await countAdmins(req)) <= 1) throw new APIError(LAST_ADMIN_MESSAGE, 400, undefined, true)
  return data
}

/** Never leave the site without an admin (deletion). */
const keepOneAdminOnDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const user = await req.payload.findByID({ collection: 'users', id, overrideAccess: true, req, depth: 0 })
  if (isAdminUser(user) && (await countAdmins(req)) <= 1) {
    throw new APIError(LAST_ADMIN_MESSAGE, 400, undefined, true)
  }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'משתמש/ת', plural: 'משתמשים' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'ניהול',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: LOCK_MINUTES * 60 * 1000,
    tokenExpiration: 2 * 60 * 60, // 2 hours
    useSessions: true,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.SITE_ENV === 'preview' || process.env.SITE_ENV === 'production',
    },
  },
  access: {
    admin: canAccessAdmin,
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    unlock: isAdmin,
  },
  hooks: {
    beforeOperation: [enforcePasswordPolicyOnReset],
    beforeValidate: [enforcePasswordPolicy],
    beforeChange: [firstUserIsAdmin, keepOneAdminOnUpdate],
    beforeDelete: [keepOneAdminOnDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'שם',
    },
    {
      name: 'roles',
      type: 'select',
      label: 'תפקידים',
      hasMany: true,
      required: true,
      // Signed-out = the create-first-user screen, where the account always becomes admin (see firstUserIsAdmin).
      defaultValue: ({ user }: { user?: unknown }) => (user ? ['editor'] : ['admin']),
      saveToJWT: true,
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        description: 'מנהל/ת: הכול, כולל משתמשים. עורך/ת תוכן: עמודים, תוכן ומדיה בלבד.',
      },
    },
  ],
}
