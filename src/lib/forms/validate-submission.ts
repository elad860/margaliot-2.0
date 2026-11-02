/**
 * Server-side validation of a form-builder submission against its form
 * definition (task T16). Pure; returns Hebrew error messages (empty = valid).
 *
 * Rejects unknown fields, missing required fields, malformed e-mails,
 * select values outside the options, over-long values and oversized payloads.
 */
export const MAX_VALUE_LENGTH = 5000
export const MAX_FIELDS = 50

export type FormFieldDef = {
  blockType?: string | null
  name?: string | null
  required?: boolean | null
  options?: { value?: string | null }[] | null
}

export type SubmissionEntry = { field?: unknown; value?: unknown }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSubmission(fields: FormFieldDef[] | null | undefined, data: unknown): string[] {
  if (!Array.isArray(data)) return ['נתוני הטופס חסרים.']
  if (data.length > MAX_FIELDS) return ['הטופס מכיל יותר מדי שדות.']

  const defs = new Map(
    (fields ?? []).filter((f) => f.name && f.blockType !== 'message').map((f) => [f.name as string, f]),
  )
  const errors: string[] = []
  const seen = new Map<string, string>()

  for (const entry of data as SubmissionEntry[]) {
    if (typeof entry?.field !== 'string' || typeof entry.value !== 'string') {
      errors.push('נתוני הטופס אינם תקינים.')
      continue
    }
    if (!defs.has(entry.field)) {
      errors.push(`שדה לא מוכר: ${entry.field}`)
      continue
    }
    if (seen.has(entry.field)) {
      errors.push(`השדה מופיע פעמיים: ${entry.field}`)
      continue
    }
    if (entry.value.length > MAX_VALUE_LENGTH) errors.push(`הערך ארוך מדי: ${entry.field}`)
    seen.set(entry.field, entry.value)
  }

  for (const [name, def] of defs) {
    const value = seen.get(name)?.trim() ?? ''
    if (def.required && (value === '' || (def.blockType === 'checkbox' && value !== 'true'))) {
      errors.push(`שדה חובה חסר: ${name}`)
      continue
    }
    if (value === '') continue
    if (def.blockType === 'email' && !EMAIL.test(value)) errors.push(`כתובת דוא"ל לא תקינה: ${name}`)
    if (def.blockType === 'checkbox' && value !== 'true' && value !== 'false')
      errors.push(`ערך לא תקין: ${name}`)
    if (def.blockType === 'select') {
      const allowed = (def.options ?? []).map((o) => o.value)
      if (!allowed.includes(value)) errors.push(`ערך לא תקין: ${name}`)
    }
  }
  return errors
}
