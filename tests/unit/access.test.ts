import { describe, expect, it } from 'vitest'

import { checkPasswordPolicy } from '@/cms/access/password-policy'
import { hasRole, isAdminUser, isStaffUser } from '@/cms/access/roles'

describe('roles (T07)', () => {
  it('recognises admins and editors', () => {
    expect(isAdminUser({ roles: ['admin'] })).toBe(true)
    expect(isAdminUser({ roles: ['editor'] })).toBe(false)
    expect(isStaffUser({ roles: ['editor'] })).toBe(true)
    expect(isStaffUser({ roles: ['admin', 'editor'] })).toBe(true)
  })

  it('treats anonymous, role-less and unknown roles as no access', () => {
    expect(isStaffUser(null)).toBe(false)
    expect(isStaffUser(undefined)).toBe(false)
    expect(isStaffUser({})).toBe(false)
    expect(isStaffUser({ roles: [] })).toBe(false)
    expect(isStaffUser({ roles: ['finance'] })).toBe(false) // reserved, not active
    expect(hasRole({ roles: 'admin' }, 'admin')).toBe(false) // must be an array
  })
})

describe('password policy (T07)', () => {
  it('accepts a long unique passphrase', () => {
    expect(checkPasswordPolicy('ים-כחול ושמיים 2026', { email: 'owner@example.test' })).toBe(true)
  })

  it.each([
    [undefined, 'יש להזין'],
    ['', 'יש להזין'],
    ['short-pass', 'לפחות 12'],
    ['x'.repeat(129), 'עד 128'],
    ['bbbbbbbbbbbbbb', 'תו אחד'],
    ['Password1234', 'נפוצה'],
    ['vered.sharabi-2026!', 'דוא"ל'],
  ])('rejects %j', (password, message) => {
    const result = checkPasswordPolicy(password, { email: 'vered.sharabi@example.test' })
    expect(result).toEqual(expect.stringContaining(message))
  })
})
