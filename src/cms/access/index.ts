/**
 * Payload access functions (task T07). Deny by default: every collection
 * states its access explicitly using these helpers.
 */
import type { Access, FieldAccess } from 'payload'

import { isAdminUser, isStaffUser } from './roles'

export { ROLES, ROLE_LABELS, hasRole, isAdminUser, isStaffUser } from './roles'
export type { Role } from './roles'

export const anyone: Access = () => true

export const nobody: Access = () => false

export const isAdmin: Access = ({ req: { user } }) => isAdminUser(user)

export const isStaff: Access = ({ req: { user } }) => isStaffUser(user)

/** Admins see everyone; other signed-in staff only themselves; anonymous nothing. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (isAdminUser(user)) return true
  if (user && isStaffUser(user)) return { id: { equals: user.id } }
  return false
}

/** Staff see drafts and published documents; everyone else only published ones. */
export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (isStaffUser(user)) return true
  return { _status: { equals: 'published' } }
}

/** Who may open /admin at all. */
export const canAccessAdmin = ({ req: { user } }: { req: { user: object | null } }): boolean =>
  isStaffUser(user)

export const isAdminField: FieldAccess = ({ req: { user } }) => isAdminUser(user)

/** Access for draft-enabled content collections: the public reads published documents only. */
export const draftContentAccess = {
  read: publishedOrStaff,
  readVersions: isStaff,
  create: isStaff,
  update: isStaff,
  delete: isStaff,
}

/** Access for content collections without drafts (Topics, Team): public read, staff write. */
export const publicContentAccess = {
  read: anyone,
  create: isStaff,
  update: isStaff,
  delete: isStaff,
}
