/**
 * Admin password policy (task T07; ARCHITECTURE-PROPOSAL §10 security).
 *
 * Length over complexity, following NIST SP 800-63B: at least 12 characters,
 * at most 128, not built from the account's e-mail, not a well-known
 * password, not a single repeated character. Messages are in Hebrew because
 * the admin UI is Hebrew.
 */

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

/** A short list of passwords that pass the length rule but are known to be guessed first. */
const COMMON_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  'qwertyuiopas',
  'password1234',
  'password12345',
  'passwordpassword',
  'adminadmin123',
  'administrator',
  'margaliot123',
  'margaliot1234',
  'margaliot2026',
  'iloveyou1234',
  'qwerty123456',
  'abcdefghijkl',
  'abc123456789',
])

/** Returns true when acceptable, otherwise a Hebrew error message. */
export function checkPasswordPolicy(
  password: unknown,
  context: { email?: string | null } = {},
): true | string {
  if (typeof password !== 'string' || password.length === 0) return 'יש להזין סיסמה.'
  if (password.length < PASSWORD_MIN_LENGTH) return `הסיסמה חייבת להכיל לפחות ${PASSWORD_MIN_LENGTH} תווים.`
  if (password.length > PASSWORD_MAX_LENGTH) return `הסיסמה יכולה להכיל עד ${PASSWORD_MAX_LENGTH} תווים.`

  const lower = password.toLowerCase()
  if (new Set(lower).size === 1) return 'הסיסמה לא יכולה להיות תו אחד שחוזר על עצמו.'
  if (COMMON_PASSWORDS.has(lower)) return 'הסיסמה נפוצה מדי. יש לבחור סיסמה אחרת.'

  const localPart = context.email?.split('@')[0]?.toLowerCase()
  if (localPart && localPart.length >= 3 && lower.includes(localPart)) {
    return 'הסיסמה לא יכולה לכלול את כתובת הדוא"ל.'
  }
  return true
}
