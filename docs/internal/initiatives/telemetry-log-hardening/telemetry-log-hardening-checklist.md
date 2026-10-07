# Bounded telemetry intake and a scrubbed log stream — Checklist

## Phase 0 — the log stream (N7)

- [x] `src/lib/scrub-text.ts` — `REDACTED`, `stripQuery`, `scrubText` and their patterns, moved
      from `monitoring/scrub.ts`; imports nothing
- [x] `src/lib/logger.ts` — `redact` scrubs strings, strips the query from `path` and `url`, and
      scrubs an `Error`'s message and stack; re-exports `REDACTED`
- [x] `src/lib/monitoring/scrub.ts` — re-exports `stripQuery` and `scrubText`; no importer changes

## Phase 1 — the intake (N6)

- [x] `src/lib/fixed-window.ts` — `createFixedWindow`
- [x] `src/lib/monitoring/sentry-sink.ts` — its client-report cap uses `createFixedWindow`
- [x] `src/lib/telemetry-intake.ts` — `createTelemetryIntake`: budget, then length check, then a
      byte-counted streamed read
- [x] `src/app/api/observability/client-error/route.ts` — uses the intake, 60 a minute
- [x] `src/app/api/observability/web-vitals/route.ts` — uses the intake, 600 a minute
- [x] `src/app/api/security/csp-report/route.ts` — uses the intake, 60 a minute

## Discovered

- [x] Found: `csp.report.invalid` logs a full `Error` with its stack for every malformed body
      → in scope, Phase 1. It now logs the event name alone
- [x] Found: `summarise` in the CSP route truncates strings only, so an object or array in
      `blocked-uri` is logged whole → in scope, Phase 1. A field that is not a string or a number
      is dropped
- [x] Found: `scrubSentryEvent` calls `redact` on a request body, so an address in a body is now
      scrubbed on the way to Sentry too → in scope, a consequence of D-01. One expectation in
      `src/lib/monitoring/__tests__/scrub.test.ts` changed from the literal address to `[email]`
- [x] Found in review: the address pattern is quadratic on a long run with no `@`, and the
      proxy's 401 line logs a path the caller writes, with no cap. D-01 made that reachable
      without a session → in scope, D-03. The pattern is linear, `redact` cuts a string at 4,096
      characters, and `src/app/api/proxy/[...path]/route.ts` logs 200 characters of the path at
      every site
- [x] Found in review: the window read the wall clock, which can step backwards and hold a window
      open → in scope. `createFixedWindow` defaults to `performance.now()`
- [x] Found in review: a rejected `reader.cancel()` reported an oversized body as malformed
      → in scope. The rejection is swallowed
- [ ] Found in review: 600 web-vitals beacons a minute is about a hundred page loads a minute for
      the whole process, so real traffic above that loses beacons → out of scope. The number is a
      judgment recorded in D-02; size it when there is traffic to measure. Field vitals are not
      aggregated yet in any case (the audit's P2 list)
- [ ] Found: an oversized chunked upload on a keep-alive connection is answered in 1 ms, and the
      unread socket then stays open until Node's idle timeout, about six seconds → out of scope.
      Nothing is buffered. A host's own request limits are the place for it, which waits on
      hosting

## Acceptance

A small sweep has no plan, so the criteria are stated here.

- [x] **AC-1** — No telemetry route holds more than its byte cap of a request body in memory. A
      body over the cap is refused on its `Content-Length` without being read, or cancelled
      mid-stream when it declares none. _Method:_ unit test ·
      `src/lib/__tests__/telemetry-intake.test.ts`
- [x] **AC-2** — The cap counts bytes: a body of multi-byte characters that is under the cap in
      characters and over it in bytes is refused. _Method:_ unit test, same file
- [x] **AC-3** — Past its budget in one minute a route reads no body and writes no log line.
      _Method:_ unit test per route, and a count of stdout lines from the production build
- [x] **AC-4** — A window that dropped requests is followed by exactly one `telemetry.suppressed`
      line carrying the count. _Method:_ unit test · `telemetry-intake.test.ts`
- [x] **AC-5** — Every route still answers 204 to every request, accepted or not. _Method:_ unit
      test per route
- [x] **AC-6** — An email address, a bearer value, a JWT and a `?key=value` query in any string
      field are absent from the stdout line, at `info`, `warn` and `error`. _Method:_ unit test ·
      `src/lib/__tests__/logger.test.ts`, and a read of the production build's stdout
- [x] **AC-7** — An `Error` passed as a field is logged with its message and stack scrubbed.
      _Method:_ unit test · `logger.test.ts`
- [x] **AC-8** — The Sentry sink's 30-a-minute cap behaves as before. _Method:_ the existing
      `src/lib/monitoring/__tests__/sentry-sink.test.ts`, unchanged

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — 918, with `coverage:check`
- [x] integration — 125
- [x] spec drift — `api:spec:check` and `api:types:check`, immediately before handover
- [x] `security:audit` — immediately before handover
- [x] build
- [x] e2e — 18
- [x] e2e (csp) — 7
- e2e (stack) and e2e (csp, stack) — not run: no signed-in page, layout, auth flow or policy
  changes

## Evidence

Node 24.21.0. Production build on `127.0.0.1:3000`, `SENTRY_DSN` empty, 2026-10-06. Every gate was
run again after the review fixes; the figures are from that second run.

- **AC-3, AC-4** — 70 client-error reports in one minute: 70 answers of 204, 60 `client.error`
  lines on stdout. One more report in the next minute: one
  `telemetry.suppressed {"event":"client.error","dropped":10}` line, then its own line.
- **AC-2** — a web-vitals body of 742 characters and 2,142 bytes, against a 2,048-byte cap: 204,
  no line. A valid beacon after it: one line.
- **AC-1** — 5 MB to the CSP route with a declared length: 204 in 5 ms, one
  `csp.report.oversized` line. The same 5 MB chunked, no length: 204 in 1 ms with 1.4 MB sent
  before curl stopped; see the last Discovered item for the socket.
- **AC-6** — a client error whose message held an address and whose path and stack held
  `?token=abc123`: the line reads `"message":"No account for [email]"`,
  `"path":"/reset-password"`. A CSP report whose `document-uri` held the same query: logged
  without it. No match for the address or the token anywhere in the server's stdout after the
  smoke run and both Cypress suites.
- **D-03** — `GET /api/proxy/` plus a 12,000-character segment, no session: 401 in 39 ms, the
  logged path 200 characters long. The address pattern on 16 KB with no `@`: 196 ms before,
  0.1 ms after.
- **Mutations, each caught** (17, one at a time, the file compared and restored after each):
  characters counted instead of bytes (3 tests fail); no refusal on declared length (1); the
  streamed cap a hundred times too high (6); the budget not enforced (5); no suppressed line (1);
  strings not scrubbed in `redact` (6); an `Error`'s message and stack not scrubbed (1); `path`
  and `url` keeping their query (2); the window off by one (10, the sink's own among them); the
  window never reporting what it dropped (2); the CSP route keeping a non-string field (1); the
  client-error budget at 61 (1); an over-budget request reported as malformed, so the CSP route
  would log it (3); no string cap in `redact` (1); the address pattern without its lookbehind
  (1, the 200 KB test); the proxy logging the whole path (1); the first window not opened by the
  first call (6).
- **Review** — `code-reviewer` agent, narrow brief, verdict approve with warnings. No finding on
  the stream handling, on a path that could turn the 204 into a 500, on unbounded buffering or
  line count, or on module-scope state. Its findings are the fourth to seventh Discovered items.
