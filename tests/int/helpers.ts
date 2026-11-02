import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

import config from '@payload-config'

import { migrations } from '../../src/migrations'

let instance: Payload | undefined

/** Payload connected to the test DB, wiped and migrated from the committed migrations. */
export async function getTestPayload(): Promise<Payload> {
  if (instance) return instance
  const payload = await getPayload({ config })
  const db = payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
  await db.drizzle.execute(sql`drop schema if exists public cascade; create schema public;`)
  // Pass the migrations explicitly so Vite transforms them (Payload's file loader cannot under Vitest).
  // Generated migration types are narrower than the adapter's Migration type.
  await payload.db.migrate({ migrations: migrations as never })
  instance = payload
  return payload
}

/** A password that satisfies the policy; generated per run, never a fixed credential. */
export function strongPassword(): string {
  return `t-${crypto.randomUUID()}`
}
