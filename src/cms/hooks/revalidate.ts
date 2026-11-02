import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

/**
 * On-demand revalidation (task T12; ARCHITECTURE-PROPOSAL §6.2).
 *
 * Publishing, unpublishing or deleting anything public refreshes the whole
 * site layout (navigation, footer and every page can depend on any document)
 * plus the sitemap. The site is small, so one broad revalidation is simpler
 * and safer than tracking dependencies. Draft-only saves do not revalidate.
 *
 * Outside a Next.js server (seed, migrations, integration tests) there is
 * nothing to revalidate and revalidatePath throws; that is ignored.
 * Set `context.disableRevalidate` to skip it explicitly.
 */
export function revalidateSite(req: PayloadRequest): void {
  if (req.context?.disableRevalidate) return
  try {
    revalidatePath('/', 'layout')
    revalidatePath('/sitemap.xml')
  } catch (error) {
    req.payload.logger.debug({ msg: 'Revalidation skipped (not running inside Next.js)', err: error })
  }
}

type WithStatus = { _status?: string | null } | null | undefined

/** True when the change can affect what the public sees. */
export function affectsPublic(doc: WithStatus, previousDoc: WithStatus): boolean {
  const hasDrafts = doc?._status !== undefined || previousDoc?._status !== undefined
  if (!hasDrafts) return true
  return doc?._status === 'published' || previousDoc?._status === 'published'
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  if (affectsPublic(doc, previousDoc)) revalidateSite(req)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  revalidateSite(req)
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  revalidateSite(req)
  return doc
}

export const revalidateHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
}
