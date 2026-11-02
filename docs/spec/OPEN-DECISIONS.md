# Open decisions

Nothing listed here may be implemented as if it were decided. When the owner decides, move the item into SPEC.md and record it in CHANGELOG.md.

"In principle" means the owner accepted the direction on 2026-11-02 but has not given final approval; work may be planned around it, and the final confirmation is still required.

## Phase A (skeleton)

| # | Question | Status | Blocks | Raised |
| --- | --- | --- | --- | --- |
| 0 | Visual direction for the Premium phase: A אור השחר / B ספיר ולילה / C בית חם (or a combination) | Open — deferred to phase 2; phase 1 uses a basic, clean look built from the existing brand colours | Phase 2 design | 2026-11-02 |
| 1 | Technology and CMS: Next.js + Payload CMS + PostgreSQL | **Approved 2026-11-02** (Next.js 16.4.x + Payload 3.92.x, verified compatible) | — | 2026-11-02 |
| 2 | URL slugs: English URLs with Hebrew page names, route map as in ADR-0003 | **Approved 2026-11-02** | — | 2026-11-02 |
| 3 | Menu structure: 3 groups (מסעות / פעילויות / לימוד והתחזקות) + 2 direct links (מי אנחנו, יצירת קשר) | **Approved 2026-11-02** (group labels as proposed in the UX review; tab names unchanged) | — | 2026-11-02 |
| 4 | Where the registration button leads before the booking system exists (form / WhatsApp / external payment link). Until decided: no active registration button | Open | המסע הקרוב page | 2026-11-02 |
| 5 | Where contact-form submissions go (email / WhatsApp / both, and to whom) | Open | יצירת קשר page | 2026-11-02 |
| 6 | Official logo version (blue/turquoise or gold) and the original logo file | Open | Header | 2026-11-02 |
| 7 | Hosting and who maintains the site after launch | Open | Preview environment | 2026-11-02 |
| 9 | What /next-trip shows when a trip is sold out or no trip is open | Open | המסע הקרוב page | 2026-11-02 |
| 10 | Which WhatsApp number the WhatsApp buttons use; links to the WhatsApp group, Instagram and TikTok | Open | Header, footer, community block | 2026-11-02 |
| 11 | How the weekly parasha is published (YouTube video / file / text) | Open | פרשת השבוע page | 2026-11-02 |
| 12 | Home page section order (UX review suggests "מי אנחנו" before the tab cards) and use of the flyer headline in the hero | Open | Home page | 2026-11-02 |
| 13 | Who writes the legal texts (terms + cancellation, privacy, accessibility statement) | Open | Publishing legal pages and any public form | 2026-11-02 |
| 14 | Permanent project location | **Decided 2026-11-02:** private GitHub repository + local folder on the owner's Mac (setup pending) | Any code | 2026-11-02 |

## Later phases (mentioned, not approved — do not implement)

| # | Question | Status | Raised |
| --- | --- | --- | --- |
| 8 | Room-assignment method; a room-sharing request is never a guaranteed assignment | Open | brief |
| 15 | Refund policy (mentioned: full refund up to two weeks before the flight) | Mentioned in conversation, not approved | 2026-11-02 |
| 16 | Collecting passport details for flights | Mentioned in conversation, not approved | 2026-11-02 |
| 17 | Automatic receipts/invoices | Mentioned in conversation, not approved | 2026-11-02 |
| 18 | No participant limit / no waiting list, with a manual "sold out" switch | Mentioned in conversation, not approved | 2026-11-02 |
| 19 | Placing all participants of one booking in the same room | Mentioned in conversation, not approved | 2026-11-02 |
| 20 | Trip audience (women, men, couples, families) | Appears on the owner's flyers, not approved as a requirement | 2026-11-02 |
