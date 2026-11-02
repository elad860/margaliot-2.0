import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

import { EnvError, getServerEnv } from './src/lib/env'

// Fail fast with a readable message when required variables are missing (T02).
try {
  getServerEnv()
} catch (error) {
  if (error instanceof EnvError) {
    console.error(`\n${error.message}\n`)
    process.exit(1)
  }
  throw error
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Do not auto-generate AGENTS.md; project agent rules live in CLAUDE.md.
  agentRules: false,
  experimental: {
    // Two root layouts (site + Payload admin): unmatched URLs use app/global-not-found.tsx (Hebrew, RTL).
    globalNotFound: true,
  },
  async headers() {
    const noindex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
    // Every non-production environment is noindex on every response (ADR-0002, T15).
    if (getServerEnv().SITE_ENV !== 'production') {
      return [{ source: '/:path*', headers: noindex }]
    }
    // Production: the CMS admin and API are still never indexed.
    return [
      { source: '/admin/:path*', headers: noindex },
      { source: '/admin', headers: noindex },
      { source: '/api/:path*', headers: noindex },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
