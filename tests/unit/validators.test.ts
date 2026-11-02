import { describe, expect, it } from 'vitest'

import { checkHttpsUrl, checkLinkHref, checkPhone, checkSlug, checkUrlOnHosts } from '@/lib/validators'
import { checkYouTubeUrl, parseYouTubeId, youTubeEmbedUrl } from '@/lib/youtube'

describe('checkSlug (T09)', () => {
  it.each(['vayera', 'trip-2027', 'a', 'lech-lecha', '123'])('accepts %s', (slug) => {
    expect(checkSlug(slug)).toBe(true)
  })

  it.each([
    ['register', 'reserved'],
    ['account', 'reserved'],
    ['admin', 'reserved'],
    ['api', 'reserved'],
    ['about', 'registry slug'],
    ['next-trip', 'registry slug'],
    ['וירא', 'Hebrew'],
    ['Vayera', 'uppercase'],
    ['va yera', 'space'],
    ['-vayera', 'leading hyphen'],
    ['vayera-', 'trailing hyphen'],
    ['va--yera', 'double hyphen'],
    ['va_yera', 'underscore'],
    ['', 'empty'],
  ])('rejects %s (%s)', (slug) => {
    expect(checkSlug(slug)).toEqual(expect.any(String))
  })

  it('rejects very long slugs', () => {
    expect(checkSlug('a'.repeat(81))).toEqual(expect.any(String))
  })
})

describe('URL validators', () => {
  it('checkHttpsUrl accepts empty and https only', () => {
    expect(checkHttpsUrl('')).toBe(true)
    expect(checkHttpsUrl(undefined)).toBe(true)
    expect(checkHttpsUrl('https://example.test/x')).toBe(true)
    for (const bad of [
      '#',
      'http://example.test',
      'javascript:alert(1)',
      '/about',
      'https://localhost',
      'example.test',
    ]) {
      expect(checkHttpsUrl(bad)).toEqual(expect.any(String))
    }
  })

  it('checkLinkHref accepts site paths and https URLs', () => {
    expect(checkLinkHref('/contact')).toBe(true)
    expect(checkLinkHref('https://example.test')).toBe(true)
    for (const bad of ['//evil.test', 'http://example.test', 'javascript:alert(1)', 'contact']) {
      expect(checkLinkHref(bad)).toEqual(expect.any(String))
    }
  })

  it('checkUrlOnHosts restricts the host', () => {
    expect(checkUrlOnHosts('https://www.instagram.com/x', ['instagram.com'], 'אינסטגרם')).toBe(true)
    expect(checkUrlOnHosts('https://instagram.com/x', ['instagram.com'], 'אינסטגרם')).toBe(true)
    expect(checkUrlOnHosts('https://evilinstagram.com/x', ['instagram.com'], 'אינסטגרם')).toEqual(
      expect.any(String),
    )
    expect(checkUrlOnHosts('https://example.test', ['instagram.com'], 'אינסטגרם')).toEqual(expect.any(String))
  })

  it('checkPhone accepts international numbers only', () => {
    expect(checkPhone('')).toBe(true)
    expect(checkPhone('+1 555 010 0000')).toBe(true)
    expect(checkPhone('123')).toEqual(expect.any(String))
    expect(checkPhone('phone')).toEqual(expect.any(String))
  })
})

describe('YouTube (T09/T11)', () => {
  const id = 'abcdefghijk'
  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=10`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ])('parses %s', (url) => {
    expect(parseYouTubeId(url)).toBe(id)
    expect(checkYouTubeUrl(url)).toBe(true)
  })

  it.each([
    'https://vimeo.com/123456',
    `http://www.youtube.com/watch?v=${id}`,
    'https://www.youtube.com/watch?v=short',
    `https://youtube.com.evil.test/watch?v=${id}`,
    'not a url',
  ])('rejects %s', (url) => {
    expect(parseYouTubeId(url)).toBeNull()
    expect(checkYouTubeUrl(url)).toEqual(expect.any(String))
  })

  it('builds privacy-enhanced embed URLs', () => {
    expect(youTubeEmbedUrl(id)).toBe(`https://www.youtube-nocookie.com/embed/${id}`)
  })
})
