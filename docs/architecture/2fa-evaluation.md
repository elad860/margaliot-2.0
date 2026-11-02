# Two-factor authentication for the CMS admin: evaluation (decision D13)

- **Status:** evaluation for the owner. Nothing here is decided or installed.
- **Author:** frontend-engineer, task T07, 2026-11-02
- **Context:** Payload 3.92 has no built-in two-factor login (ARCHITECTURE-PROPOSAL §3.2, §10). The admin will control all site content, and later bookings and payments (ADR-0005), so admin accounts matter.

## What is already in place (T07)

- Individual accounts only. No shared or seeded accounts. The owner creates the first admin at `/admin/create-first-user`, and that account is always an admin.
- Roles: `admin` (everything, including users) and `editor` (content and media only). Editors cannot see or change other users or their own role. The last admin cannot be demoted or deleted.
- Lockout: 5 failed logins lock the account for 15 minutes. Admins can unlock it.
- Password policy: at least 12 characters, at most 128; not a common password; must not contain the e-mail name; not one repeated character. Enforced on create, change and reset.
- Sessions expire after 2 hours. Cookies are `SameSite=Lax`, and `Secure` on preview and production. GraphQL is disabled. The admin is `noindex`.

## Options

Candidates were found on the npm registry on 2026-11-02. Download counts and GitHub activity could not be checked from the build environment, so check them before choosing.

| Option | What it is | For | Against |
| --- | --- | --- | --- |
| **A. No 2FA until production; keep the mitigations above** | Status quo | No dependency, nothing to maintain. Adequate while only the developer and owner use a non-public preview behind Vercel Authentication (ADR-0002) | A stolen password is enough to log in once the site is public |
| **B. `payload-totp`** (MIT, v3.0.7, published 2026-10-30, one maintainer; peer `payload ^3.88`) | Plugin: TOTP codes from an authenticator app after password login | Purpose-built for Payload 3, recently updated, matches our version range | Single maintainer. Must be re-checked on every Payload upgrade. Recovery if a phone is lost needs a documented admin procedure |
| **C. `@purposeinplay/payload-totp`** (MIT, v0.5.1, 2026-09) | TOTP with encrypted secrets, backup codes, middleware guard | Backup codes built in. Several maintainers | Pre-1.0. Broad peer range (`payload ^3.0.0`), so less evidence it was tested on 3.92 |
| **D. `@plutotcool/payload-plugin-two-factor`** (MIT, v1.0.1, 2026-07) | TOTP for the admin panel | Small and focused | Little release history |
| **E. Better Auth via `payload-auth`** (MIT, v3.0.0; peer `payload >=3.79.1 <4`) | Replaces Payload's login with Better Auth, which has 2FA (TOTP, backup codes), passkeys and social login | The most complete option. Could also serve future customer accounts | Large change to authentication, several new dependencies (better-auth, zod). Too much for Phase A |
| **F. Single sign-on in front of `/admin`** (e.g. Cloudflare Access or Vercel protection with Google accounts that have 2FA) | Network or identity layer before the admin | No code in the app. Uses Google's 2FA | Ties admin access to a hosting or identity vendor. Needs owner accounts (D3). Does not protect the REST API unless it is configured for it |
| ~~`@assamlabs/payload-2fa`~~ | — | — | GPL-3.0 licence. Not compatible with keeping the project's licensing simple. Rejected |

## Recommendation (for the owner to decide)

1. **Phase A (local and protected preview only):** option A. The mitigations above are enough while no one outside the team can reach the site.
2. **Before production goes live:** add TOTP for **admins at least**, preferably for all staff. Spike option B (or C if backup codes are wanted) in a branch: install it, test it on the pinned Payload version, write the lost-phone recovery procedure, and record the choice in an ADR. Consider option F as well if the owner's accounts are on Google Workspace.
3. Revisit option E only when customer accounts are approved (ADR-0005). That is a separate decision.

## Open questions for the owner

- Should 2FA be required for every staff account, or only for admins?
- Who can reset another person's 2FA if they lose their phone? (Suggested: any other admin, with the action logged.)
