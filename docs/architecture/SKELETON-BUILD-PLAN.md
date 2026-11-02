# Margaliot 2.0 — Skeleton Build Plan (Phase A)

- **Status:** proposed. No task may start until its gate is open.
- **Author:** system-architect, 2026-11-02
- **Implements:** [ARCHITECTURE-PROPOSAL.md](ARCHITECTURE-PROPOSAL.md), ADR-0001 to ADR-0005 (once approved)

> **Owner decision 2026-11-02 — overrides gate G2 below:** the skeleton is built now with a *basic, clean* look derived from the existing brand colours (Phase 1). UI tasks T20–T36 may proceed in Phase 1 using basic token values; the Premium visual direction (D1) and full Design System come in Phase 2 and replace the token values and component/layout variants without rewriting the system. G1 is open: stack, routes and navigation (3 groups + 2 direct links) are approved; V1.1 is the basis for the skeleton only.

## Gates

| Gate | Opens when | Unlocks |
| --- | --- | --- |
| **G1: architecture approved** | Spec V1.1 approved and copied to `SPEC.md` (D0); ADR-0001…0004 approved (D2, D3, D4, D9) | Infrastructure tasks T01–T18 (no visual UI) |
| **G2: visual direction approved** | Owner chooses a direction (D1), and `docs/design/DESIGN-SYSTEM.md` is written and approved | All UI tasks T20–T36 |
| **G3: Phase A gate** | T37–T39 pass | Owner approval of Phase A |

**Before G2 (safe):** tooling, CMS schema, routes, data access, draft/publish, SEO plumbing, tests, and a neutral token *structure*. These tasks produce no styled UI. Any markup they need is unstyled semantic HTML used only for tests, and it is replaced in G2 tasks.
**After G2 (blocked):** anything a visitor would see as design: tokens values, fonts, Header, navigation visuals, Footer, blocks, templates, pages.

## Conventions for every task
- One writer at a time (CLAUDE.md rule 8). The frontend-engineer takes one task, then QA, UX and design review run read-only, then fixes.
- Definition of done for every code task: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` all pass; no hard-coded colours or sizes; logical CSS properties only; no invented content (placeholders are `[תוכן יתווסף]`); no production deploy.
- "Owner" below means the **agent** that does the task. Reviewers are in brackets.
- Abbreviations: FE = frontend-engineer, UI = senior-ui-design-architect, QA = quality-accessibility-engineer, UX = ux-navigation-specialist, PR = project-reviewer, SA = system-architect.

---

## Stage 1: Foundations (gate G1; can run before the visual direction)

### T01 Scaffold the project
- **Owner:** FE [QA]
- **Inputs:** ADR-0001; ARCHITECTURE-PROPOSAL §3, §5
- **Output:** Next.js 16.4.x + Payload 3.92.x app (via `create-payload-app`, blank template, Postgres adapter). TypeScript strict, pnpm 10, Node 24 (`.nvmrc`, `engines`), ESLint 9 + Prettier, folder tree from §5 (empty folders with README where needed). `README.md` lists the commands, and a proposed "Commands" section for CLAUDE.md is sent to the owner (FE does not edit CLAUDE.md).
- **Acceptance:** `pnpm dev` serves `/` (blank) and `/admin`. Lint, typecheck and build pass. All `@payloadcms/*` packages on one exact version. No dependency beyond those listed in ADR-0001.
- **Depends on:** G1

### T02 Environment and configuration
- **Owner:** FE [QA]
- **Inputs:** ADR-0002
- **Output:** `.env.example` (DATABASE_URL, PAYLOAD_SECRET, SITE_ENV, NEXT_PUBLIC_SITE_URL, BLOB_READ_WRITE_TOKEN, PREVIEW_SECRET, later TURNSTILE_*, RESEND_*). `src/lib/env.ts` with typed access that fails fast when a variable is missing. `.gitignore` covers `.env*`.
- **Acceptance:** the app refuses to start without required variables and shows a clear message. A secret scan finds no secrets in the repo. `SITE_ENV` defaults to `development`.
- **Depends on:** T01

### T03 Local database and migrations workflow
- **Owner:** FE [QA]
- **Inputs:** ADR-0002
- **Output:** `docker-compose.yml` (Postgres 17). Scripts `db:up`, `migrate:create`, `migrate`, `generate:types`. A note on push (dev only) vs. migrations (preview/prod).
- **Acceptance:** fresh clone → `db:up` → `migrate` → `dev` works. A migration file is committed for the initial schema.
- **Depends on:** T01, T02

### T04 RTL and base layout (unstyled)
- **Owner:** FE [QA, UX]
- **Inputs:** ARCHITECTURE-PROPOSAL §10 (RTL, a11y)
- **Output:** `(site)/layout.tsx` with `<html lang="he" dir="rtl">`, `base.css` (modern reset, logical properties, focus-visible ring using a token variable, `prefers-reduced-motion` rule). Skip link, and `<header>/<main id="main">/<footer>` landmarks. Lint check `scripts/check-logical-css.mjs` fails on `ml-|mr-|pl-|pr-|left-|right-` classes and `margin-left`, `padding-right`, etc.
- **Acceptance:** axe shows no violations on the blank page. `lang` and `dir` are present. The lint check fails on a deliberate physical property and passes after removing it.
- **Depends on:** T01

### T05 Token layer structure (neutral placeholders)
- **Owner:** FE [UI]
- **Inputs:** ARCHITECTURE-PROPOSAL §9; `docs/design/directions/README.md` (shared constants only)
- **Output:** `styles/tokens.css` with three layers (primitive / semantic / `data-character` overrides) filled with **clearly labelled neutral wireframe values**. `styles/theme.css` maps semantic tokens to Tailwind 4 utilities via `@theme inline`. The shared constants (grid, breakpoints 390/768/1024/1440, spacing 4–96, body 17px, 44px targets, motion 200–500ms) are tokenised. `docs`-style comment explains that the approved direction replaces only the primitive layer.
- **Acceptance:** a test component built with semantic utilities changes appearance when only `tokens.css` changes. No component file contains a colour literal. UI agent confirms the structure can hold all three directions.
- **Depends on:** T04

### T06 Site-map registry and reserved routes
- **Owner:** FE [UX, PR]
- **Inputs:** ADR-0003; CLAUDE.md tab list
- **Output:** `src/config/site-map.ts` (home + 11 tabs + 3 legal: key, exact Hebrew name, order, slug, template, default group, footer flag). `src/config/reserved-routes.ts`. Vitest test comparing names and order to a fixture copied from CLAUDE.md.
- **Acceptance:** the test fails if any tab name differs by even one character, or if the order changes. 15 entries. Slugs are unique and do not collide with reserved routes.
- **Depends on:** T01, decision D4 (slugs), D5 (group membership; labels can wait)

### T07 Payload base: users, roles, media, admin language
- **Owner:** FE [QA]
- **Inputs:** ADR-0004, ADR-0005 (roles); proposal §10 (security)
- **Output:**
  - `Users` with `roles` (`admin`, `editor`), `maxLoginAttempts` and `lockTime`, password policy.
  - Access helpers in `cms/access/`.
  - `Media` with required `alt`, caption, credit and image sizes; local storage in dev, Vercel Blob adapter configured for preview.
  - Admin i18n set to Hebrew/RTL; GraphQL disabled; admin `noindex`.
  - A short written evaluation of 2FA options for decision D13.
- **Acceptance:** an editor cannot manage users. An anonymous REST call to Users returns 401/403. Uploading without alt fails. Admin renders in Hebrew; any untranslated strings are listed.
- **Depends on:** T03

### T08 Pages collection, system-page locking, seed
- **Owner:** FE [PR]
- **Inputs:** ADR-0004; T06 registry
- **Output:**
  - `Pages` with drafts/versions, `systemKey`, locked slug/template/title for system pages, `hero`, `layout` (blocks; schema from T11), `primaryAction`, `whatsappMessage`, `seo` (plugin-seo).
  - Delete is denied for system pages.
  - `cms/seed` creates the 15 pages as **drafts** with `[תוכן יתווסף]` placeholders only.
- **Acceptance:** seed is idempotent. All 15 exist as drafts. An editor cannot delete or rename a system page. Nothing is published by the seed.
- **Depends on:** T06, T07 (T11 can follow; `layout` starts empty)

### T09 Content collections
- **Owner:** FE [PR]
- **Inputs:** ADR-0004 §collections; ADR-0005 (fields **not** to add)
- **Output:** Trips, Events, Parashot, Lessons, Topics, Testimonials (consent required to publish), Team, with the shared fields `slug` (validated: Latin lowercase, no registry/reserved collisions), `seo` and `registration` (modes `none | form | whatsapp | external`; `onsite` present but disabled). Drafts on where specified.
- **Acceptance:** none of these fields exist: sold-out, capacity, room, passport, audience, refund, invoice. Slug validation rejects `register`, `account`, Hebrew characters, and duplicates. Types are generated.
- **Depends on:** T07

### T10 Globals: SiteSettings and Navigation
- **Owner:** FE [UX]
- **Inputs:** ADR-0004 §globals; proposal §7
- **Output:** `SiteSettings` (contact, socials all optional, default WhatsApp message, `nextTrip`, default SEO image, accessibility coordinator). `Navigation` (4 group labels, per-tab descriptions, header CTA label, extra footer links). Seeded **empty**, apart from the registry-provided defaults.
- **Acceptance:** no phone number, link or address is pre-filled. Empty socials produce no output in the helper functions (unit-tested in T13).
- **Depends on:** T07

### T11 Block schemas (config only)
- **Owner:** FE [UI]
- **Inputs:** proposal §8.1–8.2
- **Output:** `blocks/<Name>/config.ts` for the 12 blocks. Block registry `blocks/index.ts`. Per-template allow-lists enforced in the `Pages.layout` field (by template).
- **Acceptance:** an editor sees only allowed blocks per template. The Video block accepts YouTube URLs only. The Form block references a form-builder form. No `Component.tsx` styling yet (renderers come in T28–T31).
- **Depends on:** T08, T09

### T12 Data-access layer, draft mode, preview, revalidation
- **Owner:** FE [QA]
- **Inputs:** ADR-0004 §draft/publish
- **Output:**
  - `src/lib/cms/*` (`getPage`, `getNextTrip`, `getEvents(activityType)`, `getParashot`, `getLessons`, `getSiteSettings`) that read published content only unless `draftMode()` is on.
  - `/api/preview` (checks Payload session + role) and `/api/exit-preview`.
  - Payload live preview config.
  - `afterChange`/`afterDelete` hooks calling `revalidatePath`/`revalidateTag`.
- **Acceptance (tested):** anonymous requests never receive drafts. Preview without a session returns 401. Preview responses are `private, no-store` and `noindex`. Publishing updates the public page without a rebuild.
- **Depends on:** T08, T09, T10

### T13 Navigation data layer
- **Owner:** FE [UX]
- **Inputs:** proposal §7; T06; T10
- **Output:** `getNavigation()` returning header groups, mobile groups, footer links and breadcrumb trails, filtered to published pages. Empty groups are hidden. `getSocialLinks()` omits empty entries.
- **Acceptance (unit tests):** with 0 published tabs → no groups. Publishing "ערבי נשים" alone → only its group, containing only that tab, at its fixed position. Order always follows the registry. Labels come from the Navigation global.
- **Depends on:** T06, T10, T12

### T14 Routes for all pages (unstyled render)
- **Owner:** FE [QA, UX]
- **Inputs:** ADR-0003
- **Output:**
  - `(site)/page.tsx`, `[slug]/page.tsx`, `uman-trips/[trip]`, `parasha/[slug]` and `online-classes/[slug]` with `generateStaticParams`.
  - Template dispatch (template components are stubs rendering semantic HTML only).
  - Reserved routes → 404. `not-found.tsx` stub.
  - `/next-trip` resolves `SiteSettings.nextTrip` with an empty-state branch and the canonical rule from ADR-0003.
- **Acceptance (Playwright):** each of the 15 routes returns 404 while draft and 200 once published. Unknown slug → 404. `/next-trip/register` and `/account` → 404.
- **Depends on:** T12

### T15 SEO plumbing
- **Owner:** FE [QA]
- **Inputs:** proposal §10 SEO
- **Output:** metadata builder (title template, description fallbacks, canonical, OG/WhatsApp image). JSON-LD helpers (Organization, BreadcrumbList, Event, TouristTrip). `sitemap.ts` (published only). `robots.ts` (disallow all unless `SITE_ENV=production`; disallow `/admin`, `/api`). `X-Robots-Tag: noindex, nofollow` header on non-production in `next.config.ts`.
- **Acceptance:** the sitemap never contains a draft. In preview, robots disallows all and every response carries the noindex header. JSON-LD validates against schema.org in tests.
- **Depends on:** T14

### T16 Security baseline and form plumbing
- **Owner:** FE [QA]
- **Inputs:** proposal §10 security; decision D8 (for email only)
- **Output:** security headers and CSP (report-only in preview). Form-builder plugin configured, with submissions stored in the CMS (admin-only access). Turnstile + honeypot + server-side validation + rate limit on submissions. Email notification **disabled** until D8.
- **Acceptance:** securityheaders-style check shows all headers present. A submission without a Turnstile token is rejected. An editor (not anonymous) can read submissions. No email is sent.
- **Depends on:** T11, T12

### T17 Test harness and CI
- **Owner:** QA (test files) + FE (CI wiring) [PR]
- **Inputs:** proposal §10; tasks T12–T16
- **Output:** Vitest config. Playwright e2e: routes × publish state, draft-leak tests (menu, sitemap, direct URL), reserved routes. `@axe-core/playwright` on every route. `lighthouserc.json` with mobile budgets (LCP < 2.5 s, CLS < 0.1, Performance ≥ 90). `.github/workflows/ci.yml` running lint → typecheck → unit → build → e2e with Postgres service.
- **Acceptance:** CI is green on main. Deliberately publishing a page without content still yields no a11y violations. A deliberately leaked draft fails CI.
- **Depends on:** T14, T15

### T18 Preview environment (non-production)
- **Owner:** FE, with the owner creating or approving accounts [QA]
- **Inputs:** ADR-0002; decision D3
- **Output:** Vercel project (owner's team) with preview deployments only, Neon `staging` branch, Blob store, env vars, Vercel Authentication on previews, region `fra1`. **No production deployment and no custom domain.**
- **Acceptance:** a PR produces a protected `*.vercel.app` preview. Responses carry `noindex`. `vercel --prod` remains denied. The old site and the live domain are untouched.
- **Depends on:** T17, D3

---

## Stage 2: Visual shell (gate G2; blocked until the visual direction and Design System are approved)

### T20 Apply approved tokens and fonts
- **Owner:** FE [UI]
- **Inputs:** `docs/design/DESIGN-SYSTEM.md`
- **Output:** primitive and semantic token values in `tokens.css`, `data-character` variants, `fonts.ts` via `next/font` (Hebrew + Latin subsets).
- **Acceptance:** contrast pairs from the Design System pass AA in an automated check. The neutral placeholder values are gone. Fonts self-hosted with no layout shift (CLS < 0.1).
- **Depends on:** G2, T05

### T21 UI primitives
- **Owner:** FE [UI, QA]
- **Output:** Button, Link, Icon (with `mirror`), Badge, Container/Grid, Section, Accordion, VisuallyHidden, matching the Design System states (hover, focus, active, disabled).
- **Acceptance:** UI design review passes. Keyboard and focus states are visible. 44px targets.
- **Depends on:** T20

### T22 Layout shell and breadcrumbs
- **Owner:** FE [UI, UX]
- **Output:** `SiteShell` (header slot, main, footer, overlays slot), `Breadcrumbs` from `getNavigation()` with JSON-LD.
- **Acceptance:** landmarks are correct. Breadcrumbs reflect the registry group. No layout shift on load.
- **Depends on:** T21, T13

### T23 Header (desktop and mobile bar)
- **Owner:** FE [UI, UX, QA]
- **Inputs:** Design System Header spec; logo file (D6)
- **Output:** sticky header that shrinks on scroll (reduced-motion respected). Logo with Hebrew alt. Group triggers slot. Social icons only if set. "למסע הקרוב" CTA → `/next-trip`.
- **Acceptance:** matches the design at 390, 768, 1024 and 1440. CTA visible on every page. No empty social icons.
- **Depends on:** T22, **D6 (logo)**

### T24 Desktop navigation dropdowns
- **Owner:** FE [UX, QA, UI]
- **Output:** 4 group disclosures with tab links and descriptions, in registry order, published-only. Esc closes and returns focus. Outside click closes.
- **Acceptance:** keyboard-only walkthrough works. axe is clean. A draft tab is absent. RTL order is correct. UX review has no High findings.
- **Depends on:** T23, T13, D5 (labels)

### T25 Mobile menu
- **Owner:** FE [UX, QA, UI]
- **Output:** full-screen menu opening from the start side (right in RTL), groups as accordions, social row at the bottom. Focus trap; Esc and the close button work; body scroll locked.
- **Acceptance:** 360px and 390px checks pass. 44px targets. Screen-reader announcement is correct. No draft tabs.
- **Depends on:** T23, T13

### T26 Footer
- **Owner:** FE [UI, UX]
- **Output:** every published tab, 3 legal links (published only), contact details and socials from SiteSettings (hidden when empty).
- **Acceptance:** with empty SiteSettings, the footer shows no contact or social elements and no broken links.
- **Depends on:** T22, T13

### T27 Floating WhatsApp and sticky mobile CTA
- **Owner:** FE [UX, UI, QA]
- **Output:** `WhatsAppButton` (wa.me with per-page `whatsappMessage`, or the default; hidden if no number set). `StickyCTA` on mobile from `primaryAction` (falls back to the template default; hidden if none). The two do not overlap.
- **Acceptance:** no overlap with content or each other at 360–768px. Hidden with no number set. Tap targets ≥ 44px. Does not cover focused elements.
- **Depends on:** T22

## Stage 3: Blocks and templates (gate G2)

### T28 Blocks batch A: Hero, TextImage, Cards, CTA
### T29 Blocks batch B: Gallery, Video (click-to-load, nocookie), FAQ (accordion), Social
### T30 Blocks batch C: Testimonials, TripSummary, EventList (with empty states)
### T31 Blocks batch D: Form (Turnstile; Hebrew validation messages; email still off until D8)
- **Owner (each):** FE [UI, QA]
- **Inputs:** Design System component specs; T11 schemas
- **Output:** `Component.tsx` per block, registered in `RenderBlocks`.
- **Acceptance (each):** renders correctly with empty optional fields (renders nothing rather than a broken shell). Semantic tokens only. axe is clean. UI review passes at 390 and 1440. Images use `next/image` with sizes.
- **Depends on:** T21; T30 also on T12 data helpers; T31 on T16

### T32 Templates
- **Owner:** FE [UI, UX, QA]
- **Output:** Information, Trip, Activity, Library, Legal and Home templates with fixed regions + allowed blocks + `data-character`. Trip uses `RegistrationButton` (modes `none/form/whatsapp/external`; the interim mode comes from D7, and `none` until then).
- **Acceptance:** each template renders with placeholder-only data and with sample *test fixtures* (fixtures live in tests, never in the CMS). Lighthouse budgets are met per template. The 4 templates are visibly distinct in character, as the UI review confirms.
- **Depends on:** T28–T31

## Stage 4: Pages (gate G2)

### T33 Home page composition
- **Owner:** FE [UI, UX]
- **Output:** home template wired: next-trip summary, a card per *published* tab, latest parasha, socials, all from data.
- **Acceptance:** with nothing published, home shows only structure with placeholders and is still not public until the owner publishes it. No invented text.
- **Depends on:** T32

### T34 The 11 tab pages + 3 legal pages (drafts)
- **Owner:** FE [PR, QA]
- **Output:** each system page connected to its template, reviewed in preview with `[תוכן יתווסף]` placeholders. **All stay draft.**
- **Acceptance:** all 15 are viewable in preview. All return 404 publicly. None are in the menu or sitemap. Names are exact.
- **Depends on:** T32, T33

### T35 Child pages: trip, parasha, lesson
- **Owner:** FE [QA]
- **Output:** detail pages using the trip/library templates. Canonical rule for the selected next trip.
- **Acceptance:** 404 for drafts. Canonical correct in both states (selected / not selected).
- **Depends on:** T32

### T36 404 and error pages
- **Owner:** FE [UI, UX]
- **Output:** designed `not-found` and `error` pages in Hebrew, with links to home, next trip and contact.
- **Acceptance:** correct status codes. axe is clean.
- **Depends on:** T22

## Stage 5: Verification (gate G3)

### T37 Accessibility, RTL, responsive, performance and SEO audit
- **Owner:** QA
- **Output:** `docs/reviews/YYYY-MM-DD-qa-phase-a.md` (axe on every route, manual keyboard and screen-reader pass, 360/768/1280 widths, Lighthouse mobile per template, sitemap/robots/noindex checks, security headers, draft-leak checks).
- **Acceptance:** no Critical or High findings left open.
- **Depends on:** T34–T36

### T38 Navigation and design reviews
- **Owner:** UX and UI (read-only, in parallel)
- **Output:** `docs/reviews/YYYY-MM-DD-ux-navigation-phase-a.md`, `docs/reviews/YYYY-MM-DD-design-phase-a.md`
- **Acceptance:** High-impact findings fixed by FE in follow-up tasks.
- **Depends on:** T34–T36

### T39 Phase A gate review
- **Owner:** PR
- **Output:** `docs/reviews/YYYY-MM-DD-phase-a-gate.md`
- **Acceptance:** verdict "ready for approval". Coverage of all [מאושר] items is complete. No invented content. No production deploy.
- **Depends on:** T37, T38 and their fixes

---

## Parallelism and ordering summary

```
G1 ─ T01 → T02 → T03 → T07 → (T08, T09, T10) → T11 → T12 → (T13, T14) → T15 → T16 → T17 → T18
      └→ T04 → T05          T06 (after T01 + D4/D5) ─┘
G2 ─ T20 → T21 → T22 → (T23 → T24, T25) · T26 · T27 · T36
            └→ T28 → T29 → T30 → T31 → T32 → T33 → T34 · T35
G3 ─ T37 + T38 (parallel, read-only) → fixes → T39
```

Only one FE task runs at a time, so the branches above show dependency, not concurrency. The UI agent can write `DESIGN-SYSTEM.md` while FE works through Stage 1, because they write different files.
