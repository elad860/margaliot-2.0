import type { MetadataRoute } from 'next'

import { getServerEnv, isProduction } from '@/lib/env'
import { absoluteUrl } from '@/lib/seo/json-ld'

/**
 * robots.txt (task T15; ADR-0002): everything is disallowed unless
 * SITE_ENV=production. In production the admin and API stay disallowed.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isProduction()) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
    sitemap: absoluteUrl(getServerEnv().NEXT_PUBLIC_SITE_URL, '/sitemap.xml'),
  }
}
