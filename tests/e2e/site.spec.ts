/**
 * Phase A smoke, draft-leak and accessibility tests (task T17).
 * Runs serially against a fresh, seeded database: every page starts as a draft.
 */
import { expect, test } from '@playwright/test'

import { SITE_MAP, pathFor, type SystemPageKey } from '../../src/config/site-map'

import {
  adminToken,
  createTrip,
  expectNoAxeViolations,
  expectStatus,
  internalLinks,
  pageId,
  publishTrip,
  saveDraftHeading,
  setPageStatus,
  sitemapUrls,
  updateSiteSettings,
} from './helpers'

test.describe.configure({ mode: 'serial' })

const ALL_PATHS = SITE_MAP.map(pathFor)
const PREVIEW_SECRET = process.env.E2E_PREVIEW_SECRET!

test.describe('1. everything is a draft', () => {
  test('all 15 system routes return 404', async ({ request }) => {
    for (const path of ALL_PATHS) {
      expect((await request.get(path)).status(), path).toBe(404)
    }
  })

  test('reserved, unknown and child routes return 404', async ({ request }) => {
    for (const path of [
      '/next-trip/register',
      '/account',
      '/account/bookings',
      '/no-such-page',
      '/a/b/c',
      '/uman-trips/no-such-trip',
      '/parasha/vayera',
      '/online-classes/x',
    ]) {
      expect((await request.get(path)).status(), path).toBe(404)
    }
    for (const path of ['/api/booking/x', '/api/webhooks/payments/x']) {
      expect((await request.get(path)).status(), path).toBe(404)
    }
  })

  test('the 404 page is Hebrew, RTL, noindex, with no menu and no axe violations', async ({ page }) => {
    const response = await page.goto('/about')
    expect(response?.status()).toBe(404)
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('nav[aria-label="ראשי"]')).toHaveCount(0)
    // Nothing is published, so the page links nowhere (the skip link targets #main).
    expect(await internalLinks(page)).toEqual([])
    await expectNoAxeViolations(page)
    await page.goto('/next-trip/register')
    await expect(page.locator('html')).toHaveAttribute('lang', 'he')
    await expectNoAxeViolations(page)
  })

  test('sitemap is empty and robots disallows everything', async ({ request }) => {
    expect(await sitemapUrls(request)).toEqual([])
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toMatch(/Disallow: \/\s*$/m)
  })

  test('preview without a session is refused, never cached or indexed', async ({ request }) => {
    const res = await request.get(`/api/preview?path=/about&secret=${PREVIEW_SECRET}`, { maxRedirects: 0 })
    expect(res.status()).toBe(401)
    expect(res.headers()['cache-control']).toContain('no-store')
    expect(res.headers()['x-robots-tag']).toContain('noindex')
    expect((await request.get('/api/preview?path=//evil.test', { maxRedirects: 0 })).status()).toBe(400)
  })
})

test.describe('2. some pages published: drafts never leak', () => {
  const published: SystemPageKey[] = ['home', 'womensEvenings', 'terms']
  const publishedPaths = published.map((key) => pathFor(SITE_MAP.find((p) => p.key === key)!))

  test('publishing makes exactly those pages public, without a rebuild', async ({ request }) => {
    for (const key of published) await setPageStatus(request, key, 'published')
    for (const path of publishedPaths) await expectStatus(request, path, 200)
    for (const path of ALL_PATHS.filter((p) => !publishedPaths.includes(p))) {
      expect((await request.get(path)).status(), path).toBe(404)
    }
  })

  test('header, footer and home list only published pages', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav[aria-label="ראשי"]')
    await expect(nav.getByRole('link')).toHaveText(['ערבי נשים'])
    await expect(page.locator('nav[aria-label="מידע משפטי"]').getByRole('link')).toHaveText([
      'תקנון ומדיניות ביטול',
    ])
    // No CTA while /next-trip is a draft.
    await expect(page.getByRole('link', { name: 'למסע הקרוב' })).toHaveCount(0)
    for (const href of await internalLinks(page)) {
      expect(publishedPaths, `link to ${href}`).toContain(href)
    }
  })

  test('sitemap lists only published pages', async ({ request }) => {
    expect((await sitemapUrls(request)).sort()).toEqual([...publishedPaths].sort())
  })

  test('a newer draft of a published page is not shown publicly', async ({ request, page }) => {
    await saveDraftHeading(request, 'womensEvenings', 'טיוטה שאסור שתופיע')
    await page.goto('/womens-evenings')
    await expect(page.getByText('טיוטה שאסור שתופיע')).toHaveCount(0)
  })
})

test.describe('3. editor preview', () => {
  test('an editor sees drafts in preview, marked noindex and not cached', async ({
    browser,
    request,
    baseURL,
  }) => {
    const token = await adminToken(request)
    const context = await browser.newContext()
    await context.addCookies([{ name: 'payload-token', value: token, url: baseURL! }])
    const page = await context.newPage()
    await page.goto(`/api/preview?path=/about&secret=${PREVIEW_SECRET}`)
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.locator('h1')).toHaveText('מי אנחנו')
    const response = await page.reload()
    expect(response?.headers()['cache-control']).toContain('no-store')
    expect(response?.headers()['x-robots-tag']).toContain('noindex')
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/)

    // A draft-mode cookie without a live editor session reveals nothing.
    const draftCookies = (await context.cookies()).filter((c) => c.name !== 'payload-token')
    const stranger = await browser.newContext()
    await stranger.addCookies(draftCookies)
    const strangerPage = await stranger.newPage()
    expect((await strangerPage.goto('/about'))?.status()).toBe(404)
    await stranger.close()

    await page.goto('/api/exit-preview?path=/')
    await context.close()
  })

  test('anonymous visitors still get 404 for the draft', async ({ request }) => {
    expect((await request.get('/about')).status()).toBe(404)
  })
})

test.describe('4. all pages published', () => {
  test('every route returns 200 with one h1 (the fixed page name) and no axe violations', async ({
    request,
    page,
  }) => {
    for (const entry of SITE_MAP) await setPageStatus(request, entry.key, 'published')
    for (const entry of SITE_MAP) {
      const path = pathFor(entry)
      await expectStatus(request, path, 200)
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('lang', 'he')
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      await expect(page.locator('h1'), path).toHaveCount(1)
      await expect(page.locator('h1')).toHaveText(entry.name)
      await expect(page.locator('main#main')).toHaveCount(1)
      await expectNoAxeViolations(page)
    }
  })

  test('the header follows the approved order and shows the CTA', async ({ page }) => {
    await page.goto('/about')
    const nav = page.locator('nav[aria-label="ראשי"] > ul > li')
    await expect(nav).toHaveCount(5)
    const firstText = await nav.evaluateAll((items) =>
      items.map((li) => (li.firstElementChild?.textContent ?? '').trim()),
    )
    expect(firstText).toEqual(['מסעות', 'פעילויות', 'לימוד והתחזקות', 'מי אנחנו', 'יצירת קשר'])
    await expect(page.getByRole('link', { name: 'למסע הקרוב' })).toHaveAttribute('href', '/next-trip')
  })

  test('with empty site settings no contact or social elements render', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('footer address')).toHaveCount(0)
    await expect(page.locator('footer [aria-label="רשתות חברתיות"]')).toHaveCount(0)
    await expect(page.locator('a[href^="tel:"], a[href^="mailto:"], a[href*="wa.me"]')).toHaveCount(0)
  })

  test('/next-trip with no trip selected shows only the neutral placeholder, no registration', async ({
    page,
  }) => {
    await page.goto('/next-trip')
    await expect(page.locator('[data-state="no-trip"]')).toHaveText('[תוכן יתווסף]')
    await expect(page.getByRole('button')).toHaveCount(0)
    await expect(page.getByText(/הרשמה|להרשמה|אזל/)).toHaveCount(0)
  })

  test('sitemap lists all 15 pages', async ({ request }) => {
    expect((await sitemapUrls(request)).sort()).toEqual([...ALL_PATHS].sort())
  })
})

test.describe('5. trips: child route, next trip and canonical', () => {
  test('a draft trip is 404; published it is 200; selected it powers /next-trip', async ({
    request,
    page,
    baseURL,
  }) => {
    const id = await createTrip(request, { title: 'מסע בדיקה', slug: 'e2e-trip' }, false)
    expect((await request.get('/uman-trips/e2e-trip')).status()).toBe(404)
    await page.goto('/uman-trips')
    await expect(page.getByRole('link', { name: 'מסע בדיקה' })).toHaveCount(0)

    await publishTrip(request, id)
    await expectStatus(request, '/uman-trips/e2e-trip', 200)
    await page.goto('/uman-trips/e2e-trip')
    await expect(page.locator('h1')).toHaveText('מסע בדיקה')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${baseURL}/uman-trips/e2e-trip`,
    )
    await expect(page.locator('nav[aria-label="פירורי לחם"] [aria-current="page"]')).toHaveText('מסע בדיקה')
    await expectNoAxeViolations(page)
    expect(await sitemapUrls(request)).toContain('/uman-trips/e2e-trip')

    await updateSiteSettings(request, { nextTrip: id })
    await expect
      .poll(async () => (await (await request.get('/next-trip')).text()).includes('מסע בדיקה'))
      .toBe(true)
    await page.goto('/uman-trips/e2e-trip')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}/next-trip`)
    const urls = await sitemapUrls(request)
    expect(urls).toContain('/next-trip')
    expect(urls).not.toContain('/uman-trips/e2e-trip')
    await page.goto('/next-trip')
    await expectNoAxeViolations(page)
  })
})

test.describe('6. security and admin', () => {
  test('site responses carry the security and noindex headers', async ({ request }) => {
    const headers = (await request.get('/about')).headers()
    for (const name of [
      'content-security-policy-report-only',
      'x-content-type-options',
      'referrer-policy',
      'x-frame-options',
      'permissions-policy',
      'cross-origin-opener-policy',
    ]) {
      expect(headers[name], name).toBeTruthy()
    }
    expect(headers['x-robots-tag']).toContain('noindex')
  })

  test('anonymous form submissions without a Turnstile token are rejected', async ({ request }) => {
    const res = await request.post('/api/form-submissions', { data: { form: 1, submissionData: [] } })
    expect([400, 403]).toContain(res.status())
  })

  test('a tab cannot be renamed through the API, even by an admin', async ({ request }) => {
    const token = await adminToken(request)
    const id = await pageId(request, 'contact')
    const res = await request.patch(`/api/pages/${id}`, {
      headers: { Authorization: `JWT ${token}` },
      data: { title: 'שם אחר', slug: 'other' },
    })
    expect(res.status()).toBe(200)
    const doc = ((await res.json()) as { doc: { title: string; slug: string } }).doc
    expect(doc).toMatchObject({ title: 'יצירת קשר', slug: 'contact' })
  })

  test('the admin page editor renders the blocks field', async ({ browser, request, baseURL }) => {
    const token = await adminToken(request)
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await context.addCookies([{ name: 'payload-token', value: token, url: baseURL! }])
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/admin/collections/pages/${await pageId(request, 'about')}`)
    await expect(page.getByText('תוכן העמוד').first()).toBeVisible({ timeout: 30_000 })
    expect(errors).toEqual([])
    await context.close()
  })
})
