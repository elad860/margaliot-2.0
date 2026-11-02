import { describe, expect, it } from 'vitest'

import { affectsPublic } from '@/cms/hooks/revalidate'
import { childPath, docPath, isSafeSitePath } from '@/lib/cms/paths'
import { previewSecretMatches } from '@/lib/cms/preview-auth'
import { PUBLIC_VIEWER, previewViewer } from '@/lib/cms/queries'

describe('docPath (T12)', () => {
  it('maps system pages through the registry', () => {
    expect(docPath('pages', { systemKey: 'home' })).toBe('/')
    expect(docPath('pages', { systemKey: 'nextTrip' })).toBe('/next-trip')
    expect(docPath('pages', { systemKey: 'nope' })).toBeNull()
  })

  it('maps child items under their tab', () => {
    expect(docPath('trips', { slug: 'x' })).toBe('/uman-trips/x')
    expect(docPath('parashot', { slug: 'vayera' })).toBe('/parasha/vayera')
    expect(docPath('lessons', { slug: 'l' })).toBe('/online-classes/l')
    expect(childPath('trips', 'y')).toBe('/uman-trips/y')
    expect(docPath('trips', { slug: '' })).toBeNull()
    expect(docPath('events', { slug: 'x' })).toBeNull()
    expect(docPath('pages', null)).toBeNull()
  })
})

describe('isSafeSitePath (T12)', () => {
  it.each(['/', '/about', '/parasha/vayera', '/next-trip?x=1'])('accepts %s', (p) => {
    expect(isSafeSitePath(p)).toBe(true)
  })
  it.each([
    '',
    'about',
    '//evil.test',
    '/\\evil.test',
    'https://evil.test',
    '/admin',
    '/admin/x',
    '/api/users',
    null,
  ])('rejects %s', (p) => {
    expect(isSafeSitePath(p)).toBe(false)
  })
})

describe('preview helpers (T12)', () => {
  it('compares the secret only when one is configured', () => {
    expect(previewSecretMatches(undefined, null)).toBe(true)
    expect(previewSecretMatches('s'.repeat(32), null)).toBe(false)
    expect(previewSecretMatches('s'.repeat(32), 'x')).toBe(false)
    expect(previewSecretMatches('s'.repeat(32), 's'.repeat(32))).toBe(true)
  })

  it('creates a preview viewer only for staff', () => {
    expect(previewViewer(null)).toBe(PUBLIC_VIEWER)
    expect(previewViewer({ roles: [] })).toBe(PUBLIC_VIEWER)
    expect(previewViewer({ roles: ['editor'] })).toMatchObject({ draft: true })
  })
})

describe('revalidation trigger (T12)', () => {
  it('ignores draft-only saves and reacts to publish/unpublish', () => {
    expect(affectsPublic({ _status: 'draft' }, { _status: 'draft' })).toBe(false)
    expect(affectsPublic({ _status: 'draft' }, undefined)).toBe(false)
    expect(affectsPublic({ _status: 'published' }, { _status: 'draft' })).toBe(true)
    expect(affectsPublic({ _status: 'draft' }, { _status: 'published' })).toBe(true)
    expect(affectsPublic({}, {})).toBe(true)
  })
})
