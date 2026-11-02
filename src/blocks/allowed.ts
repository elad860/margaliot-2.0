/**
 * Block slugs and the per-template allow-lists (task T11; ARCHITECTURE-PROPOSAL §8.1).
 * Pure data with no Payload imports, so it can be unit-tested and used by the site.
 */
import type { TemplateKey } from '@/config/site-map'

export const BLOCK_SLUGS = [
  'hero',
  'textImage',
  'cards',
  'tripSummary',
  'eventList',
  'gallery',
  'video',
  'testimonials',
  'faq',
  'cta',
  'form',
  'social',
] as const

export type BlockSlug = (typeof BLOCK_SLUGS)[number]

export const TEMPLATE_BLOCKS: Record<TemplateKey, readonly BlockSlug[]> = {
  home: BLOCK_SLUGS,
  information: [
    'hero',
    'textImage',
    'cards',
    'testimonials',
    'faq',
    'cta',
    'form',
    'gallery',
    'video',
    'social',
  ],
  trip: ['hero', 'textImage', 'gallery', 'video', 'testimonials', 'faq', 'cta', 'social'],
  activity: ['hero', 'textImage', 'gallery', 'video', 'testimonials', 'faq', 'cta', 'form'],
  library: ['hero', 'textImage', 'video', 'cta', 'social'],
  legal: [],
}

export function allowedBlocksFor(template: unknown): readonly BlockSlug[] {
  return typeof template === 'string' && template in TEMPLATE_BLOCKS
    ? TEMPLATE_BLOCKS[template as TemplateKey]
    : []
}

/** Block types in `layout` that the template does not allow. */
export function disallowedBlocks(template: unknown, layout: unknown): string[] {
  if (!Array.isArray(layout)) return []
  const allowed = allowedBlocksFor(template) as readonly string[]
  return layout
    .map((block) => (block as { blockType?: unknown } | null)?.blockType)
    .filter((type): type is string => typeof type === 'string' && !allowed.includes(type))
}
