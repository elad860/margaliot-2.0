import type { CollectionBeforeOperationHook } from 'payload'
import { APIError, ValidationError } from 'payload'

import { isStaffUser } from '@/cms/access/roles'
import { getServerEnv } from '@/lib/env'
import { validateSubmission, type FormFieldDef } from '@/lib/forms/validate-submission'
import { clientIp, createRateLimiter } from '@/lib/security/rate-limit'
import { verifyTurnstile } from '@/lib/security/turnstile'

/** Name of the hidden honeypot input the site's Form block will render (T31). */
export const HONEYPOT_FIELD = 'website'
/** Name of the Turnstile token sent with a submission (T31). */
export const TURNSTILE_FIELD = 'turnstileToken'

const SUBMISSIONS_PER_WINDOW = 5
const WINDOW_MS = 10 * 60 * 1000
const limiter = createRateLimiter({ limit: SUBMISSIONS_PER_WINDOW, windowMs: WINDOW_MS })

function reject(message: string, status = 400): never {
  throw new APIError(message, status, undefined, true)
}

/**
 * Protects public form submissions (task T16; ARCHITECTURE-PROPOSAL §10):
 * rate limit per IP → honeypot → server-side validation against the form →
 * Cloudflare Turnstile. Staff entering a submission in the admin skip the
 * spam checks. Runs before Payload processes the data, then strips the
 * honeypot and token so they are never stored.
 */
export const protectSubmissions: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
  collection,
}) => {
  if (operation !== 'create') return args
  const data = (args.data ?? {}) as Record<string, unknown>
  const honeypot = data[HONEYPOT_FIELD]
  const token = data[TURNSTILE_FIELD]
  delete data[HONEYPOT_FIELD]
  delete data[TURNSTILE_FIELD]

  if (!isStaffUser(req.user)) {
    const ip = clientIp(req.headers)
    const rate = limiter(ip)
    if (!rate.allowed) reject('נשלחו יותר מדי פניות. אפשר לנסות שוב בעוד כמה דקות.', 429)
    if (typeof honeypot === 'string' && honeypot.trim() !== '') reject('לא ניתן לשלוח את הטופס.')

    const formId = data.form
    if (typeof formId !== 'number' && typeof formId !== 'string') reject('הטופס לא נמצא.')
    let fields: FormFieldDef[] = []
    try {
      const form = await req.payload.findByID({
        collection: 'forms',
        id: formId,
        depth: 0,
        overrideAccess: true,
      })
      fields = (form.fields ?? []) as FormFieldDef[]
    } catch {
      reject('הטופס לא נמצא.')
    }
    const errors = validateSubmission(fields, data.submissionData)
    if (errors.length > 0) {
      throw new ValidationError({
        collection: collection.slug,
        errors: errors.map((message) => ({ path: 'submissionData', message })),
      })
    }

    const verified = await verifyTurnstile({ token, secret: getServerEnv().TURNSTILE_SECRET_KEY, ip })
    if (!verified) reject('אימות נגד ספאם נכשל. יש לרענן את הדף ולנסות שוב.', 403)
  }
  return { ...args, data }
}
