# Margaliot 2.0 — Architecture Proposal (Phase A skeleton)

- **Status:** proposed, awaiting owner approval. Nothing here is binding.
- **Author:** system-architect, 2026-11-02
- **Based on:** `CLAUDE.md`, `docs/spec/OPEN-DECISIONS.md`, `docs/design/directions/README.md`, and the **unapproved** draft `docs/spec/SPEC-DRAFT-V1.1.md`. Every decision in the draft is treated as unapproved. Where the draft marks something [מאושר] that CLAUDE.md lists as not approved (refund policy, passport collection, automatic invoices, no participant limit / sold-out switch, same-room placement), this proposal treats it as **open**.
- **ADRs:** [0001 stack & CMS](adr/0001-stack-and-cms.md) · [0002 hosting & environments](adr/0002-hosting-and-environments.md) · [0003 routing & URL slugs](adr/0003-routing-and-url-slugs.md) · [0004 content model & draft/publish](adr/0004-content-model-and-draft-publish.md) · [0005 booking extension points](adr/0005-booking-extension-points.md)
- **Build plan:** [SKELETON-BUILD-PLAN.md](SKELETON-BUILD-PLAN.md) · **Owner decisions:** [DECISIONS-NEEDED.md](DECISIONS-NEEDED.md)

Everything below is labelled **Recommendation** unless it restates a rule from CLAUDE.md (fixed tab names, RTL, IS 5568, drafts never public, no production deploy without approval).

---

## 1. Summary

**Recommendation:** one TypeScript codebase: **Next.js 16 (App Router) + Payload CMS 3 + PostgreSQL**, styled with **Tailwind CSS 4** driven by a CSS-variable token layer. Host the preview on **Vercel** with a managed Postgres (**Neon**, Frankfurt region) and media in **Vercel Blob**. English URL slugs. Tab names, order and URLs come from a small registry in code, so editors cannot rename them by accident. Everything else (content, publish status, menu group labels, contact details, social links) is edited in the CMS. Pages are drafts by default. The public site and the menu only read published content.

Why this and not something simpler: it is the only option here where the content site, the admin with roles, and the database the future booking system needs all live in one codebase with one login system. Building booking later means adding collections and a `features/booking` module, not moving platforms. The cost is that it needs a developer for monthly updates. That burden is real, and it is set out in §3 and in decision D3.

---

## 2. Scope recap (from CLAUDE.md)

- 15 public routes: home, the 11 fixed tabs, and 3 legal pages (terms + cancellation, privacy, accessibility statement).
- Shared Header/Footer, desktop and mobile navigation, floating WhatsApp, sticky mobile CTA, breadcrumbs, reusable blocks, 4 page templates, CMS foundations.
- **Not built:** page content, booking, payments, invoices, room assignment, user accounts, courses platform, admin UI beyond the CMS's own admin, production deploy, any change to the old site or live domain.

The 11 tabs, exactly as fixed in CLAUDE.md: 1 מי אנחנו · 2 פגישת ייעוץ · 3 המסע הקרוב · 4 מסעות לאומן · 5 קברי צדיקים בארץ · 6 ערבי נשים · 7 תקשור בציבור · 8 קורס הארת הכלים · 9 פרשת השבוע · 10 שיעורי התחזקות אונליין · 11 יצירת קשר.

---

## 3. Stack and CMS (→ ADR-0001)

### 3.1 Recommended stack (versions verified on npm, 2026-11-02)

| Concern | Choice | Version (pin at setup) | Why |
| --- | --- | --- | --- |
| Runtime | Node.js LTS | 24.x (≥ 24.22.1, Payload's engine floor) | Current LTS; Payload 3.92 requires `^22.23.4 \|\| >=24.22.1` |
| Package manager | pnpm | 10.x | Fast and strict. Payload templates use it |
| Framework | `next` | 16.4.x (apply the security release scheduled for 2026-11-03) | App Router, server components, static generation + on-demand revalidation, `draftMode()` |
| UI library | `react`, `react-dom` | 19.3.x | Required by Next 16.4 |
| CMS | `payload`, `@payloadcms/next`, `@payloadcms/ui` | 3.92.x (all `@payloadcms/*` on the **same** version) | Runs inside the Next app at `/admin`; collections, globals, blocks, drafts/versions, roles, live preview |
| DB adapter | `@payloadcms/db-postgres` | 3.92.x | Relational base for the future booking data |
| Database | PostgreSQL (managed) | 17 | Neon or equivalent; see ADR-0002 |
| Rich text | `@payloadcms/richtext-lexical` | 3.92.x | Payload's default editor |
| CMS plugins | `@payloadcms/plugin-seo`, `@payloadcms/plugin-form-builder` | 3.92.x | Per-page SEO fields; contact/lead forms with stored submissions |
| Media storage | `@payloadcms/storage-vercel-blob` | 3.92.x | Uploads off the server disk (alternative: `@payloadcms/storage-s3` + Cloudflare R2) |
| Email (later) | `@payloadcms/email-resend` | 3.92.x | Form notifications, enabled only after decision D8 |
| Live preview | `@payloadcms/live-preview-react` | 3.92.x | Editors see drafts in the real page layout |
| Styling | `tailwindcss` + `@tailwindcss/postcss` | 4.3.x | `@theme` maps CSS-variable tokens to utilities; built-in logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) |
| Language | TypeScript | 5.x, `strict: true` | Payload generates types from the schema (`payload generate:types`) |
| Lint/format | ESLint 9 (flat config, `eslint-config-next`), Prettier 3 | — | Standard |
| Unit tests | Vitest | 3.x | Registry, navigation and SEO helpers |
| E2E / a11y | `@playwright/test` + `@axe-core/playwright` | latest at setup | Route smoke tests, draft-leak tests, axe on every route |
| Performance | `@lhci/cli` (Lighthouse CI) | latest at setup | Mobile budgets per template |
| Hebrew dates | Built-in `Intl.DateTimeFormat('he-IL-u-ca-hebrew')` | — | No dependency. `@hebcal/core` (GPL-2.0) only if Shabbat times are approved later; check its licence first |
| Fonts | `next/font/google` (self-hosted at build) | — | All fonts in the three directions (Frank Ruhl Libre, Assistant, Bellefair, Heebo, Rubik) are on Google Fonts with Hebrew subsets |
| Spam protection | Cloudflare Turnstile + honeypot field | — | Free; added with the Form block |

No other runtime dependency without a written reason (CLAUDE.md rule 6).

### 3.2 Alternatives, judged honestly

| | **A. Next.js + Payload + Postgres (recommended)** | **B. Next.js + Sanity** | **C. WordPress (custom theme, or headless)** |
| --- | --- | --- | --- |
| Fit for the content site | Very good | Very good | Good |
| Editing experience for a non-technical owner | Good. Admin can be Hebrew/RTL (Payload ships Hebrew translations; confirm in task T07). Plainer than Sanity | Best of the three. Polished, real-time | Familiar, Hebrew, many tutorials |
| Path to booking, payments, roles | Strongest. Same DB, same users and roles, same codebase | Weaker. Booking needs its own DB and auth next to Sanity: two systems | Weakest for this booking model (several participants, passports, rooms). Means custom plugins or a booking plugin that does not fit |
| Design freedom (premium, not templated) | Full | Full | Possible with a custom theme, but the plugin and theme ecosystem pulls towards templates |
| Hosting | Needs Node hosting + Postgres + media storage | Content hosted by Sanity. Site on Vercel, no DB until booking | Managed WP host, or a VPS |
| Approx. monthly cost (verify at signup) | ~$25–45: Vercel Pro $20 + Neon small plan + Blob usage | ~$20–35 now: Vercel Pro + Sanity free/paid seats. Rises when booking adds a DB | ~$10–40 host + paid plugins |
| Maintenance for a small team | Medium. Monthly Next.js security releases and Payload updates need a developer (~2–4 h/month) | Medium-low. Sanity is managed; Next updates still needed | Medium-high. Constant plugin/core updates, and security depends on plugins |
| Lock-in | Low (open source, MIT, own DB) | Medium (content lives in Sanity's cloud) | Low |

**Rejected outright:** Wix / Webflow. They are the fastest to build, but too limited for the future booking model and lock the site to the platform. The draft spec reaches the same conclusion.

**Honest risks of A:** Payload is younger than WordPress, and fewer Israeli freelancers know it. The admin is plainer than Sanity's. There is no first-party two-factor login (see §10 and D13). Someone with Next.js skills must own updates. If the owner has no developer after launch (D3), B becomes more attractive for Phase A, at the price of a second system when booking arrives.

---

## 4. Hosting and environments (→ ADR-0002)

**Recommendation:**

| Environment | Where | URL | Data | Indexing | Who can reach it |
| --- | --- | --- | --- | --- | --- |
| **Local dev** | Developer machine | `localhost:3000` | Postgres 17 in Docker (`docker-compose.yml`) or a Neon dev branch | n/a | Developer |
| **Preview / staging** | Vercel project `margaliot-2-0`, preview deployments per branch/PR | `*.vercel.app` only (no custom domain) | Neon `staging` branch, separate Blob store | `noindex` everywhere: `X-Robots-Tag: noindex, nofollow` header + `robots.txt` disallow all | Vercel Deployment Protection (Vercel Authentication) for the owner and team |
| **Production** | Same Vercel project, production target | Live domain, attached **only** with owner approval | Neon `main` branch | Normal, published pages only | Public |

Rules:
- Phase A uses **local + preview only**. No production deployment, no DNS change, no redirect from the old WordPress site. Production is created only when the owner approves (CLAUDE.md rule 4). `.claude/settings.json` already denies `vercel --prod`.
- The environment is detected from `VERCEL_ENV` plus an explicit `SITE_ENV` (`development | preview | production`). Anything that is not `production` sends `noindex`, whatever the content.
- Region: Vercel functions in `fra1` (Frankfurt) with Neon `aws-eu-central-1`. This is the closest well-supported region to Israel and keeps the DB and the app together.
- Secrets live only in Vercel environment variables and the local `.env` (git-ignored). The repo keeps `.env.example`.
- DB changes in preview/production go only through Payload migrations (`payload migrate:create`, `payload migrate`). Schema "push" only in local dev.
- Backups: Neon point-in-time restore (check how far back the chosen plan goes) plus a scheduled `pg_dump` before each migration in production.
- **Accounts belong to the owner** (Vercel team, Neon, domain, email provider), with the developer invited. This avoids being locked out if the maintainer changes.

Vercel's free Hobby plan does not allow commercial use, so a Pro seat is needed once the site goes live. Alternatives (Railway with Postgres in one place; a VPS with Coolify) are in ADR-0002.

---

## 5. Project and folder structure

Payload 3 installs into the Next.js app. The tree below follows Payload's own layout (`(payload)` route group, `payload.config.ts`), so upgrades stay simple. It keeps the split from the draft spec (site / CMS / features / lib / styles), with one change: each block keeps its CMS schema and its React renderer **in the same folder**, so a block is added or removed in one place.

```
margaliot-2.0/
├─ CLAUDE.md, docs/…                    (existing; unchanged by code tasks)
├─ .env.example                         every variable documented, no values
├─ docker-compose.yml                   local Postgres 17
├─ next.config.ts                       security headers, images, env-aware X-Robots-Tag
├─ postcss.config.mjs                   @tailwindcss/postcss
├─ playwright.config.ts · vitest.config.ts · lighthouserc.json
├─ .github/workflows/ci.yml             lint · typecheck · unit · build · e2e+axe
└─ src/
   ├─ payload.config.ts                 collections, globals, plugins, i18n (he), db, storage
   ├─ payload-types.ts                  generated; never hand-edited
   ├─ app/
   │  ├─ (site)/                        public website (root layout: <html lang="he" dir="rtl">)
   │  │  ├─ layout.tsx                  fonts, tokens, SiteShell (Header/Footer/WhatsApp/StickyCTA)
   │  │  ├─ page.tsx                    home
   │  │  ├─ [slug]/page.tsx             every tab + legal page (resolved through the registry)
   │  │  ├─ uman-trips/[trip]/page.tsx  single trip
   │  │  ├─ parasha/[slug]/page.tsx     single parasha
   │  │  ├─ online-classes/[slug]/page.tsx  single lesson
   │  │  ├─ not-found.tsx · error.tsx
   │  │  ├─ sitemap.ts · robots.ts      published-only sitemap; env-aware robots
   │  │  └─ api/preview/route.ts · api/exit-preview/route.ts   draft mode on/off (auth-checked)
   │  └─ (payload)/                     generated by Payload: /admin, /api (REST), GraphQL off
   ├─ config/
   │  ├─ site-map.ts                    THE registry: 11 tabs + home + legal: key, fixed Hebrew name,
   │  │                                 order, slug, template, default menu group
   │  └─ reserved-routes.ts             routes reserved for later (404 today)
   ├─ cms/
   │  ├─ collections/                   Pages, Trips, Events, Parashot, Lessons, Topics,
   │  │                                 Testimonials, Team, Media, Users
   │  ├─ globals/                       SiteSettings, Navigation
   │  ├─ fields/                        shared fields: slug, seo, registration, hebrewDate, link
   │  ├─ access/                        isAdmin, isEditorOrAdmin, publishedOrAuthenticated
   │  ├─ hooks/                         revalidate-on-change, lock-system-pages
   │  └─ seed/                          creates the 15 pages as drafts with [תוכן יתווסף] placeholders
   ├─ blocks/                           one folder per block: config.ts (Payload) + Component.tsx
   │  ├─ Hero/ TextImage/ Cards/ TripSummary/ EventList/ Gallery/
   │  ├─ Video/ Testimonials/ FAQ/ CTA/ Form/ Social/
   │  ├─ index.ts                       block registry (slug → config + component)
   │  └─ RenderBlocks.tsx
   ├─ templates/                        InformationTemplate, TripTemplate, ActivityTemplate,
   │                                    LibraryTemplate, HomeTemplate, LegalTemplate
   ├─ components/
   │  ├─ layout/                        SiteShell, Header, DesktopNav, MobileMenu, Footer,
   │  │                                 WhatsAppButton, StickyCTA, Breadcrumbs, SkipLink
   │  └─ ui/                            Button, Link, Icon (with RTL mirroring), Badge, Container,
   │                                    Section, Accordion, VisuallyHidden
   ├─ features/
   │  └─ booking/README.md              reserved; empty in Phase A (see ADR-0005)
   ├─ lib/
   │  ├─ cms/                           the ONLY data-access layer for the site: getPage, getNavigation,
   │  │                                 getSiteSettings, getNextTrip… (published-only unless draftMode)
   │  ├─ seo/                           metadata builder, JSON-LD helpers, canonical
   │  ├─ dates.ts                       Gregorian + Hebrew formatting via Intl
   │  ├─ whatsapp.ts                    wa.me link builder with per-page message
   │  └─ env.ts                         typed env access + SITE_ENV
   └─ styles/
      ├─ tokens.css                     design tokens (CSS custom properties) — see §9
      ├─ theme.css                      Tailwind @theme mapping semantic tokens → utilities
      ├─ base.css                       reset, typography defaults, focus ring, reduced motion
      └─ fonts.ts                       next/font definitions (set after the direction is approved)
```

---

## 6. Routing and URL slugs (→ ADR-0003)

### 6.1 Route table

**Recommendation: English slugs.** These are the ones in the draft spec; the final list is decision D4.

| Page (fixed name) | Route | Template | Menu group (rec.) |
| --- | --- | --- | --- |
| עמוד הבית | `/` | home | — |
| 1 מי אנחנו | `/about` | information | מרגליות |
| 2 פגישת ייעוץ | `/consultation` | information | פעילויות |
| 3 המסע הקרוב | `/next-trip` | trip | מסעות |
| 4 מסעות לאומן | `/uman-trips` | trip (overview) | מסעות |
| 5 קברי צדיקים בארץ | `/tzadikim-israel` | activity | מסעות |
| 6 ערבי נשים | `/womens-evenings` | activity | פעילויות |
| 7 תקשור בציבור | `/channeling` | activity | פעילויות |
| 8 קורס הארת הכלים | `/tools-course` | activity | פעילויות |
| 9 פרשת השבוע | `/parasha` | library | תוכן |
| 10 שיעורי התחזקות אונליין | `/online-classes` | library | תוכן |
| 11 יצירת קשר | `/contact` | information | מרגליות |
| תקנון ומדיניות ביטול | `/terms` | legal | Footer |
| מדיניות פרטיות | `/privacy` | legal | Footer |
| הצהרת נגישות | `/accessibility` | legal | Footer |

Child routes (generated from collections): `/uman-trips/[trip]`, `/parasha/[slug]` (transliterated, e.g. `/parasha/vayera`), `/online-classes/[slug]`. Activity dates (Events) are listed on their tab page and get **no** detail pages in Phase A.

Reserved, returning 404 today (ADR-0005): `/next-trip/register`, `/account`, `/api/booking/*`, `/api/webhooks/payments/*`.

System routes: `/admin` (Payload, `noindex`, disallowed in robots), `/api/*` (Payload REST; GraphQL disabled), `/sitemap.xml`, `/robots.txt`.

### 6.2 How a URL resolves
1. `[slug]/page.tsx` looks the slug up in `config/site-map.ts`. If it is not a registered tab or legal slug → `notFound()`.
2. It loads the matching `Pages` document by `systemKey` through `lib/cms`. If the page is not published and draft mode is off → `notFound()` (404, not an empty page).
3. It renders the template named in the registry, passing the page's blocks plus the template's data region (trip, events, or library items).
4. Static generation at build (`generateStaticParams` from the registry) plus on-demand revalidation from Payload `afterChange` hooks (`revalidatePath` / `revalidateTag`).

### 6.3 English vs Hebrew slugs

| | English (`/next-trip`) | Hebrew (`/המסע-הקרוב`) |
| --- | --- | --- |
| Shared in WhatsApp / SMS | Short and clean | Often shown percent-encoded (`/%D7%94%D7%9E…`), which is long and looks broken |
| Typing on a phone | Needs an English keyboard switch | Natural for Hebrew speakers |
| SEO | Neutral. Google reads the Hebrew title, H1 and content | Small keyword benefit in the URL |
| Robustness | No encoding bugs in tools, analytics or email clients | Encoding problems in some tools and older clients |

Recommendation: English, because most traffic arrives from shared WhatsApp/Instagram links.

### 6.4 `/next-trip` behaviour (recommendation; draft marks it [המלצה])
`/next-trip` is a **stable URL**. It shows whichever trip is selected in `SiteSettings.nextTrip`, so links already sent on WhatsApp stay valid. That trip's own page `/uman-trips/[trip]` points its canonical URL at `/next-trip` while it is the selected trip, and at itself afterwards, so there is no duplicate content. If no trip is selected, `/next-trip` shows a designed "no trip open yet" state with contact/WhatsApp. It never becomes an empty page.

---

## 7. Navigation model

**Recommendation: data-driven, published-only, 4 groups.**

- **Source of fixed facts (code):** `config/site-map.ts` holds each tab's key, exact Hebrew name, order, slug, template and default group. A unit test asserts the 11 names and their order match CLAUDE.md character for character. Changing a tab name, its order or its group is a code change with review, on purpose, because these are owner decisions.
- **Source of editable facts (CMS, `Navigation` global):** the labels of the 4 groups (recommended מסעות / פעילויות / תוכן / מרגליות; open decision D5), a one-line description per tab for the desktop dropdown, the Header CTA label (target fixed: `/next-trip`), and extra footer links.
- **Publish filter:** `getNavigation()` joins the registry with the publish status of each `Pages` document. Unpublished tabs are left out of the header, mobile menu, footer, breadcrumbs and sitemap. A group with no published tab is hidden. Publishing a page adds it to the menu in its fixed position with no code change.
- **Shapes:**
  - Desktop: sticky header, 4 group triggers that open dropdowns (disclosure pattern: `button[aria-expanded]` + list of links, not the ARIA `menu` role), Esc closes and returns focus, arrow keys optional.
  - Mobile: compact header (logo, trip CTA, menu button). The full-screen menu has the 4 groups as accordions and social links at the bottom, traps focus while open and closes on Esc.
  - Footer: every published tab, the 3 legal pages, contact details and socials from `SiteSettings`.
  - Breadcrumbs: built from registry group + page, e.g. בית › מסעות › המסע הקרוב, with `BreadcrumbList` JSON-LD.
- **Social and contact links:** stored once in `SiteSettings` and used in 4 places (Header, Footer, floating WhatsApp, Social block). Any link that is empty is **not rendered**. No placeholder links (CLAUDE.md).

The visual form (dropdown vs mega-menu, motion, sticky CTA styling) belongs to the senior-ui-design-architect after the direction is approved. This section fixes only the data and behaviour contract.

---

## 8. Content model (→ ADR-0004)

### 8.1 Page templates

| Template | Used by | Fixed regions (from data) | Allowed editor blocks |
| --- | --- | --- | --- |
| **home** | `/` | Next-trip summary (from `SiteSettings.nextTrip`), latest parasha | All blocks |
| **information** | about, consultation, contact | Page heading | Hero, TextImage, Cards, Testimonials, FAQ, CTA, Form, Gallery, Video, Social |
| **trip** | next-trip, uman-trips, trip detail | Trip details for the selected trip (dates Gregorian + Hebrew, guides, tziunim, itinerary, inclusions, gallery, FAQ, registration CTA). The uman-trips overview lists upcoming and past trips | Hero, TextImage, Gallery, Video, Testimonials, FAQ, CTA, Social |
| **activity** (with dates) | tzadikim-israel, womens-evenings, channeling, tools-course | Upcoming dates from `Events` filtered by the page's `activityType`, with an empty state | Hero, TextImage, Gallery, Video, Testimonials, FAQ, CTA, Form |
| **library** | parasha, online-classes | Featured latest item, then a list by date (parasha grouped by book; lessons filterable by topic) | Hero, TextImage, Video, CTA, Social |
| **legal** | terms, privacy, accessibility | Rich text body, "last updated" date | — |

Each template takes a `character` setting (accent, imagery treatment, layout rhythm) defined by the Design System, so pages share one system without being 11 identical pages (CLAUDE.md design rule).

### 8.2 Reusable blocks (12, from the draft)
Hero · TextImage · Cards · TripSummary · EventList · Gallery · Video (YouTube via `youtube-nocookie`, click-to-load facade) · Testimonials (from the collection, filtered by activity) · FAQ · CTA · Form (form-builder form reference) · Social. Every block has `config.ts` (fields) and `Component.tsx` (renderer). A block's renderer may only use semantic tokens.

### 8.3 Collections

| Collection | Phase A fields (all content optional unless noted) | Notes |
| --- | --- | --- |
| **Pages** | `title`*, `systemKey`* (registry key; unique, read-only after seed), `slug` (from registry, read-only), `template` (from registry, read-only), `hero`, `layout` (blocks), `primaryAction` (label + target for sticky mobile CTA), `whatsappMessage`, `seo`, `_status` | The 15 system pages are seeded and **cannot be deleted** (`access.delete: () => false` for system keys). Tab titles are locked to the registry names |
| **Trips** | `title`*, `slug`*, `startDate`, `endDate`, `guides` (→ Team), `tziunim` (array), `itinerary` (array of days), `included` (rich text), `gallery` (→ Media), `faq` (array), `priceDisplay` (text; shown only if filled), `registration` (shared field, §11), `seo`, `_status` | Booking fields are designed, not added (ADR-0005). No sold-out, capacity, room or audience fields in Phase A: those decisions are open |
| **Events** | `title`*, `activityType`* (tzadikim-israel / womens-evenings / channeling / tools-course), `start`*, `end`, `location`, `departurePoint`, `priceDisplay`, `registration`, `_status` | One collection for all dated activities |
| **Parashot** | `name`*, `slug`*, `book`* (בראשית…דברים), `order`, `hebrewYear`, `publishDate`*, `videoUrl`, `body`, `image`, `seo`, `_status` | |
| **Lessons** | `title`*, `slug`*, `kind`* (recorded / live), `topic` (→ Topics), `videoUrl`, `liveStart`, `joinUrl`, `body`, `seo`, `_status` | Paid or member-only access is open; field reserved, not added |
| **Topics** | `name`* | Filters for lessons |
| **Testimonials** | `quote`*, `attribution` (name or initials), `activities` (multi-select), `featured`, `consentConfirmed`* (must be checked before publish), `_status` | Never invented; owner-supplied only |
| **Team** | `name`*, `role`, `photo`, `bio`, `order` | |
| **Media** | `alt`* (required, Hebrew), `caption`, `credit`; image sizes for card/hero/OG | Stored in Vercel Blob |
| **Users** | `email`*, `name`, `roles`* (`admin`, `editor`) | Admin login only; no public accounts |
| **Forms / FormSubmissions** | from `@payloadcms/plugin-form-builder` | Email delivery off until D8 |

### 8.4 Globals
- **SiteSettings:** organisation name, tagline, phones[], WhatsApp number, default WhatsApp message, email, office hours, social links (Instagram, TikTok, WhatsApp community, YouTube; each optional and hidden when empty), `nextTrip` (→ Trips), default SEO/OG image, accessibility-coordinator contact (for the statement page).
- **Navigation:** group labels, per-tab dropdown descriptions, header CTA label, extra footer links.

### 8.5 Draft, publish and preview: unready pages are never public
- `versions: { drafts: true }` on Pages, Trips, Events, Parashot, Lessons and Testimonials. New documents start as **draft**.
- `lib/cms` is the only way the site reads data. It always queries `draft: false` and `_status = published`, unless Next.js `draftMode()` is on.
- Draft mode can only be switched on by `/api/preview`, which checks the Payload session cookie and that the user has the `admin` or `editor` role. Preview responses send `Cache-Control: private, no-store` and `noindex`.
- A draft page is: absent from navigation, footer, breadcrumbs and `sitemap.xml`; a 404 at its URL for the public; `noindex` even in preview.
- Payload live preview (`admin.livePreview`) shows editors the real template at mobile/tablet/desktop widths.
- Tests (T12, T17) assert the three leak paths for every route in both states: menu, sitemap, direct URL.
- Optional later: Payload's scheduled publish for parasha releases.

---

## 9. Design-token integration point (direction not chosen yet)

The direction (A אור השחר / B ספיר ולילה / C בית חם) is open (D1). The code is built so that choosing one means **replacing one file**, not touching components.

```
styles/tokens.css
  :root {
    /* 1. primitives: raw brand values, replaced by the approved direction */
    --palette-ink-900: …; --palette-accent-600: …; --palette-gold-400: …;
    --font-display: …; --font-body: …;
    --space-1: 4px … --space-12: 96px;  --radius-…; --shadow-…;
    --duration-fast: 200ms; --duration-slow: 500ms; --ease-standard: …;

    /* 2. semantic: what components use */
    --color-bg; --color-surface; --color-text; --color-text-muted;
    --color-accent; --color-cta-bg; --color-cta-text; --color-focus-ring;
    --color-border; --color-decor;
  }
  [data-character="…"] { /* per-template accent overrides, defined by the Design System */ }
  @media (prefers-reduced-motion: reduce) { :root { --duration-fast: 0ms; --duration-slow: 0ms; } }

styles/theme.css   (Tailwind 4)
  @import "tailwindcss";
  @theme inline { --color-bg: var(--color-bg); --color-accent: var(--color-accent); … }
```

Rules: components use semantic utilities only (`bg-surface`, `text-accent`, `ps-4`). Hard-coded colours, sizes and physical left/right properties are blocked by a lint check (T04). Before approval, `tokens.css` contains clearly labelled **neutral wireframe values** used only by unstyled infrastructure work, never shown as a design. After approval, the senior-ui-design-architect's `docs/design/DESIGN-SYSTEM.md` is the single source for the values, and `fonts.ts` loads the approved fonts. Shared constants that already hold across all three directions (12-column grid, max width 1200–1240px, breakpoints 390/768/1024/1440, spacing 4–96, body 17px, 44px tap targets, motion 200–500ms) are pre-wired as tokens. They still carry [המלצה] status until the Design System is approved.

---

## 10. Cross-cutting foundations

**RTL and Hebrew**
- `<html lang="he" dir="rtl">` in the root layout, never per component. Logical CSS only (`margin-inline-start`, `ms-*`, `start-*`). Directional icons (arrows, chevrons) mirror via the `Icon` component's `mirror` prop.
- Mixed-direction text (phone numbers, English names, prices) is wrapped in `<bdi>` / `dir="ltr"` spans by helpers.
- Dates show both Gregorian and Hebrew calendars through `Intl`.
- The admin UI is set to Hebrew/RTL (`i18n` with `he` from `@payloadcms/translations`). Confirm coverage in T07.

**Accessibility: IS 5568 / WCAG 2.x AA (target 2.2 AA)**
- Semantic landmarks, one `h1` per page, skip link, visible focus ring token, keyboard-operable menus (Esc closes, focus is restored), focus trap in the mobile menu, 44px targets, contrast-checked token pairs, required `alt` on Media, labelled form fields with Hebrew error messages, captions/titles on video embeds, `prefers-reduced-motion`.
- The accessibility statement page is required by Israeli regulations and needs owner-supplied coordinator details.
- **No accessibility overlay widgets.** They do not make a site compliant and often interfere with screen readers.
- axe runs on every route in CI.

**SEO**
- Per-page title and description (`plugin-seo`) with fallbacks from title and site name. Canonical URLs. Open Graph and WhatsApp preview image per page with a site default.
- `sitemap.xml` lists published pages only. `robots.txt` is env-aware: disallow all outside production, and disallow `/admin` and `/api` in production.
- JSON-LD: `Organization` site-wide, `BreadcrumbList`, `Event` for activity dates, `TouristTrip` for trips.
- Redirects from the old site only with owner approval, later; `@payloadcms/plugin-redirects` is reserved for that.

**Performance (budgets, mobile, Lighthouse CI)**
- LCP < 2.5 s, CLS < 0.1, INP < 200 ms, Lighthouse Performance ≥ 90 on each template. The draft's "under 3 s on mobile" is covered by these.
- Static generation with on-demand revalidation. `next/image` serves AVIF/WebP with explicit sizes, and only the hero image loads with `priority`. Fonts are self-hosted, subset to Hebrew and Latin, with `display: swap`. Video is click-to-load. Server components by default; client JS only for menus, accordions, gallery and forms.

**Security**
- HTTPS everywhere, with HSTS in production.
- Headers in `next.config.ts`: CSP (report-only in preview first), `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'` for the site and `'self'` for admin preview.
- Payload: `maxLoginAttempts` and `lockTime` on Users, strong password policy, GraphQL disabled, collection access functions deny by default, admin `noindex`.
- **2FA:** Payload has no first-party TOTP. Evaluate a maintained community plugin in T07, or accept the mitigations above until production (D13).
- Forms: Turnstile + honeypot + server-side validation + rate limit.
- Secrets only in env. Dependabot/Renovate for updates, plus the monthly Next.js security releases.
- Personal data (form submissions) is minimised and retained per the privacy policy. Forms do not go live publicly before the privacy page is approved.
- Israeli Privacy Protection Law (Amendment 13) applies more strictly once passports are collected (ADR-0005).

---

## 11. Extension points for booking, payments, invoices, roles, courses (→ ADR-0005)

Designed now, **not built**. Nothing below is required at launch.

1. **Trips is the single trip record.** Booking will reference `Trips` by id and add *new* collections (`Bookings`, `Participants`, `RoomTypes`, `RoomRequests`, `Payments`, `Invoices`). It never makes a parallel trip structure. Fields that depend on open decisions (capacity/sold-out, room types, structured flights, audience) are listed in ADR-0005 and added only once approved.
2. **Registration is one shared field group plus one `RegistrationButton` component**, used on Trips, Events and the CTA block:
   `registration.mode`: `none` (default; button hidden or replaced by the contact CTA) · `form` (→ a form-builder form) · `whatsapp` (prefilled message) · `external` (URL) · `onsite` (**reserved**: present in code but disabled in the admin until the booking phase). Moving to on-site booking later is a setting change, not a page rewrite. Which interim mode to use is open (D7).
3. **Reserved routes:** `/next-trip/register`, `/account`, `/api/booking/*`, `/api/webhooks/payments/[provider]`. They are listed in `config/reserved-routes.ts` and return 404. No slug in the CMS may collide with them (slug validation).
4. **Roles:** `Users.roles` is an array checked by access helpers in `cms/access/`. Phase A: `admin`, `editor`. Reserved: `bookingManager`, `finance` (sees payments/invoices only), `viewer`. New roles are added to the same system (CLAUDE.md: multiple admins with different permissions).
5. **Sensitive data (e.g. passports, if approved):** a separate store, never ordinary CMS fields. Either a separate Postgres schema with application-level AES-256-GCM encryption (key in env/KMS, rotated) or a separate database. Access only for `bookingManager`/`admin`, every read logged, excluded from the REST API and from admin list views, and deleted on a retention schedule. Needs a privacy review under Amendment 13 before it is built.
6. **Payment provider abstraction:** `features/booking/payments/PaymentProvider` (`createCheckout`, `verifyWebhook`, `refund`, `getStatus`) with one adapter per provider (Israeli candidates for later evaluation: Cardcom, Tranzila, PayPlus, Grow/Meshulam, Hyp). An `InvoiceProvider` (`issueReceipt`, `issueRefundDocument`) is kept separate, because many Israeli setups issue documents through a separate service. Pages never call providers directly. Card data never touches our servers (hosted payment page / iframe only).
7. **Courses:** Lessons can later gain an `access` field and enrolment through the same Users/roles and payment abstraction. It is not designed in detail until the owner decides on paid courses.

---

## 12. What this proposal decides, needs approval for, and leaves open

**Proposed (decided by the architect, pending approval):** the stack (§3), hosting and environments (§4), folder structure (§5), the route table with English slugs (§6), the navigation data contract (§7), the content model and draft/publish behaviour (§8), the token integration point (§9), foundations (§10), extension points (§11).

**Needs owner approval:** ADR-0001 to ADR-0005 and the decisions in [DECISIONS-NEEDED.md](DECISIONS-NEEDED.md). The blocking ones are: spec approval, stack, hosting/accounts, slugs, content model, visual direction, and logo.

**Open questions (not decided here):** menu group labels; interim registration mode; contact-form destination; who maintains the site after launch; legal page texts and who writes them; 2FA approach; every booking-phase item (capacity/sold-out, rooms, passports, invoices, refunds, audience types).
