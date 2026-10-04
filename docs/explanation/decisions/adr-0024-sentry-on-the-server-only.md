# ADR-0024 — Error monitoring is Sentry, running on the server only

- **Status:** Accepted
- **Date:** 2026-10-04
- **Origin:** `D-01` in the sentry-error-monitoring kit — [`decisions.md`](../../internal/initiatives/sentry-error-monitoring/decisions.md)

---

## Context

Phase 4a of the SaaS-readiness programme left a provider-agnostic observability layer: structured
log lines on stdout, an endpoint that receives browser error reports, and one seam, `setLogSink()`,
for forwarding. Nothing stored, grouped or alerted on any of it. The programme's one remaining P0,
"no error monitoring of any kind", stayed open behind a single unmade choice: which provider.

`lakira-backend` already reports its server faults to Sentry and tags each event with the
request ID it returns in `x-request-id`.

The frontend runs in two places a provider could be installed: the Next.js server and the user's
browser. This repository is also a fork template, and its own guide states that a fork should not
have to remove someone else's SDK before adding its own.

## Decision

- **The provider is Sentry**, so that one account covers both halves of the application and a
  frontend error carries the same `requestId` tag as the backend's record of it.
- **The SDK runs on the Next.js server only.** `src/instrumentation.ts` loads `@sentry/node` by
  dynamic import, in the Node runtime, when `SENTRY_DSN` is set. With no DSN, no vendor code is
  evaluated.
- **The browser reports to the application's own endpoint**, `/api/observability/client-error`,
  and the server forwards. No vendor code ships to the browser, the Content Security Policy gains
  no origin, and the DSN is never public.
- **Lint keeps it that way.** `@sentry/*` may be imported only from `src/instrumentation.ts` and
  `src/lib/monitoring/**`.

## Options considered

- **Sentry's full Next.js setup, with the browser SDK.** Deferred, not rejected. It is the
  industry norm and gives readable browser stack traces and a trail of user actions. It also adds
  JavaScript to every page of every fork whether or not that fork uses Sentry, a new CSP origin, a
  public key in the bundle, and source-map upload, which would be this repository's first CI
  secret.
- **A log drain into the backend's proposed Loki and Grafana stack.** Rejected for now. That stack
  is only proposed (backend ADR-0038), it depends on a frontend hosting decision that has not been
  made, and it yields raw lines without grouping or alerting.
- **Another vendor.** Rejected: a second service beside the backend's, with no shared request ID.

## Consequences

- A browser error arrives with its message, page, request ID and the browser's raw stack trace,
  not source lines, and browser issues group by message. This is the stated cost.
- Error data now leaves the process for a third party. Every SDK data-collection category is
  switched off, a `beforeSend` scrubber removes cookies and query strings and redacts sensitive
  keys, and free text is scrubbed by pattern. Pattern scrubbing is a net, not a guarantee.
- `@sentry/node` 11 collects by default: `sendDefaultPii` no longer exists, and `dataCollection`
  categories default to on. The block that switches them off must be re-checked on every SDK
  upgrade; a test pins its current contents.
- The browser-report endpoint is unauthenticated by necessity, so forwarding is capped: 5 reports
  per page load, and 30 a minute per server process. The cap is a fixed window per process and
  bounds abuse without metering it.
- Only `error` log entries are forwarded, and stdout is always written first. The log stream
  stays complete and stays the fallback when Sentry is unreachable.
- The registered sink is held on `globalThis`, not in a module variable. Next bundles the logger
  into each server chunk that imports it, and a module variable was visible only to the copy
  inside the instrumentation chunk; entries logged from a route handler never reached Sentry.
  Only sending real errors showed this.
- Code that runs in the Edge runtime is not reported. Nothing here runs on Edge today.
- The production dependency tree grows, so the pull-request audit (ADR-0023) covers more
  packages.

**Revisit when** browser-side bugs cannot be diagnosed from a message and a minified stack, when a
hosting decision makes a CI secret routine, or when the hosted free plan's limits (one seat, 5,000
errors a month) are reached. The adapter talks to whatever the DSN names, so moving to a
self-hosted or Sentry-compatible server is a change of `SENTRY_DSN`, not of code. Adding the browser SDK is additive: the server
adapter, the scrubber and the request ID linking all stay.

## References

- `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/lib/monitoring/`
- `docs/how-to/development/plug-in-error-monitoring.md`
- [`iteration-plan.md`](../../internal/audits/saas-readiness/iteration-plan.md), Phase 4b
- `lakira-backend`: ADR-0021 (Sentry init lifecycle), `src/shared/middleware/request-id.ts`
