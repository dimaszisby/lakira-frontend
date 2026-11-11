# ADR-0050 — Server-side calls carry the browser's address and reach the proxy on loopback

- **Status:** Proposed
- **Date:** 2026-11-10
- **Related:** extends [ADR-0049](./adr-0049-the-proxy-forwards-the-client-address-the-reverse-proxy-reported.md)
  to the calls this server makes for a browser; the backend's half is lakira-backend #238
- **Origin:** issue #199, under two days and so without a kit

---

## Context

Since ADR-0049, `/api/proxy` sends the backend the address the reverse proxy reported for the
browser, so each user gets their own rate-limit budget. Three other paths reach the backend for
a browser without it:

- **Sign-out.** `/api/auth/logout` calls the backend's `/auth/logout` itself.
- **Token refreshes.** `src/lib/auth-refresh.ts` calls `/auth/refresh`, from the proxy's retry
  after a 401 and from `/api/auth/revive`. ADR-0049 says these are coalesced across users. They
  are coalesced by refresh token, which is one session, so every caller sharing a refresh is the
  same browser.
- **Server-side prefetches.** Server components call `/api/proxy` through `src/services/api/api.ts`,
  whose server base URL was `resolveAppOrigin()`, the public `NEXT_PUBLIC_APP_URL`. On the VPS
  (ADR-0047) that call leaves the container and comes back in through the reverse proxy, which
  writes the server's own address. A header the server component sets is replaced or left to
  the left of it, so forwarding cannot fix it while the call goes that way.

The same base URL was also a trap: a build whose `NEXT_PUBLIC_APP_URL` was not the app itself
sent its prefetches elsewhere, and every page that loads data on the server rendered 404. CI's
stack and performance jobs set it to `http://127.0.0.1:3000` for that reason.

## Decision

1. **A server-side call to `/api/proxy` goes to this server on loopback,** at
   `http://127.0.0.1:$PORT` (`resolveSelfOrigin()`, `src/lib/env.ts`). It never leaves the
   container. `resolveAppOrigin()` stays the public origin, for `robots.ts` and `sitemap.ts`.
2. **`getServerAuthHeaders()` adds `X-Forwarded-For`** with `clientAddress()` of the page
   request it renders (`src/services/api/serverHeaders.ts`). That request came through the
   reverse proxy, so its rightmost entry is the browser's. Next fills `X-Forwarded-For` only
   when it is missing, so on loopback the value arrives as sent, and the proxy forwards it as for
   any request.
3. **`/api/auth/logout` and every refresh send `X-Forwarded-For`** with `clientAddress()` of
   the request that triggered them. A refresh that coalesces several callers carries the
   address of the one that started it. They share one refresh token, so one session, which is
   normally one browser; a stolen cookie replayed elsewhere is the exception, and the backend
   revokes the family on replay anyway.
4. **The rules of ADR-0049 hold unchanged:** only a bare IP address is sent, and the app is
   reached only through the reverse proxy.

## Options considered

- **Forward the address through the public origin.** Rejected: the reverse proxy writes the
  server's own address on the way back in, and a proxy configured to trust the VPS's own
  address would also trust whatever else runs on it.
- **Server components call the backend directly** with `API_URL`, bypassing `/api/proxy`.
  Rejected: a second path that adds the bearer token, refreshes it and filters error bodies,
  beside the proxy that already does all three (ADR-0025, ADR-0034).
- **Leave prefetches on the shared budget** and fix only sign-out and refreshes. Rejected: a
  signed-in page view prefetches on every navigation, so it is the largest share of the calls.

## Consequences

- Locally and in CI there is no reverse proxy, so the socket address (`::ffff:127.0.0.1`) is
  forwarded, as before.
- The server must accept connections on loopback. The image binds `0.0.0.0` (`HOSTNAME`), and
  `next dev` and `next start` given no hostname call `listen` without one, which accepts them.
  A server bound to one external address alone, or to `::1` only, would refuse its own
  prefetches.
- `PORT` names the port. The image's `server.js` reads it, and `next dev` and `next start` set
  it to the port they bound (`node_modules/next/dist/server/lib/start-server.js`), `-p`
  included. Only a custom server that never sets it would call port 3000.
- `NEXT_PUBLIC_APP_URL` is no longer what makes server-side prefetches work. It is still the
  public origin, which `robots.ts` and `sitemap.ts` print, so the image still requires it.
- A refresh started by a server-side prefetch carries the address that prefetch forwarded.
