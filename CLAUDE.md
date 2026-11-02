# Margaliot 2.0 (מרגליות 2.0) — Project Instructions

Website and future booking platform for Margaliot ("מרגליות — קהילה שהיא בית"): trips to Uman and kivrei tzadikim, consultation, courses, classes and community activity, led by Vered and Rami Sharabi.

## Current phase: Phase A — architecture and site skeleton

Goal: a high-quality, extensible skeleton: home page, all 11 tabs as separate pages with their own URLs, navigation (desktop + mobile), shared Header/Footer, reusable content blocks, content-management foundations, and preparation for future bookings/payments.

**In scope now:** architecture, routes, navigation, layout, shared components, content model, RTL, accessibility/SEO/performance/security foundations.
**Out of scope now:** page content, deep per-tab specification, booking system, payments, room assignment, user accounts, courses platform.

## Design quality is a core requirement

Margaliot 2.0 must look and feel premium from the first version — not a generic template and not a technical skeleton to be re-skinned later. Architecture and design are planned together:
- **Two design phases (owner decision, 2026-11-02):**
  - **Phase 1 (now):** build the full functional skeleton with a basic, clean, high-quality look derived from the existing brand colours (navy/turquoise/gold) — restrained and neutral, not one of the three proposed directions.
  - **Phase 2 (later):** full Premium upgrade with `frontend-design` and `senior-ui-design-architect`, from the owner's guidelines and inspiration images — layouts, components and motion, not only colours and fonts.
  - Phase 1 must therefore keep content, logic and design fully separate (tokens, layout/variant layer, motion module) so Phase 2 does not rewrite the system, and must ship visual-regression and functional tests that catch breakage.
- One shared Design System (tokens + components + page templates) is used by all pages. Within it, each template and later each tab gets its own fitting character — never 11 identical generic pages.
- Colours and fonts are grounded in the existing Margaliot brand (logo: Star of David with a diamond, "קהילה שהיא בית"; blue/turquoise and gold palettes), never arbitrary.
- Inspiration sites are for content ideas only; their designs are never copied.
- Motion is precise and restrained, and respects `prefers-reduced-motion`.
- Visual quality is reviewed after implementation, not only code correctness.

### Required tool: the `frontend-design` skill

Anthropic's official `frontend-design` skill is a required part of every UI design and UI implementation task in this project.

- **When:** before designing a visual direction, a component, a page template or a layout, and before implementing any UI. Not needed for docs-only, data-model or infrastructure tasks.
- **Who:** `senior-ui-design-architect` and `frontend-engineer` load it themselves (both list it in their agent configuration). If an agent cannot invoke the skill directly, the main Claude session invokes `frontend-design` first and passes its guidance to the agent together with the task.
- **Precedence:** `frontend-design` raises the craft (typography, composition, distinctive non-template look). It never overrides this project's rules. When they conflict, this order wins: (1) the approved spec, (2) the approved Margaliot brand and Design System — colours and fonts come from the existing logo and brand, never from a fresh palette the skill suggests, (3) accessibility (IS 5568 / WCAG AA) and RTL requirements, (4) the 11 fixed tab names and the no-invented-content rule. No marketing or spiritual copy is generated because the skill asks for "real content"; use the owner's text or marked placeholders.
- **Install in local Claude Code** (it is not part of this repository):
  - Plugin (recommended): `/plugin install frontend-design@claude-plugins-official`, then check with `/plugin`; in an open session run `/reload-plugins`.
  - Or as a standalone skill: copy the `frontend-design` folder from the `anthropics/skills` repository into `~/.claude/skills/` (all projects) or `.claude/skills/` (this project).

## Source of truth

The approved specification is the only source of truth. If code, a prompt, or an agent disagrees with it, the spec wins. If the spec is silent or ambiguous, stop and ask; do not decide on the owner's behalf.

```
docs/
  spec/
    SPEC.md              ← approved spec (version + approval date in its header)
    CHANGELOG.md         ← every approved change: date, version, what changed, who approved
    OPEN-DECISIONS.md    ← open questions; nothing here may be implemented as if decided
  architecture/
    adr/                 ← Architecture Decision Records, one file per decision
      0000-template.md
  design/
    directions/          ← the visual directions proposed to the owner
    DESIGN-SYSTEM.md     ← approved tokens, components, templates (once approved)
  reviews/               ← QA, UX and review reports, one per run: YYYY-MM-DD-<agent>-<topic>.md
```

Rules for the spec:
- The spec is drafted and discussed with the owner (currently in a Claude Doc). Only an **approved** version is copied into `docs/spec/SPEC.md`, with its version number and approval date.
- Agents never edit `SPEC.md` themselves. They propose changes in a review report; the owner approves; then the spec and CHANGELOG are updated together.
- Every requirement in the spec is marked **[מאושר]** (approved), **[המלצה]** (recommendation, not yet approved) or **[פתוח]** (open). Only [מאושר] items are binding. Never treat a recommendation as a decision.

## The 11 tabs — names are fixed

Use these names exactly, in this order. Do not rename, merge, remove or add tabs without explicit owner approval.

1. מי אנחנו
2. פגישת ייעוץ
3. המסע הקרוב
4. מסעות לאומן
5. קברי צדיקים בארץ
6. ערבי נשים
7. תקשור בציבור
8. קורס הארת הכלים
9. פרשת השבוע
10. שיעורי התחזקות אונליין
11. יצירת קשר

Plus a home page and legal pages (terms + cancellation policy, privacy policy, accessibility statement). URL slugs are defined in the spec; until approved they are a recommendation.

## Product decisions — status matters

Nothing below is binding until it appears as [מאושר] in an approved `docs/spec/SPEC.md`. Do not implement any of it in Phase A.

**From the original project brief (owner's decisions):**
- Main activity: trips to Uman. Full packages (flights, lodging, transfers), fixed flights per trip, one price per participant.
- Full payment on the website at registration. Several participants per booking. Guest checkout (no account required).
- Rooms of different capacities. Participants may *request* to share a room with specific people — a request is not a guaranteed assignment. Room-assignment method is still open.
- Multiple admins with different roles and permissions.
- Community: content published by the team; update channels are the website and WhatsApp; no internal social network in the first stage.
- Instagram and TikTok must be clearly accessible. Links will be supplied later — never invent links or content.

**Mentioned by the owner in conversation (2026-11-02) but NOT formally approved — treat as open until the approved spec says otherwise:**
- Refund policy (full refund up to two weeks before the flight).
- Collecting passport details for flights.
- Automatic receipts/invoices.
- No participant limit / no waiting list, with a manual "sold out" switch.
- Placing all participants of one booking in the same room (a request, not a guarantee).
- Trips are for women, men, couples and families (appears on the owner's flyers).

## Working rules for every agent and session

1. Follow the approved spec. Do not invent page content, trips, prices, images, testimonials, links or contact details. Use clearly marked placeholders.
2. Do not change the 11 tab names or any product decision.
3. Do not start payments, booking, room assignment or other advanced features.
4. Do not touch the old site (margaliotdotnet.wordpress.com) or the live domain, and never deploy to production, without explicit owner approval.
5. Pages that are not ready stay in draft/dev only — never published as empty public pages, never in the public navigation, `noindex`.
6. Prefer simple, readable, testable, extensible solutions. No new dependency without a reason written in the PR or an ADR.
7. Record every significant architectural decision as an ADR in `docs/architecture/adr/`.
8. **One writer at a time:** never run two agents that write to the same files in parallel. Read-only agents (review, QA, UX) may run in parallel with each other.
9. Hebrew-first, full RTL. Use logical CSS properties (start/end), not left/right. Mobile-first.
10. Accessibility target: Israeli standard IS 5568 (WCAG 2.x AA).
11. Every UI design or UI implementation task starts with the `frontend-design` skill (see "Required tool" above); its suggestions never override the spec, brand, accessibility or RTL rules.

## Agents and when they run

| Agent | Writes code? | Runs when |
| --- | --- | --- |
| `system-architect` | No (docs/ADRs only) | Before building anything structural; when a change touches routes, data model, CMS or integrations |
| `senior-ui-design-architect` | No production UI (design docs and prototypes only) | Before any UI is built (directions, Design System); when a new component or template is designed; design review after each UI task |
| `ux-navigation-specialist` | No (reports only) | Reviewing sitemap and navigation before build; reviewing the built navigation on desktop and mobile |
| `frontend-engineer` | Yes | Only after the architecture is approved; implements one approved task at a time |
| `quality-accessibility-engineer` | No (reports and test files only) | After each implementation task; before every phase gate |
| `project-reviewer` | No (reports only) | At the end of a task batch and before asking the owner to approve a phase |

Standard flow for a task: system-architect + senior-ui-design-architect (plan, ADR, component design — UI work starts with `frontend-design`) → owner approval → frontend-engineer (build to the approved design) → quality-accessibility-engineer + ux-navigation-specialist + senior-ui-design-architect design review (read-only, may run in parallel) → frontend-engineer (fixes) → project-reviewer (gate report) → owner approval.

## Commands

- Install: `pnpm install` (Node >= 22.23.4, pnpm 10)
- Database (local): `pnpm db:up` (Docker Postgres 17), then `pnpm migrate`, then `pnpm seed` (creates the 15 system pages as drafts; never seeds users)
- Dev: `pnpm dev` — site on `/`, CMS on `/admin` (first visit creates the first admin)
- New migration: `pnpm migrate:create <name>`
- Lint: `pnpm lint` (includes logical-CSS and no-colour-literal checks)
- Typecheck: `pnpm typecheck`
- Tests: `pnpm test`; integration: `pnpm test:int` (needs `DATABASE_URL_TEST`, a throwaway database wiped on each run)
- Build: `pnpm build`
- Secret scan before every push: `pnpm check:secrets`
