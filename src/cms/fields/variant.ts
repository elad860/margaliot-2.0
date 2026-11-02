import type { SelectField } from 'payload'

export type VariantOption = { value: string; label: string }

/** Phase 1 has one neutral layout per block; Phase 2 (Design System) adds more options here. */
export const DEFAULT_VARIANTS: readonly VariantOption[] = [{ value: 'default', label: 'ברירת מחדל' }]

/**
 * Shared `variant` field for every block (task T11). It chooses the block's
 * layout only, never its content, so the Phase 2 design can add or change
 * layouts without anyone re-entering content.
 */
export function variantField(options: readonly VariantOption[] = DEFAULT_VARIANTS): SelectField {
  return {
    name: 'variant',
    type: 'select',
    label: 'פריסה',
    required: true,
    defaultValue: options[0]?.value ?? 'default',
    options: options.map((option) => ({ ...option })),
    admin: { description: 'אופן התצוגה בלבד. שינוי הפריסה אינו משנה את התוכן.' },
  }
}
