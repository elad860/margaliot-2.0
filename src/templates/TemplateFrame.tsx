import type { ReactNode } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { PageHero } from '@/components/content/PageHero'
import type { TemplateKey } from '@/config/site-map'
import type { Page } from '@/payload-types'

/**
 * Shared skeleton of every system-page template (T14, unstyled): one h1 (the
 * fixed page name), the hero, the template's data region, then the editor's
 * blocks. `data-template` is the hook for per-template character (Phase 2).
 */
export function TemplateFrame({
  page,
  template,
  children,
}: {
  page: Page
  template: TemplateKey
  children?: ReactNode
}) {
  return (
    <article data-template={template}>
      <h1>{page.title}</h1>
      <PageHero hero={page.hero} />
      {children}
      <RenderBlocks blocks={page.layout} />
    </article>
  )
}
