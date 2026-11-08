# ADR-0049 — The proxy forwards the client address the reverse proxy reported

- **Status:** Proposed
- **Date:** 2026-11-08
- **Related:** settles decision 4 of
  [ADR-0047](./adr-0047-the-frontend-runs-on-the-backends-vps.md) for this repository; the
  backend's half, its `TRUST_PROXY` hop count, is lakira-backend #238 (was register row B-05)
- **Origin:** issue #162 (register row F-03), under two days and so without a kit; analysis
  `docs/internal/initiatives/frontend-debt-register/analysis-client-ip-through-proxy.md`

---

## Context

The backend rate-limits by client address: 100 requests per 15 minutes app-wide, and 10 an hour
each on registration, password reset and email verification. Every browser call reaches it
through `/api/proxy`, which copied the incoming headers and set no `X-Forwarded-For` of its own.
Two consequences:

- Behind a reverse proxy, the backend's trusted hop resolved to this server, so every proxied
  user shared one budget, and registration would answer 429 to everyone once ten people had
  registered in an hour.
- A browser-sent `X-Forwarded-For`, `X-Real-IP` or `Forwarded` reached the backend unchanged.

ADR-0047 puts the app behind the backend's reverse proxy on the VPS, as the only hop. Two facts
fix what the route handler can know:

- It cannot read the socket: Next 16's `NextRequest` has no `ip`. `X-Forwarded-For` is the only
  source.
- Next fills that header with the socket address only when it is missing
  (`node_modules/next/dist/server/base-server.js:567`, `??=`). So with nothing in front, a
  browser's own value survives.

## Decision

1. **The proxy no longer forwards `X-Forwarded-For`, `X-Real-IP` or `Forwarded`.** They join the
   request id in `FORWARDED_HEADER_BLOCKLIST` (`src/app/api/proxy/[...path]/route.ts`).
2. **It sends `X-Forwarded-For` with one entry: the rightmost entry of the one it received**
   (`clientAddress`, `src/lib/client-address.ts`). That entry is the one written by the hop
   directly in front of the app. A proxy that replaces an untrusted client's value, as Caddy and
   Traefik do by default, writes only the client; one that appends leaves the client last. An
   entry a browser put before it is ignored either way.
3. **Only a bare IPv4 or IPv6 address is forwarded.** An entry that `isIP` rejects, or that
   carries an IPv6 zone id, sends no header. The backend then sees this server, the old shared
   budget: a safe failure rather than a value someone chose.
4. **The app is reached only through the reverse proxy.** Port 3000 is not published past it,
   since a browser that reaches the server directly chooses its own rightmost entry
   (`docs/reference/production-image.md`).

## Options considered

- **The leftmost entry**, the conventional "original client". Rejected: it is the entry a
  browser writes, so it is the spoofing route this change closes.
- **A dedicated header, proved with a shared secret** (option 2 of the analysis). Rejected for
  now: one more secret to configure and rotate in both repositories, for a topology where a
  single hop this project configures already reports the address.
- **A configurable hop count**, reading the entry that many places from the right. Rejected:
  ADR-0047 has exactly one hop, and a setting nothing varies is one more to get wrong. If a CDN
  is put in front, this is the record to supersede.
- **Accepting the shared budget** (option 3). Rejected, as in the analysis: registration sends
  email, and a shared limit there turns ten sign-ups into an outage.

## Consequences

- With the backend counting the frontend as one trusted hop, its `req.ip` is the browser's
  address. That is lakira-backend #238; the end-to-end check (two browsers, separate
  `RateLimit-Remaining`) needs the VPS stack and is a step of #194.
- Locally and in CI there is no proxy, so Next's socket address (`::ffff:127.0.0.1`) is
  forwarded, which is what the backend saw before.
- Calls this server makes on its own behalf still carry no browser address: server-side
  prefetches through `NEXT_PUBLIC_APP_URL`, token refreshes (coalesced across users by
  `src/lib/auth-refresh.ts`), and `/api/auth/logout`. They keep sharing one budget.
- `X-Forwarded-Host`, `X-Forwarded-Proto` and `X-Forwarded-Port` still pass through, filled by
  Next when missing. How the backend reads them is not checked here.
