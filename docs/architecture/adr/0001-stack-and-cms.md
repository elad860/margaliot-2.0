# ADR-0001: Technology stack and CMS

- **Status:** approved (2026-11-02)
- **Date:** 2026-11-02
- **Decided by:** owner, 2026-11-02

## Context
Phase A needs a Hebrew RTL multi-page site: home, the 11 fixed tabs and 3 legal pages. It must have a premium custom design, a CMS a non-technical owner can use with draft/publish and preview, and multiple admins with roles. Later it must grow booking (several participants per booking, guest checkout), payments, invoices, room requests and possibly paid courses, without rewriting pages (CLAUDE.md; draft spec V1.1, section "טכנולוגיות וניהול תוכן", marked [המלצה]/[פתוח]). The team is small, and who maintains the site after launch is still open (OPEN-DECISIONS #7).

## Options considered
1. **Next.js 16 + Payload CMS 3 + PostgreSQL** (recommended)
   - Pros: one codebase for site, admin and database. Built-in users, roles, access control, drafts/versions and live preview. Open source (MIT), so no licence fees. Postgres is a natural base for booking. Hebrew admin translations exist. Full design freedom.
   - Cons: needs Node hosting + Postgres + media storage. Monthly Next.js security releases and Payload updates need a developer. The admin UI is plainer than Sanity's. No first-party 2FA. Fewer local freelancers know it than know WordPress.
2. **Next.js + Sanity**
   - Pros: best editing experience. Content hosting is managed. A free tier probably covers Phase A.
   - Cons: booking later needs its own database and auth next to Sanity (two systems, two permission models). Content lives in a vendor cloud. Per-seat costs grow with editors.
3. **WordPress (custom theme, or headless with Next.js)**
   - Pros: familiar, Hebrew admin, many Israeli developers, cheap hosting.
   - Cons: security and speed depend on plugins. The custom booking model (participants, passports, rooms) would be fragile custom plugin work. Premium custom design is possible but against the grain. Headless WordPress doubles the stack.
4. **Wix / Webflow**: rejected. Too limited for the future booking model, and locks the site to the platform.

## Decision
**Proposed:** option 1. Versions verified 2026-11-02:
- `next` 16.4.x (with the 2026-11-03 security release), `react` 19.3.x
- `payload` / `@payloadcms/*` 3.92.x, all on the same version
- `@payloadcms/db-postgres`, PostgreSQL 17
- `tailwindcss` 4.3.x, TypeScript strict
- Node 24 LTS (≥ 24.22.1), pnpm 10

Plugins: `plugin-seo`, `plugin-form-builder`, `storage-vercel-blob`, `live-preview-react`. `email-resend` is added after the form-destination decision. Hebrew dates use built-in `Intl` (no dependency). Fonts use `next/font`. Tests use Vitest, Playwright, `@axe-core/playwright` and Lighthouse CI. Full table: ARCHITECTURE-PROPOSAL §3.

## Consequences
- Easier: one login and role system for editors now and booking managers later. Booking adds collections and a `features/booking` module that reference the existing `Trips` collection.
- Harder: requires a maintainer comfortable with Next.js/Payload, about 2–4 hours a month for updates. If no such maintainer exists (D3), revisit option 2 for Phase A, accepting a second system at the booking phase.
- Payload and Next.js majors must be upgraded together. Payload's peer range (`next >=16.3.3 <17`) limits Next upgrades until Payload supports the next major.
- 2FA for admins needs a separate decision (DECISIONS-NEEDED D13).
