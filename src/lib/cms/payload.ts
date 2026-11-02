import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/** The Payload Local API for server components and route handlers. Payload caches the instance itself. */
export function getPayloadClient(): Promise<Payload> {
  return getPayload({ config })
}
