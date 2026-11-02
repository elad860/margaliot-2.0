# ADR-0004: Content model and draft/publish

- **Status:** proposed
- **Date:** 2026-11-02
- **Decided by:** — (awaiting owner)

## Context
Pages must be built from reusable blocks, so content can grow without structural changes. The draft spec proposes 4 templates and 12 blocks, both [המלצה]. Recurring items (trips, dated activities, parashot, lessons, testimonials, team) should appear automatically wherever relevant. Contact details and social links must be stored once and hidden when empty. Unready pages must never be public, in navigation or indexed (CLAUDE.md rule 5). No content may be invented.

## Options considered
1. **Free-form pages only** (every page is a list of blocks, no collections)
   - Simple, but repeated items such as a date added to an activity must be edited on several pages. No base for booking.
2. **Templates + blocks + collections + globals** (recommended)
   - Each fixed page has a template with data-driven regions plus editor-arranged blocks. Recurring items live in collections, site-wide values in globals.
3. **Hard-coded pages with CMS fields per page**
   - Most control, but every content change needs a developer, and the result tends towards 11 rigid pages.

## Decision
**Proposed:** option 2. Field-level detail is in ARCHITECTURE-PROPOSAL §8.

- **Templates:** home, information (about/consultation/contact), trip (next-trip/uman-trips/trip detail), activity-with-dates (tzadikim-israel/womens-evenings/channeling/tools-course), library (parasha/online-classes), legal (terms/privacy/accessibility). Each template has a `character` hook for per-template design accents.
- **Blocks (12):** Hero, TextImage, Cards, TripSummary, EventList, Gallery, Video, Testimonials, FAQ, CTA, Form, Social. Each block keeps its config and its component in the same folder. Each template has an allow-list of blocks.
- **Collections:** Pages (15 seeded system pages: undeletable, title/slug/template locked to the code registry), Trips, Events (`activityType` links a date to one of the 4 activity tabs), Parashot, Lessons, Topics, Testimonials (`consentConfirmed` required to publish), Team, Media (`alt` required), Users (`roles`: admin, editor), plus form-builder Forms/Submissions.
- **Globals:** SiteSettings (contact, socials, default WhatsApp message, `nextTrip`, default SEO image, accessibility coordinator), Navigation (group labels, tab descriptions, header CTA label, extra footer links).
- **Draft/publish:**
  - `versions.drafts` is on for content collections, and new documents start as drafts.
  - `src/lib/cms` is the only data-access layer and reads published content only, unless Next.js `draftMode()` is on. Draft mode is enabled only by an authenticated `/api/preview` (admin/editor).
  - Unpublished pages return 404 publicly and are excluded from navigation, footer, breadcrumbs and sitemap. Every non-production environment is `noindex`.
  - Payload live preview shows drafts in the real template.
- **Seed:** creates the 15 pages as drafts containing only `[תוכן יתווסף]` placeholders and no invented text.

## Consequences
- Easier: adding a date, trip or parasha updates every page that lists it. Publishing a tab puts it in the menu with no code change. Tests can prove drafts do not leak.
- Harder: changing a template's fixed regions needs a developer (on purpose). Editors work inside allow-lists.
- Booking: Trips and Events already carry the shared `registration` field group, so booking extends them (ADR-0005). Fields that depend on open product decisions are not added now.
