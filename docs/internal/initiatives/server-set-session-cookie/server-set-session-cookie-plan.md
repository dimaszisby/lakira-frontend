# The server sets the session cookie — Plan

- **Status:** Done
- **Appetite:** 1 day — past that, cut the guard test (AC-9) into a follow-up rather than extend
- **Date:** 2026-10-05

## Context and goals

Four backend operations return an access token in the response body: `POST /auth/login`,
`/auth/register`, `/auth/switch-org` and `/auth/refresh`. The browser calls the first three through
`/api/proxy`, which forwards the body untouched. The mutation reads `response.token` and posts it to
`POST /api/auth/session`, which sets the httpOnly cookie.

So the token is a JavaScript value at every sign-in, while `.claude/rules/security.md` says "The
token never touches JavaScript". Script injected on those pages can read it. The two-step write also
had its own failure modes: signed in with no cookie (patched 2026-09-29), and a refresh cookie in
one organization with an access token in another (ADR-0020's revive fallback).

When this lands, the proxy sets the session cookie itself and removes the token from what the
browser receives. No client code handles a token, and `/api/auth/session` no longer exists.

## Acceptance criteria

- **AC-1** — A 2xx to `POST /api/proxy/auth/login` has no `token` anywhere in its body, and sets
  the session cookie with `HttpOnly`.
  _Why:_ audit 2026-10-04 N3; `.claude/rules/security.md` § Auth and session.
- **AC-2** — The same for `POST /api/proxy/auth/register`.
  _Why:_ as AC-1; registration signs the user in.
- **AC-3** — The same for `POST /api/proxy/auth/switch-org`.
  _Why:_ as AC-1; ADR-0020 makes the switch a token exchange.
- **AC-4** — The same for `POST /api/proxy/auth/refresh`.
  _Why:_ the contract returns a token there too, and the path is public, so any page script can
  call it.
- **AC-5** — The rest of each of those bodies is unchanged: login and register still return `user`.
  _Why:_ the forms seed the profile cache from it.
- **AC-6** — A 2xx on one of those paths with no usable token answers 502, clears both cookies, and
  forwards no token.
  _Why:_ a session must never be half-written; the 2026-09-29 fix and ADR-0020 D-03 both exist
  because it once could be.
- **AC-7** — An error response on those paths, and every response on any other path, is forwarded
  as before, still streamed.
  _Why:_ `feat/api-error-messages` depends on the backend's own error bodies reaching the client.
- **AC-8** — `POST /api/auth/session` answers 404, and no file under `src/` reads a token from a
  response outside the proxy handler and `src/lib/`.
  _Why:_ the route was the second half of the leak, and it failed open when the backend was
  unreachable.
- **AC-9** — A test fails when the contract contains a token-returning operation that the proxy's
  list does not name.
  _Why:_ lesson 2026-09-11, a sweep without a mechanism drifts; a fifth endpoint would leak
  silently.
- **AC-10** — On a production build against the local stack, the browser-visible login response
  has no token, and register, email verification, login, invite acceptance, organization switch and
  password reset all work.
  _Why:_ lesson 2026-09-12; the refresh-cookie path bug of phase 5b was invisible to unit tests.

## Open questions

None.

## Out of scope

- N4, the production CSP allowing inline script. Its own item in
  `docs/internal/todos/2026-10-04-todo-reaudit-p2-findings.md`.
- Filtering upstream error bodies (`2026-09-20-todo-proxy-forwards-upstream-error-bodies.md`).
- Server-side sign-in forms or server actions. The forms stay client components.

## Decisions expected

- D-01 — where the cookie is set. Settled in planning; promoted to ADR-0025.
- D-02 — what happens when a token-issuing success carries no usable token.
- D-03 — whether `/api/auth/session` survives in any form.

D-04, refusing a body that repeats the token, was not foreseen. It came from review.

## Phases

### Phase 0 — Kit

This kit, D-01 to D-03, ADR-0025 as `Proposed`.

### Phase 1 — Proxy

`TOKEN_ISSUING_API_PATHS` and `isTokenIssuingApiPath` in `src/lib/auth-paths.ts`. In
`src/app/api/proxy/[...path]/route.ts`, for a 2xx `POST` on those paths: buffer the JSON body, take
`data.token`, check it with `isSessionTokenUsable`, set the session cookie with
`SESSION_COOKIE_OPTIONS`, delete `token` from the body. Otherwise 502 and `clearSessionCookies`.
Tests first, watched failing.

### Phase 2 — Client

`login.mutation.ts`, `register.mutation.ts` and `switch-organization.mutation.ts` stop handling a
token. `AuthResponseDTO` loses `token`. `src/app/api/auth/session/route.ts`,
`src/features/shared/session.client.ts` and its test are deleted. The three integration suites drop
their `/api/auth/session` handlers. `cypress/support/stack.ts` signs in with one request.

### Phase 3 — Guard

The contract-walking test for AC-9.

### Phase 4 — Verify, review, docs

Gates, the live checks, one narrow review, then the docs listed in the checklist.

## Risks and trade-offs

- The proxy stops being transparent for four operations: the body the browser sees no longer
  matches the contract. Deliberate; ADR-0025 records it.
- Those four responses are buffered rather than streamed. They are small JSON documents.
- A backend that returns 2xx without a token now signs the user out instead of leaving them where
  they were. That backend is already broken.

## Rollback

Revert the PR. Cookie names and attributes do not change, so sessions created before or after
survive in both directions. No data is migrated.

## Security and data

The trust boundary moves in the safe direction: the browser loses a credential it previously
handled. The proxy trusts a token only from a 2xx backend response and still checks its shape and
expiry before storing it. `POST /api/auth/session`, which accepted a token from any caller, is
removed. Nothing new is logged; the token is never a log field.

## Observability

`proxy.session.issued` at `info` with the path, and `proxy.session.unusable_token` at `error`,
which the log sink forwards. A rise in the second means the backend's contract changed.

## References

- `docs/internal/audits/saas-readiness/audit-2026-10-04.md` § 6, N3
- ADR-0020, ADR-0015, ADR-0024
- `docs/internal/incidents/fix-searchParams-and-cookies-20251130.md`
