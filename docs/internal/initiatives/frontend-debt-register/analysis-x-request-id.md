# F-14 — The proxy forwards whatever `x-request-id` a browser sends

Register row [F-14](register.md), with F-17. Read at `f67716e`, backend `dev` at `3277e5d`. The
backend's side is its row B-14, analysed in lakira-backend
`docs/internal/initiatives/backend-debt-register/analysis-x-request-id.md`; this file covers the
frontend's part and does not restate that one.

## 1. What is wrong

The backend takes any non-empty `x-request-id` it receives as the request's id, with no length or
format check (backend `src/shared/middleware/request-id.ts`, read again on 2026-10-13). This app's
proxy forwards a browser's headers except three (`src/app/api/proxy/[...path]/route.ts:23`,
`route.ts:103-107`), so a browser chooses the id the backend writes on its log lines.

The value comes back to this app too, in three places. The proxy writes the response's
`x-request-id` on its own log line, as it arrives (`route.ts:180`).
`src/services/api/normalizeApiError.ts:109-110` reads it and caps it at 128 characters, and
`src/lib/monitoring/report-client-error.ts:49` reads it for the error report the frontend tags its
own Sentry events with. So a browser's text reaches this project's logs and telemetry as well as
the backend's.

The todo carries a second note for the backend from the same work: `@sentry/node` 11 replaces
`sendDefaultPii` with categories that default to on. Neither note was ever raised on the Notion
page; the backend found the first independently and lists the second as this side's to raise
(F-17).

## 2. Root cause

The proxy forwards by default and blocks by exception, and `x-request-id` was never an exception.
The backend's middleware was written for a trusted caller.

## 3. Options

- **A. The backend validates.** Its recommendation: accept a strict shape, otherwise mint one.
  Nothing changes here.
- **B. The proxy drops the header.** Add `x-request-id` to `FORWARDED_HEADER_BLOCKLIST`
  (`route.ts:23`). The backend then always mints the id for browser traffic. One line and a test.
  Fixes browser traffic only.
- **C. The proxy mints the id itself** and sends it, so one id names the request in both
  services' logs. Useful for tracing; more than the finding asks for.
- **D. Both A and B.** Defence in depth: the backend is safe against any caller, and the proxy
  forwards one header fewer.

## 4. Recommendation

**D, in two independent changes.** The backend's A is the real fix, because the backend has
callers that are not this proxy. B is worth doing here anyway: no feature of this app sets the
header in the browser, so forwarding it serves nobody. B does not wait on A.

The cap at `normalizeApiError.ts:110` stays whichever way this goes; it protects this project's
own telemetry. With B in place the id the proxy logs at `route.ts:180` is always the backend's
own.

## 5. Acceptance criteria for the fix

- **AC-1** — A request to `/api/proxy/...` that carries `x-request-id` reaches the backend
  without it. _Why:_ the finding.
- **AC-2** — The response's `x-request-id`, minted by the backend, still reaches the browser and
  the `requestId` on a normalized error. _Why:_ `normalizeApiError.ts:109-110`; error reports
  rely on it.
- **AC-3** — `route.test.ts` covers AC-1 beside its existing header-stripping cases.
  _Why:_ the todo's own third item.
- **AC-4** — The `@sentry/node` 11 note is on the Notion page, Part 1. _Why:_ F-17; it has
  waited since 2026-10-04.

## 6. Size and shape

≤1 hour for B. An ephemeral todo is already filed. No ADR for one more blocked header; if the
change is made together with F-03, that row's ADR covers it. Gates: the always-on gates and
integration. AC-4 is an edit to the Notion page, which the owner approves.

## 7. Depends on, unblocks

Depends on nothing. Shares the blocklist with F-03's safe part ([D-02](decisions.md)). The
backend's B-14 is independent and `ready` on its register.

## 8. Not verified

- The second note. The backend's Sentry major version and its scrubber's comment were not re-read
  for this file.
- That nothing in this app sets `x-request-id` on an outgoing browser request. A search of `src/`
  found the three response-side reads above and no place that sets it; no runtime check was made.
- Whether the logger bounds the length of the `requestId` the proxy writes at `route.ts:180`.
  `src/lib/logger.ts` was not read for this.
- No reproduction was run for this kit. The first note is read from the code of both
  repositories.
