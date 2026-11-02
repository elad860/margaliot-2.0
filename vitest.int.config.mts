import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Integration tests: run Payload's Local API against a real, DISPOSABLE
 * PostgreSQL database named in DATABASE_URL_TEST. The test setup wipes that
 * database and applies the committed migrations. Never point it at real data.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      '@payload-config': path.resolve(dirname, 'src/payload.config.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/int/**/*.int.test.ts'],
    setupFiles: ['tests/int/setup-env.ts'],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
})
