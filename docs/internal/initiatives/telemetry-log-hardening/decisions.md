# Bounded telemetry intake and a scrubbed log stream — Decisions

## D-01 — Free text is scrubbed in the logger, for every level and every sink

> **Promoted to [ADR-0027](../../../explanation/decisions/adr-0027-log-entries-are-scrubbed-in-the-logger.md)** in the flat
> registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-06

**Context.** `scrubText` ran inside the Sentry sink only. The stdout line is written first and
unconditionally, and a log drain ships it, so an email address or a `?token=` query in a message
reached a second destination unscrubbed (finding N7). The logger could not call `scrubText`:
`src/lib/monitoring/scrub.ts` imports `redact` from the logger.

**Decision.** `redact` in `src/lib/logger.ts` scrubs as well as redacts. Every string value goes
through `scrubText`, a value under a `path` or `url` key loses its query string, and an `Error`
keeps its name with a scrubbed message and stack. `log()` already passes every entry through
`redact`, so one place covers stdout and any sink. The text functions move to a leaf,
`src/lib/scrub-text.ts`, which imports nothing; the logger and `monitoring/scrub.ts` both import
it. The Sentry sink keeps its own pass, which is idempotent on scrubbed text.

**Options considered.**

- _Scrub in `writeToStdout`._ Rejected: it fixes stdout and leaves the next sink to remember.
  A sink receives the entry `log()` built, so that is where the guarantee has to be made.
- _Scrub named fields only (`message`, `stack`, `error`)._ Rejected: a new field is then
  unscrubbed until someone adds it to the list. The CSP report's `documentUri` is such a field
  today, and it is the one most likely to hold a reset token.
- _Move `redact` into the monitoring folder to break the cycle._ Rejected: the logger is the
  lower module and has to work with no monitoring code loaded (ADR-0024).

**Consequences.** Every log string passes four regular expressions. The strings are short and
already length-capped where a caller controls them. A log line can no longer be trusted to hold
the literal text it was given: an address reads `[email]`. Scrubbing by pattern is still not a
guarantee, so the rule stays: log identifiers, never user input.

## D-02 — Each telemetry route has its own fixed-window budget, held in the process

- **Status:** Accepted
- **Date:** 2026-10-06

**Context.** `/api/observability/client-error`, `/api/observability/web-vitals` and
`/api/security/csp-report` are unauthenticated by necessity and wrote one log line per request
with no limit (finding N6). The only cap was the Sentry forward, 30 a minute.

**Decision.** Each route takes from its own fixed one-minute window before it reads the body:
60 a minute for client errors, 60 for CSP reports, 600 for web vitals, where one page load sends
about six beacons. Over budget, the body is cancelled unread and nothing is logged. The first
accepted request of the next window writes one `telemetry.suppressed` line with the number
dropped. The counter is `createFixedWindow` in `src/lib/fixed-window.ts`, which the Sentry sink's
own cap now uses too.

**Options considered.**

- _One budget shared by the three routes._ Rejected: a burst of web-vitals beacons, which real
  traffic produces, would silence CSP reports and client errors.
- _A per-client limit._ Rejected for now: the app has no client IP it can trust until the hosting
  decision is made. A per-process cap needs nothing.
- _Sampling instead of a cap._ Rejected: it thins real reports at every traffic level and still
  has no ceiling.

**Consequences.** It bounds abuse and does not meter it: a burst across two windows gets through
at twice the rate, and each server process counts separately. A flood from one client can use the
whole budget, so real reports from others are dropped until the window turns. The numbers are
judgments with no production traffic behind them; they are named constants in each route.

## D-03 — A logged string is cut at 4,096 characters before it is scrubbed

- **Status:** Accepted
- **Date:** 2026-10-06

**Context.** Found in review, after D-01 was implemented. D-01 put four patterns in front of every
log string. The address pattern retried from every character of a long run with no `@`: measured
at 14 ms on 4 KB, 48 ms on 8 KB and 196 ms on 16 KB. The proxy logs the requested path on a 401,
the caller writes that path, and it needs no session, so D-01 had turned one unauthenticated
request into up to a fifth of a second of blocked event loop. The three telemetry routes were not
exposed: every string they log is already capped.

**Decision.** Three changes, each sufficient for the case that was found:

- The address pattern has a lookbehind so a run is tried once. It matches exactly what it matched
  before; the same input now takes 0.1 ms.
- `redact` cuts any string at `MAX_STRING_LENGTH` (4,096) before scrubbing it. The token pattern
  is still quadratic on a crafted `eyJ-eyJ-` run, about 10 ms at that length, and the cap is what
  bounds it for every call site, present and future.
- The proxy logs at most the first 200 characters of the path at every log site, as it already
  did for an invalid path.

**Options considered.**

- _Fix the pattern only._ Rejected: the next pattern added to `scrubText` would have no bound.
- _Cap at each call site only._ Rejected: that is the arrangement that failed here. The proxy's
  401 line was written before the logger scrubbed anything, and nothing prompted a second look.
- _Make the token pattern linear too._ Rejected: the only equivalent rewrite found stops matching
  a token that follows a hyphen, which trades a bounded cost for a missed credential.

**Consequences.** A string longer than 4,096 characters is logged cut, with `...` appended. Client
stacks are capped at 4,000 by their schema, so in practice this reaches only a server stack trace
of unusual length. The cut happens before scrubbing, so an address or token that straddles the
cut can survive in part. A regression test bounds the address pattern's cost on 200 KB.
