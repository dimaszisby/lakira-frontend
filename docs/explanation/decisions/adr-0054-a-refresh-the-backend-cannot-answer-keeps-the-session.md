# ADR-0054 — A refresh the backend cannot answer keeps the session

- **Status:** Accepted
- **Date:** 2026-11-27
- **Related:** none superseded. It narrows the rule in `.claude/rules/security.md` that a 401
  refresh cannot rescue clears the session
- **Origin:** issue #220, under two days and so without a kit; audit 2026-11-14, N21

---

## Context

`refreshAccessToken` (`src/lib/auth-refresh.ts`) returned `null` whenever it could not produce a
new access token. Both of its callers read `null` as "the session is over":

- the revive route (`src/app/api/auth/revive/route.ts`) cleared both cookies and sent the user to
  `/login`;
- the proxy (`src/app/api/proxy/[...path]/route.ts`) cleared both cookies on a 401 the refresh
  could not rescue.

But `null` also covered a backend that could not be reached, or that answered 5xx or 429. So a
backend restart signed out everyone whose 15-minute access token expired during it, though their
refresh token was still good.

## Decision

A refresh comes to one of three outcomes:

- **`refreshed`:** a new access token, and the rotated refresh token when there is one.
- **`rejected`:** the session is over, and both cookies are cleared, as before.
  - The request carried no refresh cookie, or the backend answered any other non-2xx.
  - Or the backend answered 2xx with no usable token. It has then rotated the token, so the one
    presented is spent.
- **`unavailable`:** nothing is known about the session, and both cookies are kept.
  - The backend could not be reached, or did not answer within 5 seconds.
  - Or it answered 5xx or 429.

On `unavailable`:

- **The revive route** answers 503, with `Cache-Control: no-store` and `Retry-After: 5`. The page
  has no script, and links "Try again" back to revival and "sign in again" to the login form,
  each keeping `returnUrl`.
- **The proxy** answers a protected path's 401 with 502 and `{ error: "The server could not be
reached." }`, as it already did for a backend it could not reach. A public path's own 401, such
  as a wrong password, passes through unchanged.

An `unavailable` outcome is remembered for 5 seconds, against 30 for the other two. That is enough
to absorb a burst of requests, and short enough that "Try again" reaches the backend once it is
back.

## Options considered

- **Three outcomes, keeping the session on `unavailable`.** Chosen. It ends a session only when the
  backend says the session is over.
- **Keep clearing on any failure.** Rejected. It is the bug: an outage the user did nothing about
  ends their session.
- **On `unavailable`, redirect to `returnUrl` and let the page fail there.** Rejected. The token is
  still expired, so the edge gate sends the request straight back to revive. Each hop would ask the
  backend again, and the loop would end only when the backend did.
- **Reload the page automatically after a delay.** Rejected for the same reason: a tab left open
  during an outage would ask the backend on every reload.
- **Remember `unavailable` for the full 30 seconds.** Rejected in review. The page says to retry in
  5 seconds, and for 25 seconds more each retry would be answered from memory, with no request to a
  backend that was already back.

## Consequences

- A session is kept for as long as the backend cannot answer, however long that is. The user can
  leave through "sign in again". Nothing ends the session on its own. It ends only when the backend
  says so.
- A timeout, or a response lost after the backend rotated the token, can hide a rotation that did
  happen. The next attempt then presents a spent token, the backend revokes the family, and the
  session ends. That is how such a session already ended before this change.
- A 408, or a 404 from a gateway while the backend starts, is still `rejected` and ends the session.
  Both are rare, and they are left as they are.
- An intermediary that answers 200 with its own page ends the session as a malformed body would.
  That is rare, and it fails closed.

## References

- Issue #220; `docs/internal/audits/saas-readiness/audit-2026-11-14.md`, N21
- `src/lib/auth-refresh.ts`, `RefreshOutcome`
- `src/app/api/auth/revive/route.ts`, `unavailablePage`
- `src/app/api/proxy/[...path]/route.ts`, `isRefreshUnavailable`
- `.claude/rules/security.md`, `.claude/rules/data-access.md`, `docs/reference/routes-and-proxy.md`
