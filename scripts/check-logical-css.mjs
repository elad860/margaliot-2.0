#!/usr/bin/env node
/**
 * Fails when source files use physical (left/right) CSS instead of logical
 * properties (CLAUDE.md rule 9, task T04). No dependencies.
 *
 * Checks:
 *  - CSS: margin-/padding-/border-(left|right), left:/right:, physical corner
 *    radii, text-align/float/clear: left|right.
 *  - TS/TSX: Tailwind physical utilities (ml-, mr-, pl-, pr-, left-, right-,
 *    border-l, rounded-l, text-left, float-right …) and physical React style
 *    keys (marginLeft, paddingRight, left: …).
 *
 * Escape hatch for a justified exception: put `logical-css-ignore` in a comment
 * on the same line, and explain why.
 *
 * Usage: node scripts/check-logical-css.mjs [paths…]   (default: src)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const IGNORE_DIRS = new Set(['node_modules', '.next', 'migrations', '(payload)'])
const IGNORE_FILES = new Set(['payload-types.ts'])
const CSS_EXT = new Set(['.css', '.scss'])
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

const CSS_RULES = [
  [
    /(^|[\s;{])(margin|padding|border|scroll-margin|scroll-padding)-(left|right)(-[a-z]+)?\s*:/,
    'use *-inline-start / *-inline-end',
  ],
  [/(^|[\s;{])(left|right)\s*:/, 'use inset-inline-start / inset-inline-end'],
  [/(^|[\s;{])border-(top|bottom)-(left|right)-radius\s*:/, 'use border-start-start-radius etc.'],
  [/(^|[\s;{])(text-align|float|clear)\s*:\s*(left|right)\b/, 'use start / end (inline-start / inline-end)'],
]

const TW_PHYSICAL =
  /(?<![\w-])-?(m[lr]|p[lr]|scroll-m[lr]|scroll-p[lr]|left|right|border-[lr]|rounded-[lr]|rounded-[tb][lr]|space-x-reverse)-[\w[\].\/%-]+|(?<![\w-])(text-(left|right)|float-(left|right)|clear-(left|right)|border-[lr]|rounded-[lr])(?![\w-])/
const STYLE_KEYS =
  /\b(margin|padding|border|scrollMargin|scrollPadding)(Left|Right)\b\s*:|(?<![\w-])(left|right)\s*:\s*['"`\d{]|textAlign\s*:\s*['"](left|right)['"]/

/** Pure check, exported for unit tests. Returns [{ line, text, hint }]. */
export function findPhysicalProperties(source, filename) {
  const ext = extname(filename)
  const findings = []
  const lines = source.split('\n')
  lines.forEach((raw, index) => {
    if (raw.includes('logical-css-ignore')) return
    const line = raw.replace(/\/\*.*?\*\//g, '')
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return
    if (CSS_EXT.has(ext)) {
      for (const [re, hint] of CSS_RULES) {
        if (re.test(line)) findings.push({ line: index + 1, text: trimmed, hint })
      }
    } else if (CODE_EXT.has(ext)) {
      // Only look inside string literals for Tailwind classes, to avoid matching identifiers.
      const strings = line.match(/(["'`])(?:\\.|(?!\1).)*\1/g) ?? []
      if (strings.some((s) => TW_PHYSICAL.test(s))) {
        findings.push({
          line: index + 1,
          text: trimmed,
          hint: 'use ms-/me-/ps-/pe-/start-/end-/text-start/text-end',
        })
      }
      if (STYLE_KEYS.test(line)) {
        findings.push({
          line: index + 1,
          text: trimmed,
          hint: 'use marginInlineStart, insetInlineEnd, textAlign: "start" …',
        })
      }
    }
  })
  return findings
}

function walk(path, out) {
  const stat = statSync(path)
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (!IGNORE_DIRS.has(entry)) walk(join(path, entry), out)
    }
  } else if (
    (CSS_EXT.has(extname(path)) || CODE_EXT.has(extname(path))) &&
    !IGNORE_FILES.has(path.split('/').pop())
  ) {
    out.push(path)
  }
  return out
}

function main() {
  const roots = process.argv.slice(2).length ? process.argv.slice(2) : ['src']
  const files = roots.flatMap((root) => walk(root, []))
  let count = 0
  for (const file of files) {
    for (const f of findPhysicalProperties(readFileSync(file, 'utf8'), file)) {
      count++
      console.error(
        `${relative(process.cwd(), file)}:${f.line}  ${f.text}\n    → physical property; ${f.hint}`,
      )
    }
  }
  if (count) {
    console.error(`\nLogical-CSS check failed: ${count} physical left/right usage(s). See CLAUDE.md rule 9.`)
    process.exit(1)
  }
  console.log(`Logical-CSS check passed (${files.length} files).`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
