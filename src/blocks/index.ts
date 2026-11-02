/**
 * Block registry (task T11). Schemas only; renderers (Component.tsx) come in T28–T31.
 * The order here is the order editors see in the "add block" menu.
 */
import type { Block } from 'payload'

import type { BlockSlug } from './allowed'
import { CardsBlock } from './Cards/config'
import { CTABlock } from './CTA/config'
import { EventListBlock } from './EventList/config'
import { FAQBlock } from './FAQ/config'
import { FormBlock } from './Form/config'
import { GalleryBlock } from './Gallery/config'
import { HeroBlock } from './Hero/config'
import { SocialBlock } from './Social/config'
import { TestimonialsBlock } from './Testimonials/config'
import { TextImageBlock } from './TextImage/config'
import { TripSummaryBlock } from './TripSummary/config'
import { VideoBlock } from './Video/config'

export { BLOCK_SLUGS, TEMPLATE_BLOCKS, allowedBlocksFor, disallowedBlocks } from './allowed'
export type { BlockSlug } from './allowed'

export const BLOCKS: Record<BlockSlug, Block> = {
  hero: HeroBlock,
  textImage: TextImageBlock,
  cards: CardsBlock,
  tripSummary: TripSummaryBlock,
  eventList: EventListBlock,
  gallery: GalleryBlock,
  video: VideoBlock,
  testimonials: TestimonialsBlock,
  faq: FAQBlock,
  cta: CTABlock,
  form: FormBlock,
  social: SocialBlock,
}

export const ALL_BLOCKS: Block[] = Object.values(BLOCKS)
