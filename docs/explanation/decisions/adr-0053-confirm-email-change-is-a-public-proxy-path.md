# ADR-0053 — `auth/confirm-email-change` is proxied without a session

- **Status:** Accepted
- **Date:** 2026-11-27
- **Related:** none superseded. It extends the deny-by-default list in `src/lib/auth-paths.ts`,
  described in `.claude/rules/security.md` § The proxy denies by default
- **Origin:** issue #234, under two days and so without a kit

---

## Context

lakira-backend #354 added two operations for changing an account's email:

- `POST /auth/change-email`, which is secured. It stores a pending change and sends a link to the
  new address.
- `POST /auth/confirm-email-change`, which declares no `security`. It redeems the single-use token
  from that link. The contract says: "No JWT required: the link may be opened on another device."
  It returns a plain `SuccessResponse`, with no token.

The proxy (`src/app/api/proxy/[...path]/route.ts`) answers 401 to any request without a session,
unless the path is in `PUBLIC_API_PATHS`. `src/lib/__tests__/auth-paths.test.ts` walks the
contract and fails while an unsecured path is in neither that list nor `UNSECURED_NOT_PROXIED`, the
paths the contract leaves open that the proxy still refuses. So the sync had to decide which list
the new path joins. That decides whether a browser with no session can reach the operation, which
is a change to the proxy's auth boundary.

## Decision

`auth/confirm-email-change` joins `PUBLIC_API_PATHS`. Like every entry, it is matched as a whole
path, not as a prefix. `auth/change-email` stays secured, and needs no change: the proxy denies a
path by default.

`TOKEN_ISSUING_API_PATHS` is unchanged, because the operation returns no token. The test that walks
the contract for token-returning operations would fail if it did.

## Options considered

- **Forward it without a session, like `auth/verify-email`.** Chosen. Both operations redeem a
  single-use token from an emailed link, and the backend accepts both without a session. The link
  is sent to the new address and may be opened in a browser that has never signed in, so the page
  that redeems it has to work signed out.
- **Leave it out of `PUBLIC_API_PATHS`, through `UNSECURED_NOT_PROXIED`.** Rejected. The proxy
  would then forward it only with a session, as it does `auth/change-email`. But the link may be
  opened on a device that has never signed in, which is why the contract leaves the operation open,
  so the page would fail for every signed-out user. `UNSECURED_NOT_PROXIED` is for operations no
  browser should reach, the platform's liveness and readiness probes. Used as a waiting room until a
  page calls the operation, it would only put this decision off, and the list would have to change
  back when the page is built.

## Consequences

- A caller with no session can send a token to the backend through the proxy. That is the exposure
  `auth/verify-email` and `auth/reset-password` already have. The backend answers the same generic
  400 to an unknown, used, replaced or expired token, and the contract lists a 429 for the route. A
  409, for an address taken since the request, needs a valid token.
- A signed-in caller's session goes with the request, as on `auth/verify-email`: the proxy attaches
  it to any path when present, and the contract declares no `security` for the operation. What
  happens to existing sessions after the change is the backend's decision.
- The frontend calls neither new operation yet. A page for the link is not built here. When it is,
  it has nothing to add to the proxy.
- `PUBLIC_API_PATHS` has eight entries, all under `auth/`. The test "lists only auth entry points as
  public" still holds.

## References

- Issue #234; lakira-backend #354
- `src/lib/auth-paths.ts`, `PUBLIC_API_PATHS`
- `src/lib/__tests__/auth-paths.test.ts`, "the OpenAPI contract" block
- `docs/reference/api/lakira-backend-openapi.json`, `/auth/confirm-email-change`
