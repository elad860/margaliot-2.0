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
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
