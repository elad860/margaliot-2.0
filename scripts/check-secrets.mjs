#!/usr/bin/env node
/**
 * Minimal secret scan over git-tracked (and staged) files. No dependencies.
 * Fails if an env file is tracked or if a file contains something that looks
 * like a credential. Run: pnpm check:secrets
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .filter((f) => existsSync(f))

const problems = []

const forbiddenFile = /(^|\/)\.env(\.(?!example$)[^/]+)?$|\.(pem|key|p12|pfx)$|(^|\/)id_(rsa|ed25519)$/
const patterns = [
  { name: 'private key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'filled PAYLOAD_SECRET', re: /^\s*PAYLOAD_SECRET\s*=\s*\S{8,}/m },
  { name: 'filled PREVIEW_SECRET', re: /^\s*PREVIEW_SECRET\s*=\s*\S{8,}/m },
  {
    name: 'Postgres URL with password',
    re: /postgres(ql)?:\/\/[^\s:@/]+:(?!postgres@)[^\s@/]+@(?!127\.0\.0\.1|localhost)/,
  },
  { name: 'Vercel Blob token', re: /vercel_blob_rw_[A-Za-z0-9]{10,}/ },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{30,}/ },
  { name: 'Stripe/Resend-style live key', re: /\b(sk_live|re)_[A-Za-z0-9]{20,}/ },
]

for (const file of files) {
  if (forbiddenFile.test(file)) {
    problems.push(`${file}: secret-bearing file must not be in the repository`)
    continue
  }
  if (file === 'pnpm-lock.yaml' || file.startsWith('scripts/check-secrets')) continue
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  if (text.includes('\u0000')) continue // binary
  for (const { name, re } of patterns) {
    if (re.test(text)) problems.push(`${file}: looks like a ${name}`)
  }
}

if (problems.length) {
  console.error('Secret scan failed:\n' + problems.map((p) => `  - ${p}`).join('\n'))
  process.exit(1)
}
console.log(`Secret scan passed (${files.length} files).`)
