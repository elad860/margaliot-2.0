import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  ALL_BLOCKS,
  BLOCKS,
  BLOCK_SLUGS,
  TEMPLATE_BLOCKS,
  allowedBlocksFor,
  disallowedBlocks,
} from '@/blocks'
import { Pages } from '@/cms/collections/Pages'

describe('block registry (T11)', () => {
  it('has the 12 blocks from the proposal, keyed by slug', () => {
    expect(BLOCK_SLUGS).toHaveLength(12)
    for (const slug of BLOCK_SLUGS) expect(BLOCKS[slug].slug).toBe(slug)
    expect(ALL_BLOCKS).toHaveLength(12)
  })

  it('gives every block a required layout `variant` field with a default', () => {
    for (const block of ALL_BLOCKS) {
      const variant = block.fields.find(
        (f): f is Field & { name: string } => 'name' in f && f.name === 'variant',
      )
      expect(variant, block.slug).toBeDefined()
      expect(variant).toMatchObject({ type: 'select', required: true, defaultValue: 'default' })
    }
  })

  it('Form references a form-builder form; Video is YouTube-only', () => {
    const formField = BLOCKS.form.fields.find((f) => 'name' in f && f.name === 'form')
    expect(formField).toMatchObject({ type: 'relationship', relationTo: 'forms', required: true })
    const url = BLOCKS.video.fields.find((f) => 'name' in f && f.name === 'url') as {
      validate: (v: unknown) => unknown
    }
    expect(url.validate('https://youtu.be/abcdefghijk')).toBe(true)
    expect(url.validate('https://vimeo.com/1')).toEqual(expect.any(String))
  })
})

describe('template allow-lists (T11)', () => {
  it('match ARCHITECTURE-PROPOSAL §8.1', () => {
    expect(TEMPLATE_BLOCKS.home).toEqual(BLOCK_SLUGS)
    expect(TEMPLATE_BLOCKS.legal).toEqual([])
    expect(TEMPLATE_BLOCKS.library).toEqual(['hero', 'textImage', 'video', 'cta', 'social'])
    expect(TEMPLATE_BLOCKS.activity).not.toContain('social')
    expect(TEMPLATE_BLOCKS.trip).not.toContain('form')
    expect(TEMPLATE_BLOCKS.information).not.toContain('tripSummary')
  })

  it('only lists known blocks', () => {
    for (const list of Object.values(TEMPLATE_BLOCKS)) {
      for (const slug of list) expect(BLOCK_SLUGS).toContain(slug)
    }
  })

  it('unknown templates allow nothing', () => {
    expect(allowedBlocksFor(undefined)).toEqual([])
    expect(allowedBlocksFor('other')).toEqual([])
  })

  it('reports disallowed blocks', () => {
    expect(disallowedBlocks('library', [{ blockType: 'hero' }, { blockType: 'form' }])).toEqual(['form'])
    expect(disallowedBlocks('legal', [{ blockType: 'hero' }])).toEqual(['hero'])
    expect(disallowedBlocks('home', [{ blockType: 'form' }])).toEqual([])
    expect(disallowedBlocks('home', undefined)).toEqual([])
  })

  it('Pages.layout filters the block menu by template', () => {
    const layout = Pages.fields.find((f) => 'name' in f && f.name === 'layout') as unknown as {
      filterOptions: (args: { data: unknown }) => string[]
    }
    expect(layout.filterOptions({ data: { template: 'library' } })).toEqual([...TEMPLATE_BLOCKS.library])
    expect(layout.filterOptions({ data: { template: 'legal' } })).toEqual([])
  })
})
