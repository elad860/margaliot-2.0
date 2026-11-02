/**
 * CLI entry: pnpm seed  (runs through `payload run`, which loads .env).
 * Creates the 15 system pages as drafts and saves the Navigation defaults.
 * Never writes site settings or users. Safe to run repeatedly.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { seedNavigation } from './globals'
import { seedSystemPages } from './system-pages'

const payload = await getPayload({ config })
try {
  const { created, existing } = await seedSystemPages(payload)
  payload.logger.info(
    `Seed finished: ${created.length} page(s) created as drafts, ${existing.length} already existed (left unchanged).`,
  )
  const navigation = await seedNavigation(payload)
  payload.logger.info(
    navigation === 'created'
      ? 'Navigation defaults saved. Site settings left empty.'
      : 'Navigation already saved (left unchanged). Site settings left empty.',
  )
} finally {
  await payload.destroy()
}
process.exit(0)
