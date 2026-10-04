# Sentry error monitoring — decisions

## D-01 — Sentry, running on the server only; the browser SDK is deferred

> **Promoted to [ADR-0024](../../../explanation/decisions/adr-0024-sentry-on-the-server-only.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** Phase 4a left a provider-agnostic seam, `setLogSink()`, and a todo box reading
"choose a provider". `lakira-backend` already reports its server faults to Sentry and tags each
with the request ID. The frontend runs in two places a provider could be installed: the Next.js
server and the user's browser.

**Decision.** Sentry is the provider. Its SDK runs only on the Next.js server, registered through
`setLogSink()` in `src/instrumentation.ts`. Browser errors go to the app's own
`/api/observability/client-error` endpoint and are forwarded from there.

**Options considered.**

- _Sentry's full Next.js setup, with the browser SDK._ Deferred, not rejected. It is the industry
  norm and gives readable browser stack traces and a trail of user actions. It also adds
  JavaScript to every page of every fork whether or not the fork uses Sentry, a new CSP origin, a
  public key in the bundle, and source-map upload, which would be this repo's first CI secret.
- _A log drain into the backend's proposed Loki and Grafana stack._ Rejected for now: that stack
  is only proposed (backend ADR-0038), depends on the undecided frontend hosting, and gives raw
  lines without grouping or alerts.
- _Another vendor._ Rejected: a second service beside the backend's, with no shared request ID.

**Consequences.** A browser error arrives with its message, page, request ID and a minified stack
trace, not source lines. Revisit when browser-side bugs cannot be diagnosed from that, or when a
hosting decision makes a CI secret routine. Adding the browser SDK later is additive: the server
adapter, scrubber and request ID linking all stay.

## D-02 — `@sentry/node`, not `@sentry/nextjs`

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** Sentry publishes a Next.js package and a plain Node one. D-01 needs only the server.

**Decision.** `@sentry/node`, initialised for errors only (`tracesSampleRate: 0`).

**Options considered.**

- _`@sentry/nextjs`._ Rejected: it depends on the browser, React and edge SDKs and a bundler
  plugin, and its setup wraps `next.config.ts`. That is the footprint D-01 defers.
- _No SDK, posting to Sentry's HTTP API by hand._ Rejected: reimplements event encoding and
  retry for no gain.

**Consequences.** Next's own hooks are wired by hand: `onRequestError` in `src/instrumentation.ts`
feeds the logger, and the sink forwards. Tracing stays out; the backend treats it as a separate
OpenTelemetry decision.

## D-03 — The sink forwards `error` entries only, and always writes stdout

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** `setLogSink()` replaces the default stdout writer. A sink that only forwarded would
make the log stream depend on the vendor.

**Decision.** The Sentry sink writes every entry to stdout exactly as the default writer does, then
forwards entries at `error` level.

**Options considered.**

- _Forward `warn` too._ Rejected: `proxy.unauthenticated` is a `warn` on every expired session and
  would drown real faults.

**Consequences.** Stdout remains the complete record and the fallback when Sentry is unreachable.
A fault must be logged at `error` to alert anyone.

## D-04 — Client reports are forwarded at no more than 30 a minute per process

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** `/api/observability/client-error` is unauthenticated by necessity: a crashed page may
have no session. Once its entries are forwarded, a loop against it spends the Sentry quota.

**Decision.** The sink forwards at most 30 `client.error` entries per minute per server process.
Entries past the cap are still written to stdout. The browser reporter separately sends at most 5
reports per page load.

**Options considered.**

- _Require a session._ Rejected: loses errors on the public pages, login included.
- _A shared, cross-process limiter._ Rejected: needs a store this app does not have.

**Consequences.** With several server processes the effective cap is 30 times their number. A real
incident affecting many users is sampled, not fully counted, in Sentry; stdout has every report.
Review on 2026-10-04 added two limits to state plainly: the window is fixed, so a burst straddling
two windows passes at twice the rate, and a caller varying its message can still open up to 30
distinct issues a minute. The cap bounds abuse; it does not meter it.

## D-05 — The proxy reports an unreachable backend, not backend 5xx responses

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** The backend sends its own 5xx faults to Sentry, tagged with the request ID. The proxy
sees the same responses.

**Decision.** The proxy logs an upstream 5xx at `warn` with the `requestId`, which stays on stdout.
It logs at `error`, and so forwards, only when the request to the backend fails outright.

**Options considered.**

- _Report every upstream 5xx._ Rejected: two events for one fault, in two projects.

**Consequences.** A backend fault appears once, in the backend's project. The frontend's project
shows the case the backend cannot report: that it could not be reached.

## D-06 — Free text is scrubbed by pattern before it is forwarded

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** Review found that `redact` and the first scrubber match by key name only. An error
message or stack trace is a value, and it is where an email address or a URL with `?token=` ends
up. Browser reports are written entirely by the caller.

**Decision.** `scrubText` in `src/lib/monitoring/scrub.ts` runs over every string the sink
forwards and over the event's message and exception values in `beforeSend`. It masks email
addresses, bearer values and token-shaped strings, and removes `?key=value` queries.

**Options considered.**

- _Send only the first line of a message._ Rejected: loses the part of a server error that makes
  it diagnosable, and a first line can hold an address too.
- _Leave it to Sentry's server-side data scrubbing._ Rejected: the data has left the process by
  then, and the setting lives in an account this repo does not control.

**Consequences.** A pattern is a net, not a guarantee; `.claude/rules/security.md` tells callers
not to log user input at `error`. The email pattern refuses a match followed by `:digit`, because
Firefox and Safari write a stack frame as `function@file.js:line:column`. A first version without
that guard rewrote every such frame, caught by the sink's own test.

## D-07 — Browser reports are sent as messages, not rebuilt as exceptions

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** The sink first rebuilt an `Error` from a browser report's stack so Sentry would show
frames. Review pointed out that the Node SDK parses only V8's stack format.

**Decision.** A browser report is forwarded with `captureMessage`, its raw stack in `extra`.
Server errors are still rebuilt, since their stacks are V8's.

**Options considered.**

- _Rebuild for every browser._ Rejected: Chrome reports would get frames and group by stack,
  Firefox and Safari reports would get none and group by message, for the same bug.

**Consequences.** Browser issues group by message. Readable, symbolicated browser frames need the
browser SDK and source maps, which is the upgrade D-01 defers.

The live check on 2026-10-04 showed that "group by message" has to be stated, not assumed. The SDK
attached the stack of the sink's own call site to each message and Sentry grouped by that, so two
unrelated browser errors became one issue. `attachStacktrace` is now off, and each message carries
a fingerprint of its event name, kind and scrubbed text.
