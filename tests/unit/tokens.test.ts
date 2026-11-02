import { readFileSync } from 'node:fs'
import path from 'node:path'

import tailwind from '@tailwindcss/postcss'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../..')
const stylesDir = path.join(root, 'src/styles')
const themeCss = readFileSync(path.join(stylesDir, 'theme.css'), 'utf8')
const tokensCss = readFileSync(path.join(stylesDir, 'tokens.css'), 'utf8')
const probe = readFileSync(path.join(root, 'tests/fixtures/TokenProbe.tsx'), 'utf8')

const probeClasses = [...probe.matchAll(/className="([^"]+)"/g)].flatMap((m) => (m[1] ?? '').split(/\s+/))

/** Compile theme.css (with an optional replacement tokens.css) for the probe's classes only. */
async function compile(tokens: string = tokensCss): Promise<string> {
  const input = themeCss
    .replace(
      "@import 'tailwindcss' source('..');",
      `@import 'tailwindcss' source(none);\n@source inline("${probeClasses.join(' ')}");`,
    )
    .replace("@import './tokens.css';", tokens)
  const result = await postcss([tailwind({ base: root })]).process(input, {
    from: path.join(stylesDir, 'theme.css'),
  })
  return result.css
}

/** The `@layer utilities { … }` block only (brace-matched). */
function utilityRules(css: string): string {
  const start = css.indexOf('@layer utilities {')
  expect(start).toBeGreaterThan(-1)
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1)
  }
  throw new Error('unterminated utilities layer')
}

describe('design-token layer (T05)', () => {
  it('generates every class the probe uses', async () => {
    const utilities = utilityRules(await compile())
    for (const cls of probeClasses) {
      const selector = '.' + cls.replace(/:/g, '\\:')
      expect(utilities, `missing utility ${cls}`).toContain(selector)
    }
  })

  it('utilities contain no literal colours or sizes — only token references', async () => {
    const utilities = utilityRules(await compile())
    const declarations = [...utilities.matchAll(/^\s*([a-z-]+):\s*([^;]+);/gm)].map(
      (m) => [m[1] ?? '', m[2] ?? ''] as const,
    )
    for (const [prop, value] of declarations) {
      expect(value, `${prop}: ${value}`).not.toMatch(/#[0-9a-f]{3,8}\b|\b(rgb|hsl|oklch)a?\(/i)
      // 1px is the only allowed literal (hairline borders), as in scripts/check-tokens.mjs.
      expect(value.replace(/(?<![\d.])1px\b/g, ''), `${prop}: ${value}`).not.toMatch(/\d(px|rem)\b/)
    }
  })

  it('every --mg-* token referenced anywhere is defined in tokens.css', async () => {
    const css = await compile()
    const referenced = new Set([...css.matchAll(/var\((--mg-[a-z0-9-]+)/g)].map((m) => m[1]))
    const defined = new Set([...tokensCss.matchAll(/(--mg-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
    for (const name of referenced) expect(defined, `${name} is not defined`).toContain(name)
  })

  it('changing only tokens.css changes the resolved values but not a single utility rule', async () => {
    const before = await compile()
    const changed = tokensCss.replace('--mg-palette-navy-900: #13284a;', '--mg-palette-navy-900: #6a1b4d;')
    expect(changed).not.toBe(tokensCss)
    const after = await compile(changed)

    expect(utilityRules(after)).toBe(utilityRules(before))
    expect(before).toContain('--mg-palette-navy-900: #13284a')
    expect(after).toContain('--mg-palette-navy-900: #6a1b4d')
  })

  it('does not emit self-referencing Tailwind variables', async () => {
    const css = await compile()
    for (const m of css.matchAll(/(--[a-z0-9-]+):\s*var\((--[a-z0-9-]+)\)/g)) expect(m[1]).not.toBe(m[2])
  })

  it('removes Tailwind default palette (no arbitrary brand-less colours)', async () => {
    const css = await compile()
    expect(css).not.toMatch(/--color-red-500/)
    expect(css).not.toMatch(/--text-5xl/)
  })

  it('character layer overrides only semantic tokens', () => {
    const characterBlocks = tokensCss.split('─── LAYER 3')[1] ?? ''
    const overridden = [...characterBlocks.matchAll(/(--mg-[a-z0-9-]+)\s*:/g)].map((m) => m[1] ?? '')
    expect(overridden.length).toBeGreaterThan(0)
    for (const name of overridden) expect(name).toMatch(/^--mg-color-/)
  })
})
