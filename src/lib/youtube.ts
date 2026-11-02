/**
 * YouTube helpers (T09/T11). The site embeds YouTube only, via the
 * privacy-enhanced youtube-nocookie.com domain (ARCHITECTURE-PROPOSAL §8.2).
 */
import type { ValidationResult } from './validators'

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
]
const ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

/** Extracts the 11-character video id from a YouTube URL, or null if it is not one. */
export function parseYouTubeId(value: unknown): string | null {
  if (typeof value !== 'string' || value === '') return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !YOUTUBE_HOSTS.includes(url.hostname.toLowerCase())) return null

  let id: string | null = null
  if (url.hostname.toLowerCase() === 'youtu.be') {
    id = url.pathname.slice(1).split('/')[0] ?? null
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v')
  } else {
    const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)
    id = match?.[1] ?? null
  }
  return id && ID_PATTERN.test(id) ? id : null
}

/** Optional YouTube URL (empty is valid). */
export function checkYouTubeUrl(value: unknown): ValidationResult {
  if (value === undefined || value === null || value === '') return true
  return parseYouTubeId(value)
    ? true
    : 'יש להזין קישור לסרטון ביוטיוב (https://www.youtube.com/… או https://youtu.be/…).'
}

/** Privacy-enhanced embed URL for a video id. */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`
}
