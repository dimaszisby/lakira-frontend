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

- **The token never touches JavaScript.** Not `localStorage`, not `sessionStorage`, not a non-httpOnly cookie, not a global, and not a response body. Four backend operations return it (`auth/login`, `auth/register`, `auth/switch-org`, `auth/refresh`); the proxy stores it as the session cookie and strips it before the browser sees the response ([ADR-0025](../../docs/explanation/decisions/adr-0025-the-proxy-sets-the-session-cookie.md)). Until 2026-10-05 the browser read it and posted it to `/api/auth/session`, which no longer exists. If a component appears to need the token, it needs a server route instead.
- **The bearer header is injected by the proxy**, from the cookie. Feature code never sets `Authorization`.
- **`src/proxy.ts`** is the edge gate — Next 16 renamed the `middleware` convention to `proxy`, and the file must sit beside `app`, which here means `src/`. It was `middleware.ts` at the repository root until 2026-09-12, satisfying neither condition, so **Next never loaded it and the gate did not run**; `src/app/(app)/layout.tsx` redirecting too is what hid it. It cookie-gates the paths in `PROTECTED_APP_PATHS` (`src/lib/auth-paths.ts`), validating the token's `exp` claim rather than merely its presence. Adding a protected top-level route means adding it to that list only. `config.matcher` is one wide pattern, `PROXY_MATCHER`, because the proxy also issues the Content Security Policy nonce and so runs on every page; Next.js requires the matcher to be a literal, so `src/proxy.ts` repeats it. A test asserts the two are equal and that the pattern covers every protected path, and reads the file by path so a move back fails. Its exclusions end at a segment boundary: without that, `/api-docs` would be skipped and served with no policy.
- **Test a session cookie for usability, never for presence.** `/login` and `/register` redirected on any cookie at all until 2026-09-12, so a token the backend rejected trapped the user: every call 401'd and "log in again" bounced back to the dashboard without showing the form. Use `isSessionTokenUsable` (`src/lib/jwt.ts`), which is what the middleware uses.
- **A 401 that refresh cannot rescue clears the session.** Leaving a rejected token in place is the other half of that trap.
- **A session is written whole or not at all.** The response that reports a sign-in, registration, switch or refresh is the one that sets the session cookie and the refresh cookie, so client code has no storing step to get wrong. If the backend reports success without a usable token, or repeats the token outside `data.token`, the proxy answers 502 and clears both cookies. A backend operation that starts returning a token must be added to `TOKEN_ISSUING_API_PATHS` (`src/lib/auth-paths.ts`); a test compares that list with the contract and fails until it is.

`secure: true` is unconditional, so the cookie will not be set over plain `http`. That is intentional; work around it in local dev with the documented setup rather than by weakening the flag.

## The proxy denies by default

`src/app/api/proxy/[...path]/route.ts` rejects any request without a token, unless the path appears in `PUBLIC_API_PATHS` (`src/lib/auth-paths.ts`) — the seven unauthenticated auth entry points, matched exactly rather than by prefix so `auth/profile` and `auth/switch-org` stay protected.

**It forwards only under the API base.** `buildUpstreamUrl` (`src/lib/auth-paths.ts`) builds the upstream URL and is the only thing that may. A route segment is one opaque path component: an empty one, `.`, `..`, or one containing a slash or a backslash is refused with 400 before the session check, and the rest are percent-encoded. Next decodes segments before the handler sees them, so until 2026-10-05 `/api/proxy/..%2f..%2fhealth` reached the backend's `/health` with the caller's token attached. Never join segments into a URL by hand.

**Adding a backend resource requires no change here.** It is protected from the moment it exists. Only add to `PUBLIC_API_PATHS` when the contract genuinely marks an operation unauthenticated, and cover it in `src/lib/__tests__/auth-paths.test.ts`.

Until 2026-08-27 this was inverted — an allowlist of protected segments, so every unlisted resource proxied unauthenticated. `analytics/*` and `admin/_ping` were both exposed that way.

## Content Security Policy

Script runs by a **per-request nonce**: `src/proxy.ts` generates one for every page and sends `script-src 'self' 'nonce-…' 'strict-dynamic'`, built by `src/lib/csp.ts` ([ADR-0026](../../docs/explanation/decisions/adr-0026-script-runs-by-nonce.md)). There is no `'unsafe-inline'` for script. Until 2026-10-05 the policy was a static header that allowed it, which stops no injected script. Route handlers and `/_next` do not pass through the proxy and keep a static policy from `next.config.ts`; a test fails if the two differ in anything but `script-src`. HSTS, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN` are set in `next.config.ts` for every route. Violations report to `/api/security/csp-report`.

**An inline script needs the nonce.** Next stamps its own. Anything else reads it from the `x-nonce` request header in a Server Component and passes it down, as `src/app/layout.tsx` does for `next-themes`. Never add `'unsafe-inline'` or `'unsafe-eval'` to make something work. Every page is rendered per request because of this; do not mark a page static.

**`'strict-dynamic'` trusts script built by script.** It blocks injected markup (inline handlers, `javascript:` URLs). It does not block application code that creates a script element from untrusted data, so never do that.

**Only `npm run test:e2e:csp` enforces the policy.** Cypress strips CSP headers in every other suite, so they pass with a policy that would block the whole app. After changing the CSP, `src/proxy.ts`, the root layout, or upgrading Next, React or `next-themes`, run it, and `npm run test:e2e:csp:stack` for the signed-in pages.

`connect-src` is derived from `NEXT_PUBLIC_API_BASE_URL`, and `unsafe-eval` is dev-only. Any new external origin — an image host, an analytics endpoint, a font CDN — needs an explicit CSP entry. Do not widen a directive to a wildcard to make something work; add the specific origin, and if that feels like too many origins, that is the signal.

## Error monitoring

Sentry runs on the **server only** and is off unless `SENTRY_DSN` is set ([ADR-0024](../../docs/explanation/decisions/adr-0024-sentry-on-the-server-only.md)). The browser never talks to it, so there is no CSP origin and no public key.

- **Report through `logger`.** `logger.error(...)` is what gets forwarded; `info` and `warn` stay on stdout. `@sentry/*` may be imported only from `src/instrumentation.ts` and `src/lib/monitoring/**`, and lint enforces it.
- **Every `logger.error` field leaves the process, and every log line leaves it by stdout.** `redact` (`src/lib/logger.ts`) matches by key name and passes every string through `scrubText` (`src/lib/scrub-text.ts`), which catches emails, bearer values, token shapes and `?key=value` queries, at every level and before any sink ([ADR-0027](../../docs/explanation/decisions/adr-0027-log-entries-are-scrubbed-in-the-logger.md)). Until 2026-10-06 only the copy sent to Sentry was scrubbed. Neither is a guarantee. Log identifiers, never user input, and never a URL with its query string.
- **A logged string is cut at 4,096 characters, and a pattern added to `scrubText` runs on every log line.** Measure a new pattern on a worst-case string first: the address pattern took 196 ms on 16 KB before it was fixed, and an unauthenticated proxy request could supply the string. Cap anything the caller writes before logging it, as the proxy does with the path.
- **`@sentry/node` 11 collects by default.** `sendDefaultPii` is gone; `dataCollection` categories default to on. `src/lib/monitoring/server.ts` switches each off and a test pins it. Re-check that block on any SDK upgrade.
- **`/api/observability/client-error` is unauthenticated by necessity**, so its reports are capped: 5 per page load in the browser, 30 a minute per process when forwarding. Do not forward from another unauthenticated route without a cap.
- **The three browser-report routes take their input through `createTelemetryIntake`** (`src/lib/telemetry-intake.ts`): client errors, web vitals and CSP reports. It refuses a body over the route's byte cap without buffering it, and stops reading and logging past a per-minute budget (60, 600 and 60), writing one `telemetry.suppressed` line afterwards. Never call `request.text()` or `request.json()` in an unauthenticated route; they buffer the whole body first. The budget is per process, not per client: a per-client limit waits on a client IP the app can trust.

## Injection

- **The app renders no raw HTML, and lint enforces it.** `react/no-danger` is an error, so `dangerouslySetInnerHTML` does not compile past CI, and no sanitiser is installed: `dompurify` was removed on 2026-10-07 because nothing used it ([ADR-0028](../../docs/explanation/decisions/adr-0028-raw-html-is-banned-by-lint.md)). An exception needs a disable comment with its reason, a sanitiser added back as a dependency, and a decision record. That holds for strings that "come from our own backend" too. The rule sees JSX only, so never assign `innerHTML` through a ref either.
- Error text rendered to users goes through `sanitizeErrorMessage` (`src/lib/sanitizeErrorMessage.ts`) — backend errors can carry paths and internals.
- Never interpolate user input into a URL without encoding it.
- `security/detect-object-injection` is disabled because it is noisy on frontend code. That means dynamic property access is unchecked — be deliberate about it on anything derived from user input.

## Secrets

- No secret ever gets a `NEXT_PUBLIC_` prefix. See `.claude/rules/environment.md`.
- No credentials in the repo, including test accounts for staging. The backend handoff is explicit: staging credentials live only in GitHub/Vercel secrets.
- `gitleaks` runs on full history in CI (`secret-scan` job), on every push and PR. A hit there means the secret is already public and must be rotated, not just removed.
- The job runs a pinned gitleaks binary checked against a SHA-256 hard-coded in `test.yml`, not a third-party action — so no action code runs with the job's token, and the digest cannot be changed by whoever publishes the release. To upgrade, change `GITLEAKS_VERSION` and `GITLEAKS_SHA256` together, taking the digest from the release's published checksums and confirming it against the downloaded asset. The scan runs on push and PR rather than on a schedule; scheduled and dispatched workflows run from the default branch, which has been `dev` since 2026-09-24.
- **Every `uses:` is pinned to a full commit SHA**, first-party `actions/*` included, with the version as a trailing comment: `actions/checkout@<40-char sha> # v7.0.1`. A tag can be moved to other code by whoever controls the repository, as happened to tj-actions/changed-files in March 2025; a SHA cannot. `.github/dependabot.yml` updates the pins weekly, SHA and comment together, in one grouped PR against `dev`. Never add a `uses:` by tag, and when changing a pin by hand, confirm the SHA is the commit the release tag points at.
- **Dependency install scripts are opt-in**, per `allowScripts` in `package.json` ([ADR-0019](../../docs/explanation/decisions/adr-0019-dependency-install-scripts-are-opt-in.md)). Only `cypress` is allowed, because its postinstall downloads the binary `e2e` runs; `msw`, `fsevents` and `unrs-resolver` are denied, measured as unneeded. Manage the list with `npm install-scripts approve|deny <pkg>`, never by hand. The cypress approval is pinned to its version (`cypress@15.21.0`), so a Cypress upgrade needs `npm install-scripts approve cypress` in the same change. A new dependency with an install script appears in `npm ci`'s output as "not yet covered by allowScripts"; decide it then, and do not approve by default.
- The `security` job runs `npm audit --omit=dev --audit-level=high`: a high advisory in a **production** dependency fails every PR. The nightly `dependency-audit` workflow audits every dependency, so an advisory in development tooling fails there instead ([ADR-0023](../../docs/explanation/decisions/adr-0023-pull-requests-block-on-production-advisories-only.md)). Runtime code in `src/` may not import a devDependency (`import-x/no-extraneous-dependencies`); that would ship a package the PR audit cannot see.

## Reviewing changes

Use the built-in `/security-review` for a full pass. When reviewing by hand, the checks that catch real issues in this codebase:

1. Does any new route handler read the cookie without validating it?
2. Does a route handler return data the proxy's deny-by-default would otherwise have gated?
3. Is a cache key missing a scope that makes one user's data reachable by another?
4. Did a new external origin get added to the CSP, or worked around?
5. Is anything sensitive newly behind a `NEXT_PUBLIC_` name?
6. Does a new `logger.error` call pass user input, a token, or a URL with its query string? It is forwarded to Sentry.
