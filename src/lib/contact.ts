/**
 * Contact and social helpers (task T13; UX review F11).
 *
 * Every value comes from SiteSettings. Empty or invalid values produce NO
 * output, so the element that would show them is simply not rendered. No
 * placeholder links or numbers, ever.
 */
import { SOCIAL_NETWORKS, type SocialKey } from '@/config/social'

import { checkPhone, checkUrlOnHosts, normalisePhone } from './validators'

/** The parts of SiteSettings these helpers read. */
export type ContactSettings = {
  phones?: ({ label?: string | null; number?: string | null } | null)[] | null
  whatsappNumber?: string | null
  defaultWhatsappMessage?: string | null
  email?: string | null
  officeHours?: string | null
  socials?: Partial<Record<SocialKey, string | null>> | null
}

export type SocialLink = { key: SocialKey; label: string; href: string }

/** Social links that are set and valid, in a fixed order. Empty list when none. */
export function getSocialLinks(settings: ContactSettings | null | undefined): SocialLink[] {
  return SOCIAL_NETWORKS.flatMap((network) => {
    const href = settings?.socials?.[network.key]?.trim()
    if (!href || checkUrlOnHosts(href, network.hosts, network.label) !== true) return []
    return [{ key: network.key, label: network.label, href }]
  })
}

/**
 * wa.me link for the configured number, with an optional pre-filled message
 * (the page's own message, else the site default). Null when no valid number.
 */
export function whatsappHref(
  number: string | null | undefined,
  message?: string | null,
  fallbackMessage?: string | null,
): string | null {
  const raw = number?.trim()
  if (!raw || checkPhone(raw) !== true) return null
  const digits = normalisePhone(raw).replace(/^\+/, '')
  const text = message?.trim() || fallbackMessage?.trim()
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export type ContactDetails = {
  phones: { label?: string; number: string; href: string }[]
  email: { address: string; href: string } | null
  whatsapp: string | null
  officeHours: string | null
}

/** Contact details that are set. Each part is empty/null when not supplied. */
export function getContactDetails(settings: ContactSettings | null | undefined): ContactDetails {
  const phones = (settings?.phones ?? []).flatMap((phone) => {
    const number = phone?.number?.trim()
    if (!number || checkPhone(number) !== true) return []
    const label = phone?.label?.trim()
    return [{ ...(label ? { label } : {}), number, href: `tel:${normalisePhone(number)}` }]
  })
  const email = settings?.email?.trim()
  return {
    phones,
    email: email ? { address: email, href: `mailto:${email}` } : null,
    whatsapp: whatsappHref(settings?.whatsappNumber, null, settings?.defaultWhatsappMessage),
    officeHours: settings?.officeHours?.trim() || null,
  }
}

/** True when there is nothing at all to show (the contact/social area is then hidden). */
export function hasAnyContact(settings: ContactSettings | null | undefined): boolean {
  const details = getContactDetails(settings)
  return (
    details.phones.length > 0 ||
    details.email !== null ||
    details.whatsapp !== null ||
    details.officeHours !== null ||
    getSocialLinks(settings).length > 0
  )
}
