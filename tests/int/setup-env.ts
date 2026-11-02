/**
 * Runs before integration test files are imported: loads .env (if present)
 * and redirects Payload to the disposable test database.
 */
import { existsSync } from 'node:fs'

if (existsSync('.env')) process.loadEnvFile('.env')

const testUrl = process.env.DATABASE_URL_TEST
if (!testUrl) {
  throw new Error(
    'DATABASE_URL_TEST is not set. Point it at a disposable PostgreSQL database ' +
      '(it is wiped on every run), e.g. postgres://postgres:postgres@127.0.0.1:5432/margaliot_test',
  )
}
if (testUrl === process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL_TEST must differ from DATABASE_URL: the test database is wiped on every run.')
}

process.env.DATABASE_URL = testUrl
process.env.SITE_ENV = 'development'
process.env.PAYLOAD_DB_PUSH = 'false' // exercise the committed migrations, not schema push
