# UX navigation review — sitemap and navigation architecture

- **Date:** 2026-11-02
- **Agent:** ux-navigation-specialist (read-only review)
- **Reviewed:** CLAUDE.md; docs/spec/SPEC.md (placeholder, not approved); docs/spec/OPEN-DECISIONS.md; docs/design/directions/README.md; the working draft "Margaliot 2.0 — Full Website Specification V1.1" (Claude Doc, rev 10, read in full: the sitemap, page goals, shared components, navigation plan, draft pages, SEO and design sections).
- **Not reviewed:** the design canvas itself (only its summary in directions/README.md). There is no built code yet.

## Status note

`docs/spec/SPEC.md` has not been approved, so **nothing in the draft is binding**. That includes items the draft marks [מאושר], such as the header CTA, the footer contents, social links in 4 places, the published-only menu, the stable /next-trip URL and the 4-group menu. Per CLAUDE.md, only the 11 tab names, their order and the rule that unready pages stay draft, off the menu and `noindex` are fixed. Below, "the draft" means the Claude Doc. Every recommendation here is a proposal for the owner. **No tab is renamed, merged, added or removed.**

The draft also marks some things [מאושר] that CLAUDE.md lists as "mentioned but NOT formally approved": the refund policy, passport details, automatic invoices, the manual sold-out switch and room-sharing for one booking. This review does not depend on them, but the project-reviewer should reconcile the two documents before SPEC.md is approved.

## Who this is for

The main case: a first-time visitor on a phone (390px) taps a link in WhatsApp, Instagram or TikTok. They land on a deep page (usually /next-trip, /parasha or a tab), not the home page. They know the people (Vered and Rami) better than the brand name "מרגליות". They want two things: details about the next trip, or a fast way to talk to someone, which is WhatsApp. The secondary case is a returning community member who checks the weekly parasha, an online class or upcoming dates.

---

## Findings, ordered by impact

### F1. /next-trip has no defined state for when no trip is open, so shared links can break
- **Location:** draft › המסע הקרוב ("the address stays fixed and the content changes to the next trip"), and draft › pages not yet published (the menu shows published pages only).
- **Problem:** The whole WhatsApp and Instagram strategy depends on /next-trip always working. The draft never says what happens between trips, when the trip is sold out, or after it has left. If an admin unpublishes or empties the page, the published-only rule removes it from the menu and the header CTA. Then every link already shared in WhatsApp groups gives a 404, and the site loses its main action without warning.
- **Recommendation:** Treat /next-trip as a permanent route that is never a draft, with three defined states:
  1. **Open:** the current trip with a registration CTA.
  2. **Sold out:** the trip details stay, and the CTA changes (for example to WhatsApp, "updates about the next trip").
  3. **No trip announced:** a short "the next trip will be published soon" state with a WhatsApp CTA and links to מסעות לאומן and past trips.

  The header CTA and the sticky bar follow the same state. Each trip also gets its own permanent URL (/uman-trips/<trip>). /next-trip shows the current trip with a `canonical` link to that URL, so nothing is duplicated for SEO. A link to one specific trip can then be shared too.
- **Needs owner decision:** **Yes.** The owner chooses the wording and the CTA for the sold-out and no-trip states. This is related to open decision #4.

### F2. On mobile there are three persistent elements: sticky header CTA, sticky bottom bar and floating WhatsApp
- **Location:** draft › frame components (floating WhatsApp button, fixed bottom bar on mobile) and draft › on mobile (header with a "למסע" button).
- **Problem:** On a 390×844 screen, the floating WhatsApp button sits on top of the bottom bar or just above it. Together they cover content and the start of the footer, and they compete for the thumb. They also clash with the iOS home indicator, a cookie notice and the accessibility widget that Israeli sites often add, which would be a fourth floating item. Three "do this now" items at once weaken the main action.
- **Recommendation:** On mobile, **merge the floating WhatsApp button into the bottom bar**:
  - One bar shows the page's primary CTA as a wide button, plus a square WhatsApp icon button (at least 48px, with accessible name "וואטסאפ").
  - The bar has no separate floating button on mobile. It respects `env(safe-area-inset-bottom)`, the page gets matching bottom padding so the footer is never covered, and the bar hides while the on-screen keyboard is open or while a form's submit button is in view.
  - On desktop, a floating WhatsApp button is fine. Put it in the bottom end corner (left in RTL), away from wherever the accessibility widget goes.
  - The pre-filled WhatsApp message per page (from the draft) stays.
- **Needs owner decision:** **Yes.** This changes the components listed in the draft, though the content stays the same.

### F3. The group labels "מרגליות" and "תוכן" will not be clear to a first-time visitor
- **Location:** draft › navigation plan (the 4-group table) and OPEN-DECISIONS #3.
- **Problem:** I tested each placement as a first-time mobile visitor. Group labels may change; tab names may not.

  | Tab | Draft group | First-time visitor test | Verdict |
  | --- | --- | --- | --- |
  | המסע הקרוב | מסעות | Expected there. It is also the CTA | OK |
  | מסעות לאומן | מסעות | Expected | OK |
  | קברי צדיקים בארץ | מסעות | Mostly expected. Some people will read "מסעות" as Uman only. It is really a dated tour in Israel (it uses the "activity with dates" template) | Ambiguous, but acceptable |
  | פגישת ייעוץ | פעילויות | A personal one-to-one service, not a group activity with dates. People who look for "consultation" will not open "פעילויות" first | **Ambiguous** |
  | ערבי נשים | פעילויות | Expected | OK |
  | תקשור בציבור | פעילויות | Expected (a public evening with dates) | OK |
  | קורס הארת הכלים | פעילויות | A course is learning. It sits as well with the online classes as with the evenings | Ambiguous |
  | פרשת השבוע | תוכן | "תוכן" is a word from a content-management system, not one a visitor uses. Nobody looks for the parasha under "content" | **Unclear label** |
  | שיעורי התחזקות אונליין | תוכן | Same problem | **Unclear label** |
  | מי אנחנו | מרגליות | The brand name as a menu label does not say "about". The logo already says מרגליות. People look for "who we are" as a top-level item | **Unclear label** |
  | יצירת קשר | מרגליות | Contact is almost always a top-level link or a header button. Putting it in a dropdown under the brand name hides it | **Hidden** |

- **Recommendation (owner chooses one):**
  - **Option A (recommended): 3 dropdowns + 2 direct links.**
    - **מסעות** ▾: המסע הקרוב, מסעות לאומן, קברי צדיקים בארץ
    - **פעילויות** ▾: פגישת ייעוץ, ערבי נשים, תקשור בציבור, קורס הארת הכלים
    - **לימוד והתחזקות** ▾: פרשת השבוע, שיעורי התחזקות אונליין
    - **מי אנחנו** and **יצירת קשר** as direct links (no "מרגליות" group).

    Possible label tweaks: "פעילויות וליווי" makes פגישת ייעוץ fit; "מסעות וסיורים" makes קברי צדיקים בארץ clear.
  - **Option B:** Same as A, but קורס הארת הכלים moves to the learning group, which could be called "לימוד וקורסים". פעילויות then holds the evenings and פגישת ייעוץ.
  - **Option C:** Keep the draft's 4 groups but rename "תוכן" to "לימוד והתחזקות" and "מרגליות" to "עלינו". This is the smallest change, but contact stays hidden.

  In every option, the menu, footer and mobile menu use the same groups and the same order, so visitors learn one model.
- **Needs owner decision:** **Yes** (OPEN-DECISIONS #3).

### F4. Draft-page leakage goes beyond the menu
- **Location:** draft › pages not yet published, home page (a card for each tab), footer (all tabs), breadcrumbs, contact form (subject list of activities), sitemap.xml.
- **Problem:** The draft filters the *menu* by published status. Phase A builds all 11 pages and keeps them as drafts until there is content, so at launch some tabs will be unpublished. They can still leak through other places: home-page cards, footer columns, the contact form's subject list, "related" CTAs, breadcrumbs, sitemap.xml and internal links typed into content. Empty groups are a second problem. A group with 0 published tabs would show an empty dropdown, and a group with 1 tab is a pointless extra click.
- **Recommendation:** Build one navigation source (the CMS Navigation global, filtered by published status) and use it for the header, mobile menu, footer, home cards, contact-form subjects and sitemap.xml. Rules:
  - A group with 0 published tabs is hidden.
  - A group with 1 published tab is shown as a direct link to that tab, without a dropdown.
  - A draft URL returns a real 404 to the public, with `noindex`, and is never listed in sitemap.xml.
  - A rich-text link to a draft page is flagged in the admin.
  - The QA agent should test every surface while some tabs are still drafts.
- **Needs owner decision:** No. This follows CLAUDE.md rule 5.

### F5. Getting to the next trip in one tap from anywhere: covered, but the labels and self-links need rules
- **Location:** draft › header ("כפתור 'למסע הקרוב' בולט"), mobile header ("כפתור 'למסע'"), and the bottom bar ("קריאה לפעולה אחת, לפי העמוד").
- **Problem:**
  - The mobile header CTA is enough for one tap, but the label "למסע" is vague. Which trip?
  - On pages whose own CTA is something else (פגישת ייעוץ → request a meeting), the bar does not lead to the trip, so the header button must stay visible. That means the mobile header has to be sticky, or reappear when the visitor scrolls up.
  - On /next-trip itself, the header CTA links to the page the visitor is already on.
- **Recommendation:**
  - Mobile header CTA label: "המסע הקרוב", the tab's own name, so it matches the menu. Desktop: "למסע הקרוב", as in the draft.
  - Use a compact sticky header on mobile (about 56px) with a reduced-motion-safe shrink, so the trip is always one tap away.
  - On /next-trip, the header CTA and the bar become "להרשמה" and scroll to the registration block. Mark the menu item with `aria-current="page"`.
  - On pages with no specific action (home, מסעות לאומן, מי אנחנו, the legal pages), the bar's default CTA is the next trip.
  - The labels follow the F1 states (open, sold out, none).
- **Needs owner decision:** Yes, for the CTA wording only. The behaviour needs no decision.

### F6. Desktop header: too many items for 1024px. Use disclosure buttons, not hover menus or a menubar
- **Location:** draft › on desktop: from right to left, logo, 4 groups, social icons, prominent CTA; hover or click opens a dropdown; each tab gets a short description line; Esc closes.
- **Problem:**
  - Hebrew labels are long. At the 1024 breakpoint, logo + 4–5 nav items + 3 social icons + CTA is crowded, and the social icons pull attention away from the CTA.
  - A hover-only dropdown fails on touch laptops and tablets, and opens by accident.
  - If built as an ARIA `menubar`/`menu`, it creates complex keyboard rules that screen-reader users do not expect on a website.
  - The "short description line" per tab is new copy that nobody has supplied, and copy must not be invented.
  - With at most 4 items per group, a mega menu adds nothing.
- **Recommendation:**
  - RTL order from the start side: logo → nav items → (optional) WhatsApp icon → CTA at the end side (left). The CTA is the only filled button in the header.
  - Move Instagram and TikTok out of the desktop header into the footer, the contact page, the community block and the mobile menu. Keep at most a WhatsApp icon in the header. If the owner wants all three in the header, they should be small, outlined and grouped next to the CTA.
  - Use **simple dropdowns, not a mega menu.** The description line is optional and shown only when the owner supplies the text. Never use placeholder copy.
  - **Disclosure pattern:**
    - Each group is a `<button aria-expanded aria-controls>`. The panel is a plain list of links inside `<nav aria-label="ראשי">`. Do not use `role="menu"`.
    - It opens on click, Enter or Space. Hover may also open it, with roughly 150ms intent delays, but click is the source of truth.
    - Only one panel is open at a time. Esc closes it and returns focus to its button. Tab moves out naturally, and leaving the panel or clicking outside closes it.
    - The group button of the current page's group gets an "active" style, and the current link gets `aria-current="page"`.
    - Chevrons are not mirrored (they point down). Focus outlines stay visible.
  - Group labels are buttons, not links, because there are no group pages (see F9).
  - Show the full desktop header from 1024px up. Below that, use the mobile menu. Check that the labels from F3 fit at 1024 in the chosen fonts (Frank Ruhl/Assistant, Bellefair/Heebo, Rubik).
- **Needs owner decision:** Yes, only for where the social icons go (the draft names the header as one of 4 places). The rest needs no decision.

### F7. Mobile menu: a full-screen accordion means one extra tap for only 11 items
- **Location:** draft › on mobile: full-screen menu from the right, 4 groups as an accordion, WhatsApp, Instagram and TikTok at the bottom.
- **Problem:** With an accordion, every tab costs 3 taps (menu → group → tab), and visitors cannot see the whole site at a glance. Eleven items fit in one scroll at 390px: 11 × 48px rows plus 3–4 small group headings is about 650px. Opening from the right is correct for RTL, since right is the start side.
- **Recommendation:**
  - Use a **flat, sectioned list**: group headings as non-interactive labels, with every tab visible beneath them. That makes 2 taps to any page. At the top of the panel, put a prominent "המסע הקרוב" card or button. Put social links and the WhatsApp/phone row at the bottom.
  - Rows are at least 48px (44px is the floor). The full row is tappable, and there are at least 8px between targets.
  - The close button sits in the same spot as the menu button.
  - Treat the panel as a modal dialog (`role="dialog" aria-modal="true" aria-label="תפריט"`):
    - When open: focus moves to the first item or the close button, focus is trapped, the background is `inert`, and body scroll is locked.
    - It closes on Esc, the close button, or choosing a link. On close, focus returns to the menu button.
  - **Android back button:** pressing back while the menu is open should close the menu, not leave the page. Implement this only if it does not leave a stray history entry; otherwise skip it.
  - Open/close motion stays within the draft's 200–500ms range, and the menu appears instantly under `prefers-reduced-motion`.
  - The menu button is the mobile header's end-side control (or start-side, depending on direction). Whichever side, it is the same on every page, has the accessible name "תפריט", and has `aria-expanded`.
- **Needs owner decision:** No. This is a pattern recommendation within the draft's intent.

### F8. Home page order: trust comes too late, and 11 equal cards make a very long mobile scroll
- **Location:** draft › home page: hero → next-trip summary → a card for each tab → short about → latest parasha → testimonials → community.
- **Problem:**
  - First-time visitors need to know "who are these people, and can I trust them?" right after the trip offer. In the draft, the answer comes after 11 cards, which is about 1,300–1,800px of scrolling on mobile.
  - Eleven identical cards also contradict "never 11 identical generic pages" in spirit, and they repeat the menu.
  - Returning visitors want what is new or coming up (the next parasha, the next live class, upcoming evenings). The draft scatters that.
- **Recommendation (proposed order):**
  1. Hero: who Margaliot is (Vered and Rami) + the "המסע הקרוב" CTA.
  2. Next-trip summary (automatic, following the F1 states).
  3. Short about (trust: faces, one paragraph, a link to מי אנחנו).
  4. Activities **grouped by the menu groups** (3 group blocks, each linking to its published tabs) instead of 11 equal cards.
  5. Selected testimonials.
  6. Latest parasha (+ the next live class, if published).
  7. Community: WhatsApp, Instagram, TikTok (only the links that exist).

  Optional, needs a decision: an "upcoming dates" strip that combines the existing "dates list" block across activities, placed after item 4. It serves returning visitors well. Sections with no published data are hidden.
- **Needs owner decision:** **Yes.** This changes the order of sections in the draft.

### F9. Breadcrumbs link to group labels that have no page, and the separator points the wrong way in RTL
- **Location:** draft › frame components: breadcrumbs "(בית › מסעות › המסע הקרוב)".
- **Problem:**
  - "מסעות" is a menu group, not a page. If it is a link, it needs a group landing page, which would be a new page (owner-only). If it is not a link, the trail is inconsistent and the BreadcrumbList structured data is wrong.
  - On top-level tab pages, a breadcrumb takes mobile space above the fold and adds little: the visitor is one level deep.
  - In RTL, a trail reads right to left, so the separator should point left (‹). The draft's "›" points backwards.
- **Recommendation:**
  - Show breadcrumbs only on second-level pages (/parasha/<slug>, /uman-trips/<trip>, /online-classes/<slug>), for example "בית ‹ פרשת השבוע ‹ וירא". On tab pages, the group may appear as plain text in structured data only, or not at all.
  - Use a direction-aware separator: a CSS-drawn chevron or a mirrored icon, not a hard-coded character. Mark it up as `<nav aria-label="פירורי לחם">` with an ordered list and `aria-current="page"` on the last item.
- **Needs owner decision:** No.

### F10. A changing page at a fixed URL plus WhatsApp's link-preview cache can show an old trip
- **Location:** draft › SEO ("a nice link preview in WhatsApp") and draft › המסע הקרוב (fixed URL).
- **Problem:** WhatsApp, Instagram and Facebook cache link previews (title, image, description) per URL, sometimes for days. A preview for /next-trip may still show last trip's dates and image after the content changes.
- **Recommendation:**
  - Keep the Open Graph title and description for /next-trip free of specific dates (for example "המסע הקרוב של מרגליות לאומן").
  - Version the OG image URL each time the trip changes.
  - Put exact dates on the page, not in the preview.
  - Per-trip URLs (F1) carry date-specific previews.
  - Make sure the URL works with tracking parameters such as `utm_*` and `fbclid`, and that canonical tags remove them.
  - English slugs (recommended in OPEN-DECISIONS #2) also avoid the long percent-encoded Hebrew URLs that WhatsApp shows when Hebrew slugs are pasted. This is a UX argument for that decision.
- **Needs owner decision:** No (the slug language is already open as #2).

### F11. Social links when a link is missing
- **Location:** draft › social and WhatsApp (stored once in site settings; shown in header, footer, floating WhatsApp and the community block; a missing link is not shown and no temporary link is invented).
- **Problem:** The rule is right but incomplete: it only covers single icons. Also, Instagram and TikTok "must be clearly accessible" (CLAUDE.md), and under F6 they leave the desktop header, so their other places must be strong.
- **Recommendation:**
  - Each icon renders only when its URL is set. If none are set, the whole community block, the mobile-menu social row and the footer social group disappear, with no leftover heading or gap.
  - The WhatsApp button and the bar's WhatsApp half disappear if no WhatsApp number is set (the bar then shows only the page CTA).
  - Guaranteed places: the footer (every page), the mobile menu (every page), the contact page and the community block on the home page.
  - Each link has an accessible name that says where it goes (for example "מרגליות באינסטגרם"). It opens in the app or a new tab, with that stated to screen readers. Brand icons are never mirrored in RTL. WhatsApp uses a `wa.me` link with a pre-filled message per page.
  - Admin validation: accept only real `https://` or `wa.me` URLs, never `#` or example values.
- **Needs owner decision:** No (only the links themselves, which the owner will supply).

### F12. 404 and error pages are not specified
- **Location:** not mentioned in the draft.
- **Problem:** Draft pages, old shared links, mistyped URLs and later removed trips or parashot will all produce 404s, often for visitors coming from WhatsApp.
- **Recommendation:**
  - A designed 404 in Hebrew with the full header and footer, one sentence, a "המסע הקרוב" CTA, links to the published groups and a WhatsApp link (only if set). Status 404 and `noindex`.
  - A removed trip or parasha should redirect to its parent list (/uman-trips, /parasha) where that makes sense.
  - Old-site redirects stay as the draft says: only with the owner's approval.
- **Needs owner decision:** No (the copy is a placeholder until the owner supplies it).

### F13. Footer: mirror the menu model, keep the legal links reachable
- **Location:** draft › footer: all tabs, contact details, social, legal pages.
- **Recommendation:**
  - Footer columns use the same groups and order as the header (F3), contain published pages only (F4) and show contact details only if supplied.
  - The legal row (תקנון ומדיניות ביטול, מדיניות פרטיות, הצהרת נגישות) is always present. Under IS 5568, the accessibility statement must be reachable from every page.
  - On mobile, show columns stacked and expanded, not collapsed, because there are only 11 links. Leave bottom padding so the sticky bar (F2) never covers the legal row.
- **Needs owner decision:** No.

### F14. Is a 2-level menu needed on desktop at all?
- **Location:** draft › "11 tabs in one row don't fit readably".
- **Assessment:** The draft is right that 11 flat items do not fit. A fully flat desktop menu is not workable in Hebrew at 1024–1440px. But only 3 groups truly need a dropdown. Option A in F3 (3 dropdowns + 2 direct links + CTA = 6 controls) is the balance: the most-wanted pages (the trip through the CTA, about, contact) are one click away, and the rest are two. If the owner later wants one group flat, the best candidate is מסעות. For example, "מסעות לאומן" could be a direct link with קברי צדיקים בארץ under פעילויות, but that is a bigger change to the model, so this review does not recommend it now.
- **Needs owner decision:** Covered by F3.

### F15. Smaller points
- **Contact form subject list** (draft › יצירת קשר): build it from published activities only (F4), plus "אחר".
- **Header shrink on scroll:** avoid layout shift. Reserve the height, and transform only the inner content.
- **Tablet (768–1023):** use the mobile pattern (menu + bar). Check the bar width so the CTA does not stretch to about 900px; cap it.
- **Focus order on every page:** a skip link ("דלג לתוכן"), then header, main, footer. The sticky bar and the floating button come after main content in the DOM order, so keyboard users do not meet them first on every page.

---

## Recommended navigation spec (proposal, for owner approval)

**Sitemap:** home page + 11 tabs (fixed names and order, own URLs) + 3 legal pages. Second-level pages are created automatically: /uman-trips/<trip>, /parasha/<slug>, /online-classes/<slug>. /next-trip is permanent and never a draft, with open, sold-out and no-trip states. A designed 404.

**Groups (Option A, labels pending owner choice):**
- מסעות ▾: המסע הקרוב · מסעות לאומן · קברי צדיקים בארץ
- פעילויות ▾: פגישת ייעוץ · ערבי נשים · תקשור בציבור · קורס הארת הכלים
- לימוד והתחזקות ▾: פרשת השבוע · שיעורי התחזקות אונליין
- מי אנחנו (direct link) · יצירת קשר (direct link)

**Desktop (≥1024):**
- Sticky header that shrinks on scroll without layout shift. RTL from the start side: logo → מסעות ▾ · פעילויות ▾ · לימוד והתחזקות ▾ · מי אנחנו · יצירת קשר → (optional WhatsApp icon) → filled CTA "למסע הקרוב" at the end side.
- Dropdowns use the disclosure pattern: button + `aria-expanded`, click is the source of truth, optional hover with a delay, Esc returns focus, one panel open at a time, `aria-current` on the current page.
- Simple lists, not a mega menu. Description lines only if the owner supplies the copy.
- Floating WhatsApp in the bottom end corner.

**Mobile (<1024):**
- Compact sticky header (~56px): logo, "המסע הקרוב" button, "תפריט" button.
- Full-screen dialog menu from the right: an "המסע הקרוב" card at the top, then a flat list sectioned by group (48px rows), then direct links, then the social and WhatsApp rows. Focus trap, `inert` background, Esc/close/link closes it, focus returns to the menu button, reduced-motion respected.
- One bottom bar: [page CTA, wide] + [WhatsApp icon], with safe-area padding, hidden while the keyboard is open, never covering the footer. No separate floating WhatsApp button.
- The page CTA defaults to the next trip. On /next-trip it becomes "להרשמה".

**Across the site:**
- One published-only navigation source drives the header, mobile menu, footer, home cards, contact-form subjects and sitemap.xml. Empty groups are hidden; single-item groups become direct links.
- Breadcrumbs only on second-level pages, with a direction-aware separator.
- Social links render only when set, in footer, mobile menu, contact page and the home community block. No placeholders anywhere.
- /next-trip has date-free Open Graph text and a versioned OG image. Per-trip URLs carry the dates.

## Questions for the owner

1. **Menu groups:** choose Option A, B or C (F3), and the group labels. In particular, can מי אנחנו and יצירת קשר be direct links instead of sitting under "מרגליות"? Should "תוכן" become "לימוד והתחזקות" (or another label)?
2. **Where should פגישת ייעוץ and קורס הארת הכלים sit?** Under פעילויות, or פגישת ייעוץ in a "ליווי" group and the course with the learning content?
3. **/next-trip between trips:** what should the page and the CTA say when the trip is sold out, and when no trip is announced yet (F1)?
4. **Mobile floating elements:** may the floating WhatsApp button be merged into the bottom bar on mobile (F2)?
5. **Social icons in the desktop header:** all three, WhatsApp only, or none, with them in the footer, mobile menu and contact page instead (F6)?
6. **Home page:** approve the new section order and grouped activity blocks instead of 11 cards? Add an "upcoming dates" strip (F8)?
7. **Dropdown descriptions:** do you want a short description line under each tab in the menu? If so, please supply the 11 lines; we will not write them for you.
8. **Mobile CTA wording:** "המסע הקרוב" in the header, and "להרשמה" on the trip page itself. OK?
