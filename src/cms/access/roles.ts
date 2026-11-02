/**
 * Admin roles (task T07; ADR-0005 "Roles").
 *
 * Phase A: `admin` and `editor`. Reserved for later phases, NOT active:
 * `bookingManager`, `finance`, `viewer` — added here (and to Users.roles)
 * only when the booking phase is approved. Public visitors never get accounts
 * in this collection; future customers use a separate auth collection.
 */

export const ROLES = ['admin', 'editor'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'מנהל/ת',
  editor: 'עורך/ת תוכן',
}

/** Anything that may carry roles: a Payload user, a JWT payload, or nothing. */
export type MaybeUser = object | null | undefined

export function hasRole(user: MaybeUser, ...roles: Role[]): boolean {
  const userRoles = (user as { roles?: unknown } | null | undefined)?.roles
  return (
    Array.isArray(userRoles) &&
    userRoles.some((role) => typeof role === 'string' && (roles as string[]).includes(role))
  )
}

export const isAdminUser = (user: MaybeUser): boolean => hasRole(user, 'admin')

/** Admin or editor: may use the CMS. */
export const isStaffUser = (user: MaybeUser): boolean => hasRole(user, 'admin', 'editor')
