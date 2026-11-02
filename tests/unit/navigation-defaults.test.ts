import { describe, expect, it } from 'vitest'

import {
  DEFAULT_HEADER_CTA_LABEL,
  DEFAULT_HEADER_ITEMS,
  DIRECT_LINK_PAGES,
  checkHeaderItems,
} from '@/config/navigation-defaults'

describe('navigation defaults (T10)', () => {
  it('encodes the header order: 3 groups, then מי אנחנו and יצירת קשר', () => {
    expect(DEFAULT_HEADER_ITEMS).toEqual([
      { type: 'group', group: 'trips' },
      { type: 'group', group: 'activities' },
      { type: 'group', group: 'learning' },
      { type: 'page', page: 'about' },
      { type: 'page', page: 'contact' },
    ])
    expect(DIRECT_LINK_PAGES).toEqual(['about', 'contact'])
    expect(DEFAULT_HEADER_CTA_LABEL).toBe('למסע הקרוב')
  })

  it('accepts any order of the same five items', () => {
    expect(checkHeaderItems([...DEFAULT_HEADER_ITEMS].reverse())).toBe(true)
  })

  it('rejects missing, duplicated or unknown items', () => {
    expect(checkHeaderItems(DEFAULT_HEADER_ITEMS.slice(1))).toEqual(expect.any(String))
    expect(checkHeaderItems([...DEFAULT_HEADER_ITEMS.slice(1), DEFAULT_HEADER_ITEMS[1]])).toEqual(
      expect.any(String),
    )
    expect(checkHeaderItems([...DEFAULT_HEADER_ITEMS.slice(1), { type: 'page', page: 'parasha' }])).toEqual(
      expect.any(String),
    )
    expect(checkHeaderItems(null)).toEqual(expect.any(String))
  })
})
