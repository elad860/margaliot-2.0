import type { Payload } from 'payload'

import { SITE_MAP } from '@/config/site-map'

/** The only text the seed ever writes (CLAUDE.md: no invented content). */
export const PLACEHOLDER = '[תוכן יתווסף]'

export type SeedResult = { created: string[]; existing: string[] }

/**
 * Creates the 15 system pages (home, 11 tabs, 3 legal) as DRAFTS (task T08).
 *
 * - Idempotent: pages that already exist (draft or published) are left
 *   untouched, so editors' work is never overwritten.
 * - Nothing is published. Titles come from the registry via the Pages hook.
 * - Content is empty apart from the placeholder marker in the hero.
 * - Users are never seeded.
 */
export async function seedSystemPages(payload: Payload): Promise<SeedResult> {
  const result: SeedResult = { created: [], existing: [] }

  for (const page of SITE_MAP) {
    const found = await payload.find({
      collection: 'pages',
      where: { systemKey: { equals: page.key } },
      draft: true,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (found.totalDocs > 0) {
      result.existing.push(page.key)
      continue
    }
    await payload.create({
      collection: 'pages',
      draft: true,
      overrideAccess: true,
      data: {
        systemKey: page.key,
        title: page.name,
        _status: 'draft',
        hero: { subheading: PLACEHOLDER },
      },
    })
    result.created.push(page.key)
  }

  return result
}
