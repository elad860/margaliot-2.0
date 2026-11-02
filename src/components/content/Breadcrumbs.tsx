import Link from 'next/link'

import type { Crumb } from '@/lib/navigation'

/**
 * Breadcrumbs for second-level pages only (UX F9). Unstyled stub (T14); the
 * direction-aware separator and styling come in T22.
 */
export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  if (trail.length < 2) return null
  return (
    <nav aria-label="פירורי לחם">
      <ol>
        {trail.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`}>
            {crumb.href ? (
              <Link href={crumb.href}>{crumb.label}</Link>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
