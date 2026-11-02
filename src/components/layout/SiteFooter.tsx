import Link from 'next/link'

import type { ContactDetails, SocialLink } from '@/lib/contact'
import type { NavLink, SiteNavigation } from '@/lib/navigation'

function LinkList({ links }: { links: NavLink[] }) {
  return (
    <ul>
      {links.map((link) => (
        <li key={link.key}>
          <Link href={link.href}>{link.label}</Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Footer (UNSTYLED stub, T14; designed in T26). Published pages only, in the
 * header's groups and order. Contact details and social links render only
 * when set in SiteSettings; with nothing set, nothing is shown.
 */
export function SiteFooter({
  nav,
  contact,
  socials,
}: {
  nav: SiteNavigation
  contact: ContactDetails
  socials: SocialLink[]
}) {
  const { groups, direct, legal, extra } = nav.footer
  const hasSiteLinks = groups.length > 0 || direct.length > 0 || extra.length > 0
  const hasContact = contact.phones.length > 0 || contact.email || contact.whatsapp || contact.officeHours
  return (
    <footer>
      {hasSiteLinks ? (
        <nav aria-label="קישורי האתר">
          {groups.map((group) => (
            <div key={group.key}>
              <p>{group.label}</p>
              <LinkList links={group.links} />
            </div>
          ))}
          {direct.length > 0 ? <LinkList links={direct} /> : null}
          {extra.length > 0 ? (
            <ul>
              {extra.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      ) : null}
      {hasContact ? (
        <address>
          {contact.phones.map((phone) => (
            <p key={phone.href}>
              {phone.label ? `${phone.label}: ` : null}
              <a href={phone.href} dir="ltr">
                {phone.number}
              </a>
            </p>
          ))}
          {contact.email ? (
            <p>
              <a href={contact.email.href}>{contact.email.address}</a>
            </p>
          ) : null}
          {contact.whatsapp ? (
            <p>
              <a href={contact.whatsapp}>וואטסאפ</a>
            </p>
          ) : null}
          {contact.officeHours ? <p>{contact.officeHours}</p> : null}
        </address>
      ) : null}
      {socials.length > 0 ? (
        <ul aria-label="רשתות חברתיות">
          {socials.map((social) => (
            <li key={social.key}>
              <a href={social.href} target="_blank" rel="noopener noreferrer">
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {legal.length > 0 ? (
        <nav aria-label="מידע משפטי">
          <LinkList links={legal} />
        </nav>
      ) : null}
    </footer>
  )
}
