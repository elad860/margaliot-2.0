import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Do not auto-generate AGENTS.md; project agent rules live in CLAUDE.md.
  agentRules: false,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
