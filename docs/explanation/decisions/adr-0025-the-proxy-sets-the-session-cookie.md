# ADR-0025 — The proxy sets the session cookie; the token never reaches the browser

- **Status:** Accepted
- **Date:** 2026-10-05
- **Origin:** `D-01` in the server-set-session-cookie kit — [`decisions.md`](../../internal/initiatives/server-set-session-cookie/decisions.md)

---

## Context

The session is an access token in an httpOnly cookie, so that script running in the page cannot
read it. Four backend operations return that token in a response body: `POST /auth/login`,
`/auth/register`, `/auth/switch-org` and `/auth/refresh`.

Until this decision the browser called them through `/api/proxy/[...path]`, which forwarded the
body unchanged. Client code read the token and posted it to `/api/auth/session`, which stored it.
The token was therefore a JavaScript value at every sign-in and every organization switch, and the
2026-10-04 readiness audit recorded it as finding N3. The two-step write also allowed a session to
be half-written: signed in with no cookie, or an access token for one organization beside a
refresh cookie for another.

## Decision

For a successful `POST` to one of those four paths, the proxy takes the token from the backend's
response, sets the session cookie on its own response, and removes `token` from the body.

- The list of paths is `TOKEN_ISSUING_API_PATHS` in `src/lib/auth-paths.ts`. A test compares it
  with the contract, so an operation that starts returning a token fails the suite until it is
  listed.
- A success that carries no usable token answers 502 and clears both cookies. So does one whose
  body repeats the token anywhere besides `data.token`: the contract has no such copy, and a
  response that grows one is refused instead of forwarded.
- No client code receives, stores or forwards a token. `/api/auth/session` is removed.

## Options considered

- **A route handler per operation.** Each would re-implement forwarding, error passthrough and the
  refresh-cookie capture the proxy already performs for the same responses.
- **Keep the client write and validate harder.** The token still crosses JavaScript.
- **Server actions for the sign-in forms.** A rewrite of three forms to change a transport detail.

## Consequences

- The proxy is not transparent for these four operations. The body the browser receives differs
  from `docs/reference/api/lakira-backend-openapi.json`: it has no `token`.
- One response carries the access token and the refresh cookie together, so a session is written
  whole or not at all.
- The last consequence listed in
  [ADR-0020](./adr-0020-changing-organization-reloads-the-document.md), the fallback to
  `/api/auth/revive` when storing the new session fails, no longer has a case to handle: there is
  no separate store step. The rest of ADR-0020 stands.
- Those four responses are buffered instead of streamed.
- A new backend operation that returns a token must be added to the list. The contract test is
  what notices.

## References

- [ADR-0020](./adr-0020-changing-organization-reloads-the-document.md)
- [`../../internal/audits/saas-readiness/audit-2026-10-04.md`](../../internal/audits/saas-readiness/audit-2026-10-04.md) § 6, N3
- [`../../internal/initiatives/server-set-session-cookie/`](../../internal/initiatives/server-set-session-cookie/)
