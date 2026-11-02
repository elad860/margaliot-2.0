import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { he } from '@payloadcms/translations/languages/he'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Media } from './cms/collections/Media'
import { Users } from './cms/collections/Users'
import { getServerEnv } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const env = getServerEnv()

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SITE_URL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · ניהול מרגליות',
      // The admin is never indexed (ADR-0002); an X-Robots-Tag header is also set in next.config.ts.
      robots: { index: false, follow: false },
      defaultOGImageType: 'off',
    },
  },
  // Hebrew-only admin; Payload renders it right-to-left.
  i18n: {
    supportedLanguages: { he },
    fallbackLanguage: 'he',
  },
  // GraphQL is not used; REST only (ARCHITECTURE-PROPOSAL §10).
  graphQL: {
    disable: true,
  },
  cors: [env.NEXT_PUBLIC_SITE_URL],
  csrf: [env.NEXT_PUBLIC_SITE_URL],
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema "push" is a local-development convenience only. Preview and production
    // change the schema exclusively through committed migrations (ADR-0002).
    push: env.SITE_ENV === 'development' && process.env.PAYLOAD_DB_PUSH !== 'false',
  }),
  upload: {
    limits: { fileSize: MAX_UPLOAD_BYTES },
  },
  sharp,
  plugins: [
    // Media goes to Vercel Blob when a token is configured (preview/production);
    // otherwise uploads stay on local disk (development).
    vercelBlobStorage({
      enabled: Boolean(env.BLOB_READ_WRITE_TOKEN),
      token: env.BLOB_READ_WRITE_TOKEN,
      collections: { media: true },
      clientUploads: true,
    }),
  ],
})
