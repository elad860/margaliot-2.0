import type { FieldHook, GroupField } from 'payload'
import { ValidationError } from 'payload'

import { checkHttpsUrl } from '@/lib/validators'

/**
 * Shared `registration` field group (ADR-0005), used on Trips, Events and the CTA block.
 *
 * - `none` is the default: no registration button is shown. Until the owner
 *   decides where registration leads (OPEN-DECISIONS #4) every item stays `none`.
 * - `onsite` exists in the schema for the future booking phase but is hidden
 *   in the admin and rejected on save (drafts included).
 */
export const REGISTRATION_MODES = ['none', 'form', 'whatsapp', 'external', 'onsite'] as const
export type RegistrationMode = (typeof REGISTRATION_MODES)[number]

/** Modes an editor may choose in Phase A. */
export const ACTIVE_REGISTRATION_MODES: readonly RegistrationMode[] = ['none', 'form', 'whatsapp', 'external']

const MODE_LABELS: Record<RegistrationMode, string> = {
  none: 'ללא כפתור הרשמה',
  form: 'טופס באתר',
  whatsapp: 'וואטסאפ',
  external: 'קישור חיצוני',
  onsite: 'הרשמה ותשלום באתר (שמור לשלב ההזמנות)',
}

const rejectReservedMode: FieldHook = ({ value, collection }) => {
  if (
    value !== undefined &&
    value !== null &&
    !ACTIVE_REGISTRATION_MODES.includes(value as RegistrationMode)
  ) {
    throw new ValidationError({
      collection: collection?.slug,
      errors: [{ path: 'registration.mode', message: 'אפשרות ההרשמה הזו עדיין אינה זמינה.' }],
    })
  }
  return value
}

type Sibling = { mode?: RegistrationMode } | undefined

export const registrationField: GroupField = {
  name: 'registration',
  type: 'group',
  label: 'הרשמה',
  admin: {
    description: 'לאן מוביל כפתור ההרשמה. ברירת המחדל: ללא כפתור.',
  },
  fields: [
    {
      name: 'mode',
      type: 'select',
      label: 'סוג הרשמה',
      required: true,
      defaultValue: 'none',
      options: REGISTRATION_MODES.map((value) => ({ value, label: MODE_LABELS[value] })),
      filterOptions: ({ options }) =>
        options.filter((option) =>
          ACTIVE_REGISTRATION_MODES.includes(
            (typeof option === 'string' ? option : option.value) as RegistrationMode,
          ),
        ),
      validate: (value: unknown) =>
        value === undefined ||
        value === null ||
        ACTIVE_REGISTRATION_MODES.includes(value as RegistrationMode) ||
        'אפשרות ההרשמה הזו עדיין אינה זמינה.',
      hooks: { beforeChange: [rejectReservedMode] },
    },
    {
      name: 'label',
      type: 'text',
      label: 'טקסט הכפתור',
      admin: {
        condition: (_, sibling: Sibling) => Boolean(sibling?.mode && sibling.mode !== 'none'),
        description: 'אם ריק, משתמשים בטקסט ברירת המחדל של העיצוב.',
      },
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      label: 'טופס',
      admin: { condition: (_, sibling: Sibling) => sibling?.mode === 'form' },
      validate: (value: unknown, { siblingData }: { siblingData: Sibling }) =>
        siblingData?.mode !== 'form' || Boolean(value) || 'יש לבחור טופס.',
    },
    {
      name: 'whatsappMessage',
      type: 'textarea',
      label: 'הודעת וואטסאפ מוכנה',
      admin: {
        condition: (_, sibling: Sibling) => sibling?.mode === 'whatsapp',
        description: 'מספר הוואטסאפ נלקח מהגדרות האתר. אם לא הוגדר מספר, הכפתור לא יוצג.',
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      label: 'קישור חיצוני',
      admin: { condition: (_, sibling: Sibling) => sibling?.mode === 'external' },
      validate: (value: unknown, { siblingData }: { siblingData: Sibling }) => {
        if (siblingData?.mode !== 'external') return checkHttpsUrl(value)
        if (!value) return 'יש להזין קישור.'
        return checkHttpsUrl(value)
      },
    },
  ],
}
