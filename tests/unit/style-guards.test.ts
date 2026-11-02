import { describe, expect, it } from 'vitest'

import { findPhysicalProperties } from '../../scripts/check-logical-css.mjs'
import { findTokenViolations } from '../../scripts/check-tokens.mjs'

describe('logical-CSS check (T04)', () => {
  it.each([
    ['a.css', '.a { margin-left: 4px; }'],
    ['a.css', '.a { padding-right: var(--mg-space-4); }'],
    ['a.css', '.a { left: 0; }'],
    ['a.css', '.a { text-align: right; }'],
    ['a.css', '.a { border-top-left-radius: 2px; }'],
    ['a.tsx', '<div className="ml-4" />'],
    ['a.tsx', '<div className="pr-2 flex" />'],
    ['a.tsx', '<div className="absolute right-0" />'],
    ['a.tsx', '<div className="text-left" />'],
    ['a.tsx', '<div style={{ marginLeft: 4 }} />'],
  ])('flags physical property in %s: %s', (file, source) => {
    expect(findPhysicalProperties(source, file)).not.toHaveLength(0)
  })

  it.each([
    ['a.css', '.a { margin-inline-start: 4px; inset-inline-end: 0; text-align: start; }'],
    ['a.tsx', '<div className="ms-4 pe-2 start-0 text-start" />'],
    ['a.tsx', 'const left = 1 // a variable named left is fine'],
    ['a.css', '.a { margin-left: 0; } /* logical-css-ignore: third-party override */'],
  ])('accepts logical usage in %s: %s', (file, source) => {
    expect(findPhysicalProperties(source, file)).toHaveLength(0)
  })
})

describe('token check (T05)', () => {
  it.each([
    ['a.css', '.a { color: #13284a; }'],
    ['a.css', '.a { background: rgb(0 0 0); }'],
    ['a.css', '.a { color: white; }'],
    ['a.css', '.a { padding-block: 12px; }'],
    ['a.tsx', '<div className="bg-[#13284a]" />'],
    ['a.tsx', '<div className="p-[13px]" />'],
    ['a.tsx', '<div style={{ color: "#fff" }} />'],
  ])('flags literal in %s: %s', (file, source) => {
    expect(findTokenViolations(source, file)).not.toHaveLength(0)
  })

  it.each([
    ['a.css', '.a { color: var(--mg-color-text); padding: var(--mg-space-4); inline-size: 1px; }'],
    ['a.tsx', '<a href="#main" className="bg-surface text-accent p-4" />'],
    ['tokens.css', ':root { --mg-palette-navy-900: #13284a; }'],
  ])('accepts token usage in %s: %s', (file, source) => {
    expect(findTokenViolations(source, file)).toHaveLength(0)
  })
})
