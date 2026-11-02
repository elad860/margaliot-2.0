# Margaliot 2.0 (מרגליות 2.0)

Website and CMS skeleton (Phase A). Project rules: [`CLAUDE.md`](CLAUDE.md). Architecture: [`docs/architecture/`](docs/architecture/).

Stack (ADR-0001, approved 2026-11-02): Next.js 16.4 (App Router) + Payload CMS 3.92 + PostgreSQL 17, TypeScript strict, pnpm 10.

## Requirements

- **Node.js ≥ 22.23.4** (`.nvmrc` = 22). Payload 3.92 requires `^22.23.4 || >=24.22.1`; Node 24 LTS also works. The skeleton was built and tested on Node 22.23 because that is what the build container provides.
- pnpm 10 (`corepack enable`)

## Commands

| Task                        | Command                                                                        |
| --------------------------- | ------------------------------------------------------------------------------ |
| Install                     | `pnpm install`                                                                 |
| Dev server                  | `pnpm dev` → site at http://localhost:3000, CMS at http://localhost:3000/admin |
| Lint                        | `pnpm lint` (ESLint + logical-CSS check)                                       |
| Logical-CSS check only      | `pnpm lint:css`                                                                |
| Token check only            | `pnpm lint:tokens`                                                             |
| Typecheck                   | `pnpm typecheck`                                                               |
| Format                      | `pnpm format` / `pnpm format:check`                                            |
| Unit tests (Vitest)         | `pnpm test` (watch: `pnpm test:watch`)                                         |
| Integration tests (DB)      | `pnpm test:int` (needs `DATABASE_URL_TEST`, a disposable database)             |
| E2E + accessibility tests   | `pnpm test:e2e` (needs `DATABASE_URL_E2E`, a disposable database; see below)   |
| Build                       | `pnpm build` (needs a migrated database: pages are statically generated)       |
| Generate Payload types      | `pnpm generate:types`                                                          |
| Regenerate admin import map | `pnpm generate:importmap`                                                      |
| Secret scan                 | `pnpm check:secrets`                                                           |

## Environment

Copy `.env.example` to `.env` (git-ignored) and fill it in. `src/lib/env.ts` validates the variables when the dev server, build or Payload CLI starts, and stops with a list of what is missing.

| Variable                | Required                   | Notes                                                                          |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`          | always                     | PostgreSQL connection string                                                   |
| `PAYLOAD_SECRET`        | always                     | ≥ 32 characters (`openssl rand -hex 32`)                                       |
| `SITE_ENV`              | no (default `development`) | `development` / `preview` / `production`; anything but `production` is noindex |
| `NEXT_PUBLIC_SITE_URL`  | preview/production         | defaults to `http://localhost:3000` in development                             |
| `BLOB_READ_WRITE_TOKEN` | preview/production         | Vercel Blob media storage; local disk in development                           |
| `PREVIEW_SECRET`        | preview/production         | ≥ 32 characters; draft-preview route (T12)                                     |

Never commit `.env` files or secrets. Run `pnpm check:secrets` before pushing.

## Local database and migrations

PostgreSQL 17 runs in Docker (`docker-compose.yml`).

Fresh clone:

```bash
pnpm install
cp .env.example .env        # set DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/margaliot and PAYLOAD_SECRET
pnpm db:up                  # start Postgres 17
pnpm migrate                # apply committed migrations
pnpm seed                   # create the 15 system pages as drafts
pnpm dev                    # then open /admin and create the first admin user
```

| Task                                     | Command                       |
| ---------------------------------------- | ----------------------------- |
| Start / stop Postgres                    | `pnpm db:up` / `pnpm db:down` |
| Apply migrations                         | `pnpm migrate`                |
| Migration status                         | `pnpm migrate:status`         |
| Create a migration after a schema change | `pnpm migrate:create <name>`  |
| Regenerate `src/payload-types.ts`        | `pnpm generate:types`         |

**Push vs. migrations.** With `SITE_ENV=development`, Payload "pushes" schema changes straight into your local database while you work, so you do not need a migration for every experiment. Preview and production **never** push: their schema changes only through migrations in `src/migrations/`, committed with the code. Workflow for a schema change: edit the collection → `pnpm migrate:create <name>` → `pnpm generate:types` → commit both. Set `PAYLOAD_DB_PUSH=false` to work locally exactly like preview (migrations only); this avoids Payload's prompt when you run `pnpm migrate` against a database that was previously pushed.

**The build reads the database.** Pages, the sitemap and child routes are statically generated at build time from published content and revalidated on every publish. `pnpm build` therefore needs a reachable, migrated database, and the server must run against the same database the build used.

## End-to-end tests

`pnpm test:e2e` runs Playwright with `@axe-core/playwright` (WCAG 2.x A/AA rules) against a production build:

1. `scripts/e2e.mjs` wipes `DATABASE_URL_E2E`, applies migrations, seeds the 15 draft pages, builds and starts the server on port 3200.
2. `tests/e2e/site.spec.ts` checks, in order: every route is 404 while draft; reserved and unknown routes are 404; publishing some pages shows exactly those in the menu, footer and sitemap (draft-leak checks); editor preview shows drafts with `noindex`/`no-store` and a stale draft cookie reveals nothing; with everything published every route is 200 with one h1 and no axe violations; the trip child route, `/next-trip` and the canonical rule; security headers; the admin page editor.

The tests use the Chromium that matches `@playwright/test` (install it with `pnpm exec playwright install chromium` if you do not have it). CI (`.github/workflows/ci.yml`) runs lint, format check, typecheck, secret scan, unit, integration, build and e2e on every push and pull request, with throwaway secrets generated per run. It never deploys.

## CMS admin accounts

- There are **no default accounts or passwords**. On a fresh database, open `/admin`: Payload shows _create first user_. That first account is always an **admin**.
- Admins add further people under _משתמשים_ with the role **admin** (everything, including users) or **editor** (content and media only). Everyone has their own account; never share one.
- Passwords: at least 12 characters, not a common password, not containing the e-mail name. Five wrong attempts lock the account for 15 minutes (an admin can unlock it).
- The admin is Hebrew and right-to-left, never indexed, and GraphQL is off. Two-factor login is not built in yet; see `docs/architecture/2fa-evaluation.md`.

## Styling and design tokens

- `src/styles/tokens.css` holds every design value in three layers: **primitives** (`--mg-palette-*`, raw scales), **semantic** roles (`--mg-color-text`, `--mg-space-4`, …) and **character** overrides per template (`[data-character="trip"]`). Phase 1 values are labelled placeholders derived from the brand colours; the Phase 2 Design System replaces the primitive values without touching components.
- `src/styles/theme.css` is the stylesheet entry: Tailwind 4 + tokens + `base.css`, with `@theme inline` mapping Tailwind utilities onto the tokens (`bg-surface`, `text-accent`, `text-h2`, `rounded-card`, `ps-4`, `tap-target`, `duration-base`). Tailwind's default palette, sizes, radii and shadows are disabled.
- Rules enforced by `pnpm lint`: logical properties only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`, never left/right) and no colour literals or hard-coded sizes outside `tokens.css`.

## Site map

`src/config/site-map.ts` is the registry of the 15 system pages (home, the 11 tabs, 3 legal pages): exact Hebrew name, order, slug, template, menu group, footer flag. `tests/unit/site-map.test.ts` compares the tab names with `CLAUDE.md` character by character. Reserved routes (future booking/account, system) are in `src/config/reserved-routes.ts`.

## Folder layout

See ARCHITECTURE-PROPOSAL §5. The public site lives in `src/app/(site)` (root layout with `<html lang="he" dir="rtl">`); the CMS admin and REST API live in `src/app/(payload)` (files generated by Payload — do not edit by hand).
