#!/usr/bin/env node
/**
 * Fails when source files contain colour literals or hard-coded sizes instead of
 * design tokens (task T05; build-plan definition of done). No dependencies.
 *
 * Allowed: src/styles/tokens.css (the primitive layer is the only home for raw
 * values) and the breakpoint block in src/styles/theme.css.
 * Flagged elsewhere:
 *   - colour literals: #rgb/#rrggbb(aa), rgb()/rgba()/hsl()/hsla()/oklch()/oklab()/lab()/lch()
 *   - CSS named colours on colour properties (color: white …)
 *   - CSS px/rem/em lengths (except 0 and the 1px hairline)
 *   - Tailwind arbitrary values with literals: bg-[#…], p-[13px], text-[1.1rem] …
 *
 * Escape hatch: `tokens-ignore` in a comment on the same line, with a reason.
 * Usage: node scripts/check-tokens.mjs [paths…]   (default: src)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const IGNORE_DIRS = new Set(['node_modules', '.next', 'migrations', '(payload)'])
const ALLOWED_FILES = new Set(['tokens.css', 'payload-types.ts'])
const CSS_EXT = new Set(['.css', '.scss'])
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

const COLOR_FN = /\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/
const HEX = /#[0-9a-fA-F]{3,4}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b/
const NAMED_COLOR =
  /(^|[\s;{])(color|background(-color)?|border(-[a-z-]+)?-color|outline-color|fill|stroke|caret-color|accent-color)\s*:\s*(white|black|red|blue|green|gray|grey|gold|navy|teal|yellow|orange|purple|pink|silver)\b/
const CSS_LENGTH = /(?<![\w.-])(?!1px\b)(\d*\.?\d+)(px|rem|em)\b/
const TW_ARBITRARY = /-\[(#[0-9a-fA-F]+|(rgb|hsl|oklch)a?\(|\d*\.?\d+(px|rem|em)\b)/

/** Pure check, exported for unit tests. Returns [{ line, text, hint }]. */
export function findTokenViolations(source, filename) {
  const base = filename.split('/').pop()
  if (ALLOWED_FILES.has(base)) return []
  const ext = extname(filename)
  const findings = []
  let inBreakpointTheme = false
  source.split('\n').forEach((raw, index) => {
    if (raw.includes('tokens-ignore')) return
    const line = raw.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, ext === '.css' ? '' : '$&')
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('*') || trimmed.startsWith('/*') || trimmed.startsWith('//')) return
    const push = (hint) => findings.push({ line: index + 1, text: raw.trim(), hint })

    if (CSS_EXT.has(ext)) {
      // theme.css: breakpoints must be literal (media queries cannot read variables)
      if (/--breakpoint-\*:\s*initial/.test(line)) inBreakpointTheme = true
      if (inBreakpointTheme) {
        if (trimmed.startsWith('}')) inBreakpointTheme = false
        return
      }
      if (COLOR_FN.test(line) || HEX.test(line) || NAMED_COLOR.test(line))
        push('colour literal; use a --mg-color-* token')
      else if (!/^\s*@media/.test(line) && CSS_LENGTH.test(line.replace(/0\.01ms|\d+ms/g, '')))
        push('hard-coded size; use a --mg-* token')
    } else if (CODE_EXT.has(ext)) {
      const strings = line.match(/(["'`])(?:\\.|(?!\1).)*\1/g) ?? []
      for (const s of strings) {
        if (TW_ARBITRARY.test(s)) push('Tailwind arbitrary literal; use a semantic utility')
        else if (COLOR_FN.test(s) || /^["'`]#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?["'`]$/.test(s))
          push('colour literal; use a semantic utility or var(--mg-color-*)')
      }
    }
  })
  return findings
}

function walk(path, out) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) if (!IGNORE_DIRS.has(entry)) walk(join(path, entry), out)
  } else if (CSS_EXT.has(extname(path)) || CODE_EXT.has(extname(path))) out.push(path)
  return out
}

function main() {
  const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src']
  const files = roots.flatMap((root) => walk(root, []))
  let count = 0
  for (const file of files) {
    for (const f of findTokenViolations(readFileSync(file, 'utf8'), file)) {
      count++
      console.error(`${relative(process.cwd(), file)}:${f.line}  ${f.text}\n    → ${f.hint}`)
    }
  }
  if (count) {
    console.error(`\nToken check failed: ${count} literal value(s) outside tokens.css.`)
    process.exit(1)
  }
  console.log(`Token check passed (${files.length} files).`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
