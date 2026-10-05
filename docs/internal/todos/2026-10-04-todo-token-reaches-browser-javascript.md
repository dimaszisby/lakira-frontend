# 2026-10-04 - Todo: the access token passes through browser JavaScript at sign-in

**Context:** finding N3 (P1) of [`audit-2026-10-04.md`](../audits/saas-readiness/audit-2026-10-04.md). Login, register and
switch-organization are called from the browser through the proxy. The response body carries the
access token; the mutation reads it and posts it to `/api/auth/session`, which sets the httpOnly
cookie. `.claude/rules/security.md` says "The token never touches JavaScript". The server-side
login route that made that true was removed on 2026-09-13 (`e54e607`).

**Size when picked up:** not ephemeral. It changes an auth boundary, so it needs a kit and an ADR.
Check `docs/internal/incidents/` and ADR-0020 (the switch's recovery path) first.

## Checklist

- [x] Decide where the cookie is set: a route handler per sign-in operation, or the proxy strips
      `token` from those three responses and writes the cookie itself
- [x] Remove `POST /api/auth/session` if nothing else needs it; it fails open when the backend is
      unreachable
- [x] Either way, make `.claude/rules/security.md` and the code agree

## Status

Done 2026-10-05 on `fix/server-set-session-cookie`. Kit
[`server-set-session-cookie`](../initiatives/server-set-session-cookie/README.md),
[ADR-0025](../../explanation/decisions/adr-0025-the-proxy-sets-the-session-cookie.md).

The proxy sets the cookie and strips the token, for four operations, not three: the contract's
`auth/refresh` returns a token too. `/api/auth/session` is gone, `POST` and `DELETE` both.
