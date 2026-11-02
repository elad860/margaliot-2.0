import { describe, expect, it } from 'vitest'

import { EnvError, isProduction, validateEnv } from '@/lib/env'

const secret = 'x'.repeat(32)
const base = { DATABASE_URL: 'postgres://u@127.0.0.1:5432/db', PAYLOAD_SECRET: secret }

function problemsOf(source: Record<string, string | undefined>): string[] {
  try {
    validateEnv(source)
    return []
  } catch (error) {
    if (error instanceof EnvError) return error.problems
    throw error
  }
}

describe('validateEnv (T02)', () => {
  it('accepts a minimal development environment and applies defaults', () => {
    const env = validateEnv(base)
    expect(env.SITE_ENV).toBe('development')
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
    expect(isProduction(env)).toBe(false)
  })

  it('refuses to start without DATABASE_URL and PAYLOAD_SECRET, naming both', () => {
    const problems = problemsOf({})
    expect(problems.join('\n')).toMatch(/DATABASE_URL/)
    expect(problems.join('\n')).toMatch(/PAYLOAD_SECRET/)
  })

  it('gives a readable message', () => {
    expect(() => validateEnv({})).toThrow(/cannot start.*\n.*DATABASE_URL/s)
  })

  it('rejects short secrets, non-Postgres URLs and unknown SITE_ENV values', () => {
    const problems = problemsOf({ DATABASE_URL: 'mysql://x', PAYLOAD_SECRET: 'short', SITE_ENV: 'staging' })
    expect(problems).toHaveLength(3)
  })

  it('treats empty strings as missing', () => {
    expect(problemsOf({ DATABASE_URL: '  ', PAYLOAD_SECRET: '' })).toHaveLength(2)
  })

  it('requires site URL, Blob token and preview secret outside development', () => {
    const problems = problemsOf({ ...base, SITE_ENV: 'preview' })
    expect(problems.join('\n')).toMatch(/NEXT_PUBLIC_SITE_URL/)
    expect(problems.join('\n')).toMatch(/BLOB_READ_WRITE_TOKEN/)
    expect(problems.join('\n')).toMatch(/PREVIEW_SECRET/)
    expect(
      validateEnv({
        ...base,
        SITE_ENV: 'preview',
        NEXT_PUBLIC_SITE_URL: 'https://x.vercel.app',
        BLOB_READ_WRITE_TOKEN: 'token',
        PREVIEW_SECRET: secret,
      }).SITE_ENV,
    ).toBe('preview')
  })
})
