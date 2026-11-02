# ADR-0002: Hosting and environments

- **Status:** proposed
- **Date:** 2026-11-02
- **Decided by:** — (awaiting owner; OPEN-DECISIONS #7)

## Context
The stack in ADR-0001 needs Node hosting, managed PostgreSQL and media storage. CLAUDE.md rule 4 forbids touching the old site or the live domain, and forbids any production deploy without explicit owner approval. Rule 5 says unready pages must never be public or indexed. The owner is non-technical, so accounts and ownership must survive a change of maintainer. Visitors are in Israel.

## Options considered
1. **Vercel (app) + Neon Postgres (eu-central-1) + Vercel Blob (media)** (recommended)
   - Pros: first-class Next.js support. Preview deployment per branch with built-in Deployment Protection. No servers to patch. Neon branches give cheap separate staging data and point-in-time restore. Frankfurt region close to Israel.
   - Cons: three vendors to manage (two in practice: Vercel + Neon). Commercial use needs Vercel Pro (~$20/seat/month). Serverless cold starts on admin routes.
   - Approx. cost: $25–45/month at launch (verify at signup).
2. **Railway (app + Postgres + volume in one project)**
   - Pros: one vendor, simple usage-based pricing (~$5–20/month), always-on container (no cold starts), Payload templates exist.
   - Cons: preview environments and access protection are less polished. Image optimisation and CDN need more setup. Smaller company.
3. **VPS (e.g. Hetzner) + Coolify/Docker + self-managed Postgres**
   - Pros: cheapest (~€5–15/month) and full control.
   - Cons: OS patching, backups, TLS and monitoring are on the maintainer. Not suitable for a small non-technical team.

## Decision
**Proposed:** option 1, with these environments:

- **Local dev:** Postgres 17 in Docker or a Neon dev branch. Schema push allowed.
- **Preview/staging:** Vercel preview deployments on `*.vercel.app`. Neon `staging` branch and a separate Blob store. Vercel Authentication protection. `X-Robots-Tag: noindex, nofollow` and `robots.txt` disallow-all whenever `SITE_ENV !== 'production'`. Migrations only.
- **Production:** not created in Phase A. It is created, and the live domain attached, only after explicit owner approval. Migrations only, plus `pg_dump` before each migration.

Further rules:
- Region `fra1` (Frankfurt) for both Vercel and Neon.
- Secrets live only in Vercel env vars and the local `.env`; the repo keeps `.env.example`.
- All accounts (Vercel team, Neon, Blob, email provider, domain) are owned by the owner, with developers invited.

## Consequences
- Easier: safe review links for the owner on every change. Production is impossible to reach by accident (`.claude/settings.json` already denies `vercel --prod`).
- Harder: paid Pro seat. Two vendor dashboards. Migrations must be disciplined.
- Booking phase: Neon Postgres holds booking data. The sensitive-data store (ADR-0005) may be a separate Neon project. Webhooks from payment providers reach Vercel functions.
- Open: who maintains the site after launch (D3). If the owner prefers a single vendor, option 2 is a drop-in alternative with the same code.
