import type { Page } from '@/payload-types'

/**
 * Page intro below the h1 (unstyled stub, T14). The visual Hero comes in T28.
 * Renders nothing when the hero is empty.
 */
export function PageHero({ hero }: { hero: Page['hero'] }) {
  const heading = hero?.heading?.trim()
  const subheading = hero?.subheading?.trim()
  if (!heading && !subheading) return null
  return (
    <div data-region="hero">
      {heading ? <p>{heading}</p> : null}
      {subheading ? <p>{subheading}</p> : null}
    </div>
  )
}
