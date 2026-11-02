import type { RegistrationMode } from '@/cms/fields/registration'

/**
 * Registration button (ADR-0005). Phase A: renders NOTHING for every mode.
 * Where registration leads before the booking system exists is still open
 * (OPEN-DECISIONS #4), so no active registration button is shown anywhere,
 * even if an editor picks a mode. Enabled in T32 once the owner decides (D7).
 */
export function RegistrationAction(_props: { registration?: { mode?: RegistrationMode | null } | null }) {
  return null
}
