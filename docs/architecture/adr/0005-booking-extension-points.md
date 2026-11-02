# ADR-0005: Booking, payments, invoices, roles and courses: extension points

- **Status:** proposed
- **Date:** 2026-11-02
- **Decided by:** — (awaiting owner)

## Context
The booking system, payments, invoices, room assignment, participant accounts and paid courses are **out of scope** for Phase A (CLAUDE.md) and need not work at launch. The skeleton must still let them be added without rewriting pages. Several related product points are **not approved**: refund policy, passport collection, automatic invoices, no participant limit / manual sold-out switch, same-room placement (a room-sharing request is never a guaranteed assignment), trip audience types, and the room-assignment method. Nothing here may implement them.

## Options considered
1. **Build nothing now; design booking from scratch later.** Risk: pages, trip data and roles get restructured later.
2. **Build booking scaffolding now** (tables, routes, provider SDKs). Violates Phase A scope and bakes in unapproved decisions.
3. **Design the seams now, build only neutral pieces** (recommended): a single trip record, a registration-mode setting, reserved routes, extensible roles, rules for sensitive data, and provider interfaces on paper.

## Decision
**Proposed:** option 3.

| Extension point | Built in Phase A | Designed for later (not built) |
| --- | --- | --- |
| **Trips as the single record** | `Trips` with content fields only | Booking adds `Bookings`, `Participants`, `RoomTypes`, `RoomRequests`, `Payments`, `Invoices`, all referencing `Trips.id`. Candidate trip fields, each added only once approved: `capacity`/`availability` or a manual `soldOut` flag; `roomTypes` (capacity, count); structured `flights`; `audience`; numeric `pricePerParticipant` (+ currency) |
| **Registration "mode"** | Shared `registration` field group on Trips, Events and the CTA block, plus one `RegistrationButton` component. `mode`: `none` (default), `form`, `whatsapp`, `external` | `onsite` value reserved and disabled in admin. When enabled, the button links to `/next-trip/register` (or `/register/[trip]`). Switching is a setting change, not a page change. The interim mode is owner decision D7 |
| **Reserved routes** | `src/config/reserved-routes.ts`; all return 404; CMS slug validation blocks collisions | `/next-trip/register`, `/account`, `/api/booking/*`, `/api/webhooks/payments/[provider]` |
| **Roles** | `Users.roles[]` = `admin`, `editor`; access helpers in `src/cms/access/` | `bookingManager`, `finance`, `viewer`; later participants as a **separate** auth collection (`Customers`), never mixed with admin Users. Guest checkout requires no account |
| **Sensitive data** | Nothing collected | If passport collection is approved: a separate store (separate Postgres schema or database). Application-level AES-256-GCM with the key outside the DB. Access for `admin`/`bookingManager` only. Read audit log. Excluded from REST/API and list views. Retention and deletion schedule. Privacy review under Israel's Privacy Protection Law (Amendment 13) before build |
| **Payments** | Nothing | `features/booking/payments/PaymentProvider` interface (`createCheckout`, `verifyWebhook`, `getStatus`, `refund`) with one adapter per provider. Candidates to evaluate later: Cardcom, Tranzila, PayPlus, Grow (Meshulam), Hyp. Hosted payment page/iframe only, so no card data on our servers. Webhooks are idempotent and signed |
| **Invoices / receipts** | Nothing | Separate `InvoiceProvider` interface (`issueReceipt`, `issueRefundDocument`). Automatic issuing is not approved |
| **Refunds / cancellation** | Legal page shell only (`/terms`, draft) | Policy logic only after the owner approves a refund policy |
| **Rooms** | Nothing | `RoomRequests` (requested companions) kept separate from any future `RoomAssignments`. A request never implies an assignment. Assignment method is open (OPEN-DECISIONS #8) |
| **Courses** | Lessons with embedded video | Optional `access` (free/paid/members) on Lessons and enrolment via `Customers` + PaymentProvider. Only if the owner decides on paid courses |

Code location: `src/features/booking/` contains only a README in Phase A. Pages connect to future features only through blocks and the `registration` field, never by importing provider code.

## Consequences
- Easier: booking can be planned as an additive module. No page or URL changes. Roles extend in place.
- Harder: a few placeholders (`onsite` mode, reserved routes) must be maintained and tested as 404s.
- Risk avoided: no unapproved product rule (sold-out, refunds, passports, invoices, same-room) is encoded in Phase A.
- Each designed item needs its own ADR and owner approval when the booking phase starts.
