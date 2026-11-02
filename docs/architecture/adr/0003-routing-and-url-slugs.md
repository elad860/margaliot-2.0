# ADR-0003: Routing and URL slugs

- **Status:** approved (2026-11-02)
- **Date:** 2026-11-02
- **Decided by:** owner, 2026-11-02

## Context
Each of the 11 fixed tabs, the home page and the 3 legal pages needs its own URL (CLAUDE.md). The draft spec proposes English slugs, marked [פתוח]. Most visitors arrive on mobile from WhatsApp, Instagram and TikTok links. Tab names and order are owner decisions that agents and editors must not change. Child pages (single trip, parasha, lesson) come from the CMS, which the draft marks [המלצה].

## Options considered
1. **English slugs** (`/next-trip`, `/parasha/vayera`)
   - Pros: short, readable links in WhatsApp and SMS. No percent-encoding problems in tools and email clients.
   - Cons: not in the visitor's language. Very small loss of URL keyword relevance.
2. **Hebrew slugs** (`/המסע-הקרוב`)
   - Pros: native language, slight SEO signal.
   - Cons: often shown percent-encoded when shared (`/%D7%94…`), looking long and broken. Occasional encoding bugs.
3. **Registry in code vs. slugs fully in the CMS**
   - Code registry: protects fixed names, order and URLs, and is testable. Changes need a developer.
   - CMS only: flexible, but an editor can rename or delete a fixed tab or break a shared link.

## Decision
**Proposed:** English slugs (option 1), defined in a code registry `src/config/site-map.ts` (option 3, registry).

| Page | Route | Page | Route |
| --- | --- | --- | --- |
| עמוד הבית | `/` | ערבי נשים | `/womens-evenings` |
| מי אנחנו | `/about` | תקשור בציבור | `/channeling` |
| פגישת ייעוץ | `/consultation` | קורס הארת הכלים | `/tools-course` |
| המסע הקרוב | `/next-trip` | פרשת השבוע | `/parasha` |
| מסעות לאומן | `/uman-trips` | שיעורי התחזקות אונליין | `/online-classes` |
| קברי צדיקים בארץ | `/tzadikim-israel` | יצירת קשר | `/contact` |
| תקנון ומדיניות ביטול | `/terms` | מדיניות פרטיות | `/privacy` |
| הצהרת נגישות | `/accessibility` | | |

- **Child routes:** `/uman-trips/[trip]`, `/parasha/[slug]` (transliterated), `/online-classes/[slug]`.
- **Reserved (404 now, see ADR-0005):** `/next-trip/register`, `/account`, `/api/booking/*`, `/api/webhooks/payments/*`.
- **System:** `/admin`, `/api/*` (Payload REST; GraphQL disabled), `/sitemap.xml`, `/robots.txt`.
- **Resolution:** `[slug]` → registry lookup → published `Pages` doc by `systemKey` → template. An unknown slug or an unpublished page returns `notFound()`. Pages are statically generated from the registry and revalidated on CMS change.
- **`/next-trip` (recommendation):** a stable URL showing the trip selected in `SiteSettings.nextTrip`. While a trip is selected, its own `/uman-trips/[trip]` page points its canonical URL at `/next-trip`. With no trip selected, the page shows a designed empty state.
- **CMS slugs** for child items are validated: lowercase Latin, digits and hyphens only, and no collision with registry or reserved routes.

## Consequences
- Easier: stable links for WhatsApp sharing. A unit test guarantees the 11 names, their order and their slugs. Editors cannot break the site map.
- Harder: renaming a slug needs a code change, plus a redirect if the URL was ever public.
- Future: booking routes are reserved now, so no page will take them. Redirects from the old WordPress site are a later, owner-approved task (`@payloadcms/plugin-redirects`).
