# Owner decisions needed before coding starts

- **Prepared by:** system-architect, 2026-11-02
- **Status:** awaiting owner. Each item has a **recommendation** (not a decision) and the tasks it blocks (see [SKELETON-BUILD-PLAN.md](SKELETON-BUILD-PLAN.md)). Numbers in brackets refer to `docs/spec/OPEN-DECISIONS.md`.

## A. Blocking: nothing can be coded until these are decided

| # | Decision | Recommendation | Blocks |
| --- | --- | --- | --- |
| **D0** | Approve spec V1.1 so it can be copied into `docs/spec/SPEC.md`. Before approving, correct the items the draft marks [מאושר] that are not approved: refund policy, passport collection, automatic invoices, no participant limit / sold-out switch, same-room placement (request ≠ guarantee). Also mark the 3 legal pages and the 4 menu groups with their real status | Approve the structure sections (site map, templates, navigation model, draft rules). Move the five items above to [פתוח] | Everything (gate G1) |
| **D2** [1] | Technology and CMS | Next.js 16 + Payload CMS 3 + PostgreSQL (ADR-0001) | T01 onward |
| **D3** [7] | Hosting, account ownership, and **who maintains the site after launch** | Vercel + Neon (Frankfurt) + Vercel Blob. Accounts owned by you, developers invited. Budget ~$25–45/month plus ~2–4 developer hours/month for updates (ADR-0002). If no developer will maintain it, say so: that changes the D2 recommendation | T18 (preview environment); influences D2 |
| **D4** [2] | URL slugs: English or Hebrew, and the exact list | English, as in ADR-0003 (`/about`, `/consultation`, `/next-trip`, `/uman-trips`, `/tzadikim-israel`, `/womens-evenings`, `/channeling`, `/tools-course`, `/parasha`, `/online-classes`, `/contact`, `/terms`, `/privacy`, `/accessibility`) | T06, T14 |
| **D9** | Content model and draft/publish behaviour, including: tab names, order and URLs locked in code (editors cannot rename them), and pages are drafts until you publish | Approve ADR-0004 | T08–T12 |

## B. Blocking the visual build (gate G2); infrastructure can proceed without them

| # | Decision | Recommendation | Blocks |
| --- | --- | --- | --- |
| **D1** [0] | Visual direction: A אור השחר / B ספיר ולילה / C בית חם, or a combination | No architectural preference. All three fit the token layer. Choose on brand feel; the senior-ui-design-architect then writes the Design System | T20–T36 |
| **D5** [3] | Menu: the 4 group labels and which tabs sit in each | Labels מסעות / פעילויות / תוכן / מרגליות with the grouping in the draft. Tab names unchanged | T06 (grouping), T24 (labels; editable in CMS later) |
| **D6** [6] | Official logo version (blue/turquoise or gold) and the original high-resolution/vector file | Supply an SVG of the official version. The choice may follow D1 | T23 (Header) |

## C. Needed before specific features work; skeleton builds with safe defaults

| # | Decision | Recommendation | Blocks | Default until decided |
| --- | --- | --- | --- | --- |
| **D7** [4] | Where the registration button leads before booking exists | Architecture supports `form`, `whatsapp` or `external`. Choose one; WhatsApp is the lightest and needs no data storage | Live behaviour of the Trip template CTA (T32) | `none`: button hidden, contact CTA shown |
| **D8** [5] | Where contact and lead form submissions go (email / WhatsApp / both, and to whom) | Store in the CMS, plus email notification to an address you choose | Email in T16/T31 | Stored in CMS only, no email |
| **D10** | Approve booking extension points (reserved routes, registration modes, roles, sensitive-data and payment-abstraction rules) | Approve ADR-0005 as a direction. Each booking feature still needs its own decision later | Only the reserved-route list in T06/T14 | Routes reserved as 404 |
| **D11** | Legal pages: confirm the 3 pages, and who writes the texts (terms + cancellation, privacy, accessibility statement with the accessibility coordinator's details) | Keep all 3. Texts from a lawyer or accessibility consultant, not invented. Forms must not go live before the privacy page is published | Publishing (not building) T34; public forms | Pages exist as drafts |
| **D12** | `/next-trip` as a stable URL whose content switches to the next trip | Yes, as in ADR-0003, including the canonical rule and a designed "no trip open" state | T14, T35 | — |
| **D13** | Admin two-factor login | Approve evaluating a community TOTP plugin in T07; meanwhile use strong passwords + login lockout. Must be settled before production | Production readiness (not Phase A build) | Lockout + strong passwords |
| **D14** | Who gets admin accounts, and with which role (`admin` = everything, `editor` = content only) | Owner(s) as `admin`; anyone else editing content as `editor` | T07 seed of real users | Developer-only local accounts |

## D. Not needed for Phase A (recorded so nobody decides them by accident)
Refund/cancellation policy · passport collection · automatic receipts/invoices · participant limit / waiting list / sold-out switch · same-room placement and room-assignment method [8] · trip audience types (women/men/couples/families) · consultation price display · payment for Israel tours · private women's evenings · course structure · Shabbat times on the parasha page · paid or member-only lessons · redirects from the old WordPress site · analytics and cookie consent.

## Summary: the minimum to unlock coding
1. **To start infrastructure (Stage 1):** D0, D2, D3, D4, D9 (+ D5 grouping for T06).
2. **To start any visible UI (Stage 2+):** D1 and the approved Design System, D6, D5 labels.
3. **Before forms or the registration button do anything real:** D7, D8, D11.
