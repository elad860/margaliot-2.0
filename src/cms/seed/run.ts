/**
 * CLI entry: pnpm seed  (runs through `payload run`, which loads .env).
 * Creates the 15 system pages as drafts. Safe to run repeatedly.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { seedSystemPages } from './system-pages'

const payload = await getPayload({ config })
try {
  const { created, existing } = await seedSystemPages(payload)
  payload.logger.info(
    `Seed finished: ${created.length} page(s) created as drafts, ${existing.length} already existed (left unchanged).`,
  )
} finally {
  await payload.destroy()
}
process.exit(0)
