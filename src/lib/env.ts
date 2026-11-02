/**
 * Typed, fail-fast access to environment variables (task T02, ADR-0002).
 *
 * Server-only: never import this from a client component. Public values that
 * the browser needs must be prefixed NEXT_PUBLIC_ and read directly.
 *
 * `validateEnv` is pure (takes the variables as an argument) so it can be
 * unit-tested; `getServerEnv` validates `process.env` once and caches it.
 */

export const SITE_ENVS = ['development', 'preview', 'production'] as const
export type SiteEnv = (typeof SITE_ENVS)[number]

export type ServerEnv = {
  DATABASE_URL: string
  PAYLOAD_SECRET: string
  SITE_ENV: SiteEnv
  NEXT_PUBLIC_SITE_URL: string
  /** Vercel Blob token. Required outside development; local disk storage is used without it. */
  BLOB_READ_WRITE_TOKEN: string | undefined
  /** Shared secret for the preview route (T12). Required outside development. */
  PREVIEW_SECRET: string | undefined
  /**
   * Cloudflare Turnstile secret (T16). Optional: without it, anonymous form
   * submissions are rejected (fail closed). Forms stay off publicly until the
   * privacy page and the submission destination are approved anyway.
   */
  TURNSTILE_SECRET_KEY: string | undefined
}

type EnvSource = Record<string, string | undefined>

export class EnvError extends Error {
  constructor(public readonly problems: string[]) {
    super(
      [
        'Margaliot cannot start: the environment is not configured correctly.',
        ...problems.map((p) => `  - ${p}`),
        'Copy .env.example to .env and fill in the missing values (see README, "Environment").',
      ].join('\n'),
    )
    this.name = 'EnvError'
  }
}

const MIN_SECRET_LENGTH = 32

function read(source: EnvSource, key: string): string | undefined {
  const value = source[key]?.trim()
  return value ? value : undefined
}

export function validateEnv(source: EnvSource): ServerEnv {
  const problems: string[] = []

  const rawSiteEnv = read(source, 'SITE_ENV') ?? 'development'
  const SITE_ENV = (SITE_ENVS as readonly string[]).includes(rawSiteEnv) ? (rawSiteEnv as SiteEnv) : undefined
  if (!SITE_ENV) {
    problems.push(`SITE_ENV must be one of ${SITE_ENVS.join(' | ')} (got "${rawSiteEnv}").`)
  }
  const isDeployed = SITE_ENV === 'preview' || SITE_ENV === 'production'

  const DATABASE_URL = read(source, 'DATABASE_URL')
  if (!DATABASE_URL) {
    problems.push('DATABASE_URL is missing (PostgreSQL connection string).')
  } else if (!/^postgres(ql)?:\/\//.test(DATABASE_URL)) {
    problems.push('DATABASE_URL must start with postgres:// or postgresql://.')
  }

  const PAYLOAD_SECRET = read(source, 'PAYLOAD_SECRET')
  if (!PAYLOAD_SECRET) {
    problems.push('PAYLOAD_SECRET is missing (generate one with: openssl rand -hex 32).')
  } else if (PAYLOAD_SECRET.length < MIN_SECRET_LENGTH) {
    problems.push(`PAYLOAD_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`)
  }

  let NEXT_PUBLIC_SITE_URL = read(source, 'NEXT_PUBLIC_SITE_URL')
  if (!NEXT_PUBLIC_SITE_URL) {
    if (isDeployed) problems.push('NEXT_PUBLIC_SITE_URL is required outside development.')
    else NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
  } else {
    try {
      new URL(NEXT_PUBLIC_SITE_URL)
    } catch {
      problems.push('NEXT_PUBLIC_SITE_URL must be an absolute URL, e.g. http://localhost:3000.')
    }
  }

  const BLOB_READ_WRITE_TOKEN = read(source, 'BLOB_READ_WRITE_TOKEN')
  const PREVIEW_SECRET = read(source, 'PREVIEW_SECRET')
  if (isDeployed) {
    if (!BLOB_READ_WRITE_TOKEN) problems.push('BLOB_READ_WRITE_TOKEN is required outside development.')
    if (!PREVIEW_SECRET) problems.push('PREVIEW_SECRET is required outside development.')
  }
  if (PREVIEW_SECRET && PREVIEW_SECRET.length < MIN_SECRET_LENGTH) {
    problems.push(`PREVIEW_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`)
  }

  if (problems.length > 0) throw new EnvError(problems)

  return {
    DATABASE_URL: DATABASE_URL!,
    PAYLOAD_SECRET: PAYLOAD_SECRET!,
    SITE_ENV: SITE_ENV!,
    NEXT_PUBLIC_SITE_URL: NEXT_PUBLIC_SITE_URL!,
    BLOB_READ_WRITE_TOKEN,
    PREVIEW_SECRET,
    TURNSTILE_SECRET_KEY: read(source, 'TURNSTILE_SECRET_KEY'),
  }
}

let cached: ServerEnv | undefined

/** Validated server environment. Throws EnvError with a readable message on first use if misconfigured. */
export function getServerEnv(): ServerEnv {
  cached ??= validateEnv(process.env)
  return cached
}

/** True only for the real production site. Everything else is noindex (ADR-0002). */
export function isProduction(env: Pick<ServerEnv, 'SITE_ENV'> = getServerEnv()): boolean {
  return env.SITE_ENV === 'production'
}
