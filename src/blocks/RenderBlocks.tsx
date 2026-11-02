import type { Page } from '@/payload-types'

type LayoutBlock = NonNullable<Page['layout']>[number]

/**
 * Block renderer stub (T14). Real renderers arrive with T28–T31; until then a
 * block shows only its heading (if any) as plain semantic HTML, and a block
 * without a heading renders nothing — never a broken or empty shell.
 */
export function RenderBlocks({ blocks }: { blocks: Page['layout'] }) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block: LayoutBlock, index) => {
        const heading = 'heading' in block ? block.heading?.trim() : undefined
        if (!heading) return null
        return (
          <section key={block.id ?? index} data-block={block.blockType} data-variant={block.variant}>
            <h2>{heading}</h2>
          </section>
        )
      })}
    </>
  )
}
