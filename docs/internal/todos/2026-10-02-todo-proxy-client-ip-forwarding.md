# 2026-10-02 - Todo: decide how the proxy forwards the client IP

**Context:** found in review of `chore/sync-register-rate-limit`. Backend #127 limits
`POST /auth/register` per client IP (backend ADR-0053), and the backend reads that IP from
`req.ip`, trusting `TRUST_PROXY` hops (default 1). Every browser call reaches the backend through
`src/app/api/proxy/[...path]/route.ts`, which copies inbound headers verbatim (line 116; only the
headers in `FORWARDED_HEADER_BLOCKLIST`, line 32, are dropped: `connection`, `content-length`,
`host` and, since #92, `x-request-id`). It does not append the caller's address to
`X-Forwarded-For`. Line numbers as of `14cbed5`.

Consequences, by reading the code, not yet measured:

- With nothing in front of Next that sets `X-Forwarded-For`, the backend sees the Next server's
  address for every user: one budget, 10 registrations per hour for the whole site.
- In that same setup, a client-sent `X-Forwarded-For` arrives at the backend unchanged, so the
  limit can be bypassed by forging it.
- The same applies to every per-IP limit the backend has, not only registration.

The right fix depends on where the app is hosted (undecided; backend ADR-0042) and on the
backend's `TRUST_PROXY`. It changes a security boundary, so it needs sizing and an ADR.

## Checklist

- [x] Ask the user: raise it with the backend on the shared Notion page ("FE message to BE") ->
      the backend raised it itself on 2026-10-02: "FE and BE messages", Part 2, "Client IP is
      lost through the frontend proxy", status Needs decision
- [ ] Measure locally: the `req.ip` the backend logs for a register call through the proxy
- [ ] Decide, with the backend, which hop sets `X-Forwarded-For` and what `TRUST_PROXY` counts

## Status

**Issue:** #162 (F-03). The open boxes below are tracked there since 2026-10-25; this file is the dated record.

**2026-10-14, register row F-19.** Not started. The two open items wait on where the frontend is
hosted, which is the owner's question O-01 in
`docs/internal/initiatives/frontend-debt-register/register.md`; the work itself is row F-03,
analysed in `analysis-client-ip-through-proxy.md` in that folder. This file's first item and its
line numbers were out of date and were corrected on this date.
