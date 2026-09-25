---
paths:
  - next.config.ts
  - src/proxy.ts
  - src/app/api/**
  - src/services/api/**
  - src/features/auth/**
  - src/lib/sanitizeErrorMessage.ts
---

# Security

Audit history: [`docs/internal/audits/security/`](../../docs/internal/audits/security/).

## Auth and session

The session is a **pair** of httpOnly cookies, both `secure: true`:

| Cookie | SameSite | Path | Max age | Holds |
|---|---|---|---|---|
| `lakira_token` | `lax` | `/` | 30 days | the 15-minute access token |
| `lakira_refresh` | `strict` | `/api` | 30 days | the refresh token, re-scoped from the backend's own path |

The cookie's max age deliberately outlives the token inside it: expiry is decided by the `exp` claim, and the cookie has to survive long enough for the refresh flow to have something to work with.

`lakira_refresh` is narrow on purpose. Only a request to `/api/*` carries it, which keeps rotation in the two places whose `Set-Cookie` actually reaches the browser — the proxy and `/api/auth/*`. Widening it to `/` would let a server component rotate the token during SSR and silently discard the new value.

**Clear them together.** A surviving refresh cookie mints a new access token, so clearing one of the pair does not end a session. `clearSessionCookies` in `src/lib/auth-refresh.ts` is the only correct way to do it; a clear that omits an attribute the setter used does not match the stored cookie at all.

Non-negotiables:

- **The token never touches JavaScript.** Not `localStorage`, not `sessionStorage`, not a non-httpOnly cookie, not a global. If a component appears to need the token, it needs a server route instead.
- **The bearer header is injected by the proxy**, from the cookie. Feature code never sets `Authorization`.
- **`src/proxy.ts`** is the edge gate — Next 16 renamed the `middleware` convention to `proxy`, and the file must sit beside `app`, which here means `src/`. It was `middleware.ts` at the repository root until 2026-09-12, satisfying neither condition, so **Next never loaded it and the gate did not run**; `src/app/(app)/layout.tsx` redirecting too is what hid it. It cookie-gates the paths in `PROTECTED_APP_PATHS` (`src/lib/auth-paths.ts`), validating the token's `exp` claim rather than merely its presence. Adding a protected top-level route means adding it to that list **and** to `config.matcher` — Next.js requires the matcher to be a static literal, so it cannot be derived. A test asserts the two stay in sync, and reads the file by path so a move back fails.
- **Test a session cookie for usability, never for presence.** `/login` and `/register` redirected on any cookie at all until 2026-09-12, so a token the backend rejected trapped the user: every call 401'd and "log in again" bounced back to the dashboard without showing the form. Use `isSessionTokenUsable` (`src/lib/jwt.ts`), which is what the middleware uses.
- **A 401 that refresh cannot rescue clears the session.** Leaving a rejected token in place is the other half of that trap.

`secure: true` is unconditional, so the cookie will not be set over plain `http`. That is intentional; work around it in local dev with the documented setup rather than by weakening the flag.

## The proxy denies by default

`src/app/api/proxy/[...path]/route.ts` rejects any request without a token, unless the path appears in `PUBLIC_API_PATHS` (`src/lib/auth-paths.ts`) — the seven unauthenticated auth entry points, matched exactly rather than by prefix so `auth/profile` and `auth/switch-org` stay protected.

**Adding a backend resource requires no change here.** It is protected from the moment it exists. Only add to `PUBLIC_API_PATHS` when the contract genuinely marks an operation unauthenticated, and cover it in `src/lib/__tests__/auth-paths.test.ts`.

Until 2026-08-27 this was inverted — an allowlist of protected segments, so every unlisted resource proxied unauthenticated. `analytics/*` and `admin/_ping` were both exposed that way.

## Content Security Policy

Defined in `next.config.ts` alongside HSTS, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`. Violations report to `/api/security/csp-report`.

`connect-src` is derived from `NEXT_PUBLIC_API_BASE_URL`, and `unsafe-eval` is dev-only. Any new external origin — an image host, an analytics endpoint, a font CDN — needs an explicit CSP entry. Do not widen a directive to a wildcard to make something work; add the specific origin, and if that feels like too many origins, that is the signal.

## Injection

- **Every string reaching `dangerouslySetInnerHTML` goes through DOMPurify.** No exceptions, including strings that "come from our own backend".
- Error text rendered to users goes through `sanitizeErrorMessage` (`src/lib/sanitizeErrorMessage.ts`) — backend errors can carry paths and internals.
- Never interpolate user input into a URL without encoding it.
- `security/detect-object-injection` is disabled because it is noisy on frontend code. That means dynamic property access is unchecked — be deliberate about it on anything derived from user input.

## Secrets

- No secret ever gets a `NEXT_PUBLIC_` prefix. See `.claude/rules/environment.md`.
- No credentials in the repo, including test accounts for staging. The backend handoff is explicit: staging credentials live only in GitHub/Vercel secrets.
- `gitleaks` runs on full history in CI (`secret-scan` job), on every push and PR. A hit there means the secret is already public and must be rotated, not just removed.
- The job runs a pinned gitleaks binary checked against a SHA-256 hard-coded in `test.yml`, not a third-party action — so no action code runs with the job's token, and the digest cannot be changed by whoever publishes the release. To upgrade, change `GITLEAKS_VERSION` and `GITLEAKS_SHA256` together, taking the digest from the release's published checksums and confirming it against the downloaded asset. The scan runs on push and PR rather than on a schedule; scheduled and dispatched workflows run from the default branch, which has been `dev` since 2026-09-24.
- **Every `uses:` is pinned to a full commit SHA**, first-party `actions/*` included, with the version as a trailing comment: `actions/checkout@<40-char sha> # v7.0.1`. A tag can be moved to other code by whoever controls the repository, as happened to tj-actions/changed-files in March 2025; a SHA cannot. `.github/dependabot.yml` updates the pins weekly, SHA and comment together, in one grouped PR against `dev`. Never add a `uses:` by tag, and when changing a pin by hand, confirm the SHA is the commit the release tag points at.
- `npm audit --audit-level=high` runs in the `security` job. A new high-severity advisory fails CI.

## Reviewing changes

Use the built-in `/security-review` for a full pass. When reviewing by hand, the checks that catch real issues in this codebase:

1. Does any new route handler read the cookie without validating it?
2. Does a route handler return data the proxy's deny-by-default would otherwise have gated?
3. Is a cache key missing a scope that makes one user's data reachable by another?
4. Did a new external origin get added to the CSP, or worked around?
5. Is anything sensitive newly behind a `NEXT_PUBLIC_` name?
