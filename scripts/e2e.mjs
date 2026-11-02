#!/usr/bin/env node
/**
 * End-to-end test server (task T17). Runs everything against a DISPOSABLE
 * database named in DATABASE_URL_E2E, which is wiped on every `prepare`.
 *
 *   node scripts/e2e.mjs prepare   wipe + migrate + seed the e2e database
 *   node scripts/e2e.mjs build     next build against the e2e database
 *   node scripts/e2e.mjs serve     next start on E2E_PORT (default 3200)
 *   node scripts/e2e.mjs all       prepare, build, serve (local default)
 *
 * The build must use the same database as the server: pages are statically
 * generated from it. Secrets are generated per run when not provided; they
 * are throwaway values for this local test server only.
 */
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')

const mode = process.argv[2] ?? 'all'
const port = process.env.E2E_PORT ?? '3200'
const e2eUrl = process.env.DATABASE_URL_E2E

if (!e2eUrl) {
  console.error('DATABASE_URL_E2E is not set. Point it at a disposable PostgreSQL database (it is wiped).')
  process.exit(1)
}
if (e2eUrl === process.env.DATABASE_URL) {
  console.error('DATABASE_URL_E2E must differ from DATABASE_URL: the e2e database is wiped on every run.')
  process.exit(1)
}

const env = {
  ...process.env,
  DATABASE_URL: e2eUrl,
  SITE_ENV: 'development',
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
  PAYLOAD_DB_PUSH: 'false',
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || randomBytes(32).toString('hex'),
  PREVIEW_SECRET: process.env.E2E_PREVIEW_SECRET,
  // Forms: no Turnstile secret, so anonymous submissions are rejected (fail closed).
  TURNSTILE_SECRET_KEY: '',
  NEXT_TELEMETRY_DISABLED: '1',
}
if (!env.PREVIEW_SECRET) {
  console.error('E2E_PREVIEW_SECRET is not set (playwright.config.ts sets it).')
  process.exit(1)
}

function run(args) {
  const result = spawnSync('pnpm', args, { env, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (mode === 'prepare' || mode === 'all') {
  run(['payload', 'migrate:fresh', '--force-accept-warning'])
  run(['seed'])
}
if (mode === 'build' || mode === 'all') {
  run(['build'])
}
if (mode === 'serve' || mode === 'all') {
  const server = spawn('pnpm', ['start', '-p', port], { env, stdio: 'inherit' })
  const stop = () => server.kill('SIGTERM')
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  server.on('exit', (code) => process.exit(code ?? 0))
}
