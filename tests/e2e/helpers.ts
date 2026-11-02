import AxeBuilder from '@axe-core/playwright'
import { expect, type APIRequestContext, type Page } from '@playwright/test'

import type { SystemPageKey } from '../../src/config/site-map'

/** WCAG 2.x A/AA rule sets (IS 5568 targets WCAG AA). */
export const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
  const summary = results.violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
  )
  expect(summary, `axe violations on ${page.url()}`).toEqual([])
}

/** Throwaway admin for this test run (fresh database). Never a fixed credential. */
const admin = {
  email: `e2e-admin-${Date.now()}@example.test`,
  password: `e2e-${crypto.randomUUID()}`,
  token: '' as string,
}

export async function adminToken(request: APIRequestContext): Promise<string> {
  if (admin.token) return admin.token
  const register = await request.post('/api/users/first-register', {
    data: { email: admin.email, password: admin.password },
  })
  expect([200, 201], await register.text()).toContain(register.status())
  const login = await request.post('/api/users/login', {
    data: { email: admin.email, password: admin.password },
  })
  expect(login.status(), await login.text()).toBe(200)
  admin.token = ((await login.json()) as { token: string }).token
  return admin.token
}

function auth(token: string) {
  return { Authorization: `JWT ${token}` }
}

export async function pageId(request: APIRequestContext, key: SystemPageKey): Promise<number> {
  const token = await adminToken(request)
  const res = await request.get(`/api/pages?where[systemKey][equals]=${key}&draft=true&depth=0`, {
    headers: auth(token),
  })
  expect(res.status()).toBe(200)
  const { docs } = (await res.json()) as { docs: { id: number }[] }
  expect(docs, `page ${key}`).toHaveLength(1)
  return docs[0]!.id
}

export async function setPageStatus(
  request: APIRequestContext,
  key: SystemPageKey,
  status: 'published' | 'draft',
) {
  const token = await adminToken(request)
  const id = await pageId(request, key)
  const res = await request.patch(`/api/pages/${id}${status === 'draft' ? '?draft=true' : ''}`, {
    headers: auth(token),
    data: { _status: status },
  })
  expect(res.status(), await res.text()).toBe(200)
}

export async function saveDraftHeading(request: APIRequestContext, key: SystemPageKey, heading: string) {
  const token = await adminToken(request)
  const id = await pageId(request, key)
  const res = await request.patch(`/api/pages/${id}?draft=true`, {
    headers: auth(token),
    data: { hero: { heading } },
  })
  expect(res.status(), await res.text()).toBe(200)
}

export async function createTrip(
  request: APIRequestContext,
  data: Record<string, unknown>,
  publish: boolean,
) {
  const token = await adminToken(request)
  const res = await request.post(`/api/trips${publish ? '' : '?draft=true'}`, {
    headers: auth(token),
    data: { ...data, _status: publish ? 'published' : 'draft' },
  })
  expect(res.status(), await res.text()).toBe(201)
  return ((await res.json()) as { doc: { id: number } }).doc.id
}

export async function publishTrip(request: APIRequestContext, id: number) {
  const token = await adminToken(request)
  const res = await request.patch(`/api/trips/${id}`, {
    headers: auth(token),
    data: { _status: 'published' },
  })
  expect(res.status(), await res.text()).toBe(200)
}

export async function updateSiteSettings(request: APIRequestContext, data: Record<string, unknown>) {
  const token = await adminToken(request)
  const res = await request.post('/api/globals/site-settings', { headers: auth(token), data })
  expect(res.status(), await res.text()).toBe(200)
}

/** Waits until a path returns the expected status (on-demand revalidation). */
export async function expectStatus(request: APIRequestContext, path: string, status: number) {
  await expect
    .poll(async () => (await request.get(path, { maxRedirects: 0 })).status(), { message: path })
    .toBe(status)
}

/** Internal link targets on the current page (pathnames), excluding the skip link. */
export async function internalLinks(page: Page): Promise<string[]> {
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))
  return hrefs.filter((href) => href.startsWith('/')).map((href) => href.split(/[?#]/)[0] ?? href)
}

export async function sitemapUrls(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname)
}
