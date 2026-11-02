import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end and accessibility smoke tests (task T17).
 *
 * The web server runs against a disposable database (DATABASE_URL_E2E),
 * prepared and built by scripts/e2e.mjs. In CI the workflow prepares and
 * builds in earlier steps, so here it only serves.
 *
 * Tests change shared state (they publish pages), so they run in one worker,
 * in file order, without retries.
 */
const port = process.env.E2E_PORT ?? '3200'

// A fixed throwaway value shared by the test server and the tests (not a real secret).
process.env.E2E_PREVIEW_SECRET ??= 'e2e-only-throwaway-preview-secret-0000'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${port}`,
    locale: 'he-IL',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `node scripts/e2e.mjs ${process.env.CI ? 'serve' : 'all'}`,
    url: `http://localhost:${port}/robots.txt`,
    reuseExistingServer: false,
    timeout: 600_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
