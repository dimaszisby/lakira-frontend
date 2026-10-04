# Sentry error monitoring — Plan

- **Status:** Approved
- **Appetite:** 2 days — past that, cut the browser listener (Phase 2) rather than extend
- **Date:** 2026-10-04

Phase 4b of the SaaS-readiness roadmap:
[`iteration-plan.md`](../../audits/saas-readiness/iteration-plan.md), tracked in
[`2026-08-24-todo-saas-readiness.md`](../../todos/2026-08-24-todo-saas-readiness.md).

## Context and goals

The SaaS-readiness roadmap has one phase still open for want of a decision: Phase 4b, the
monitoring adapter (`docs/internal/audits/saas-readiness/iteration-plan.md:19`). Phase 4a built the
collecting half: the server writes structured log lines, and the browser reports page crashes to
`/api/observability/client-error`. Nothing stores, groups or alerts on any of it.

Decided on 2026-10-04: Sentry, because `lakira-backend` already uses it, and **server-side
first**. Sentry's code runs only on the Next.js server; browser errors keep going through the app's
own endpoint and are forwarded. The full browser SDK is the industry norm and stays available as a
later, additive step.

Three gaps found while exploring, all in scope:

- No `src/instrumentation.ts` exists, so server render and route errors are reported nowhere.
- Only `global-error.tsx` reports from the browser. Click-handler errors, failed promises, and the
  two route-level `error.tsx` files (which only `console.error`) report nothing.
- The backend returns an `x-request-id` on every response and tags its own Sentry errors with it.
  The frontend discards it, so a browser error cannot be matched to its backend error.

Outcome: with `SENTRY_DSN` set, server and browser errors arrive in Sentry, scrubbed, tagged with
the backend's request ID. With it unset, nothing changes and nothing throws.

## Acceptance criteria

- **AC-1** With `SENTRY_DSN` unset, the server starts, no Sentry code is loaded, and log lines go
  to stdout exactly as today. _Why:_ the todo's "absent configuration must disable reporting, not
  throw"; a fork with no account pays nothing.
- **AC-2** With it set, an error thrown in a server component and one thrown in a route handler
  each produce one Sentry event carrying the Next `digest`. _Why:_ these are reported nowhere today.
- **AC-3** A `logger.error` entry is forwarded; `info` and `warn` are not; every entry is still
  written to stdout. _Why:_ the stdout stream is the provider-agnostic base and must not depend on
  the vendor.
- **AC-4** A browser error outside a page crash (an uncaught error, an unhandled promise rejection,
  and each of the two route `error.tsx` boundaries) reaches the client-error endpoint with its page
  path, at most 5 reports per page load. _Why:_ React boundaries do not catch these, so today they
  are invisible.
- **AC-5** When an API call fails, the response's `x-request-id` is kept on the normalized error
  and sent as the tag `requestId`, the tag name the backend uses. _Why:_ this is the one link
  between a browser error and its backend error.
- **AC-6** An event holding `authorization`, `cookie`, `token` or `password` keys leaves with them
  redacted, cookies removed, and URL query strings stripped. _Why:_ `/reset-password?token=...` and
  `/invites/accept?token=...` carry live credentials in the URL.
- **AC-7** No client chunk contains Sentry code, the CSP in `next.config.ts` is unchanged, and lint
  fails on an `@sentry/*` import outside the adapter. _Why:_ this is what "server-side first"
  means; a sweep without a mechanism drifts (lesson 2026-09-11).
- **AC-8** Reports from the unauthenticated client-error endpoint are forwarded to Sentry at no
  more than 30 per minute per server process; the rest go to stdout only. _Why:_ otherwise anyone
  can spend the Sentry quota with a loop.
- **AC-9** Live: one real server error and one real browser error are seen in the Sentry project,
  and a failed API call shows the `requestId` tag. _Why:_ a gate nobody has seen run might not
  exist (lesson 2026-09-12). Method: manual, evidence recorded in the checklist.
- **AC-10** Every doc that says the app has no monitoring adapter states what now exists, and the
  stale note about the backend's missing scrubber is corrected. _Why:_ lesson 2026-08-17.

## Open questions

- [x] **Q-1** Browser scope: server-side first. Answered 2026-10-04.
- [x] **Q-2** Live check: the user supplies a DSN in `.env.local`. It is needed only for AC-9, not to
      start. Assumption: a separate Sentry project for the frontend in the same organisation as the
      backend's, so the two are filtered apart but share the `requestId` tag.

## Out of scope

- The browser SDK, source maps, session replay. Recorded in ADR-0024 with the triggers to revisit.
- Performance tracing. The backend treats tracing as a separate OpenTelemetry decision (its
  ADR-0038); `tracesSampleRate` is 0 here.
- Showing a reference code to users on API errors. A UI change with its own accessibility review.
- The backend accepting any `x-request-id` unchecked. Filed as a todo for the backend.
- Deploy configuration (Phase 7), still waiting on the hosting decision.

## Decisions expected

- **D-01** Sentry, server-side first; browser SDK deferred. Promoted to ADR-0024.
- **D-02** Package `@sentry/node`, not `@sentry/nextjs`: the latter ships browser, edge and
  bundler plugins and wraps `next.config.ts`. No install scripts (ADR-0019 holds).
- **D-03** The sink forwards `error` level only and always writes the stdout line.
- **D-04** The 30 per minute forwarding cap on client reports.
- **D-05** The proxy reports an unreachable backend, not backend 5xx responses: the backend already
  sends those to Sentry, and reporting both doubles every event.

## Phases

### Phase 0: the adapter (server)

- `package.json`: `@sentry/node` in `dependencies`
- `src/lib/env.ts`: server-only `SENTRY_DSN` and `APP_RELEASE` (the backend's names), read
  leniently like the rest of the file; never `NEXT_PUBLIC_`
- `src/lib/monitoring/scrub.ts`: `scrubSentryEvent`, built on the existing `redact` and
  `SENSITIVE_KEY_PATTERN` in `src/lib/logger.ts`, structural event type as the backend's
  `sentry-scrub.ts` does; adds query-string stripping
- `src/lib/monitoring/sentry-sink.ts`: a `LogSink` that writes the stdout line, then forwards
  `error` entries with `requestId`, `digest` and `msg` as tags; holds the forwarding cap
- `src/instrumentation.ts` (new): `register()` loads the adapter by dynamic import only when
  `NEXT_RUNTIME` is `nodejs` and a DSN is set, wrapped so a failure logs a warning and continues;
  `onRequestError` logs `server.request_error` with digest, method, route and the path without its
  query string, and no headers
- `eslint.config.mjs`: restrict `@sentry/*` imports to `src/lib/monitoring/**` and
  `src/instrumentation.ts`

### Phase 1: request ID linking

- `src/services/api/normalizeApiError.ts`: optional `requestId` from the `x-request-id` response
  header on the normalized error
- `src/app/api/proxy/[...path]/route.ts`: `logger.error("proxy.upstream_unreachable")` when the
  fetch itself fails; a `warn` line with `requestId` on an upstream 5xx

### Phase 2: browser reports through the app's own endpoint

- `src/lib/monitoring/report-client-error.ts`: the POST currently inline in
  `src/app/global-error.tsx`, extracted, with the 5-per-page-load cap
- `src/instrumentation-client.ts` (new): `error` and `unhandledrejection` listeners calling it
- `src/app/global-error.tsx`, `src/app/(app)/dashboard/error.tsx`,
  `src/app/(app)/metrics/[metricId]/error.tsx`: call the helper
- `src/app/api/observability/client-error/route.ts`: schema gains capped `stack`, `requestId` and
  `kind`; body limit raised to fit

### Phase 3: docs, after review

- `docs/how-to/development/plug-in-error-monitoring.md`, `docs/reference/configuration.md`,
  `docs/reference/environments.md`, `.env.example`, `.claude/rules/environment.md`,
  `.claude/rules/security.md`, `SECURITY.md`
- `docs/internal/todos/2026-08-24-todo-saas-readiness.md` (4b boxes),
  `docs/internal/audits/saas-readiness/iteration-plan.md` (Status column only),
  `SAAS-BASE-CHECKLIST.md`
- ADR-0024 and its registry row; a todo for the backend's unchecked `x-request-id`

## Risks and trade-offs

- `@sentry/node` starts OpenTelemetry instrumentation by default, which may not survive Next's
  server bundling. Mitigation: errors-only init with default integrations trimmed, and
  `serverExternalPackages` if the build needs it. If it cannot be made to work inside the appetite,
  stop and re-plan; do not fall back to `@sentry/nextjs` silently.
- Code running in the Edge runtime has its own module instance and no sink, so it logs to stdout
  only. `src/proxy.ts` runs on Node in this Next version; verified in Phase 0.
- The production dependency tree grows, so the PR audit covers more packages.
- Browser stack traces arrive minified. Accepted; it is the stated cost of server-side first.

## Rollback

Unset `SENTRY_DSN`. The adapter is never loaded and behaviour returns to today's. No data
migration, no deploy in scope.

## Security and data

Error data leaves the process for a third party, which is a new trust boundary. `sendDefaultPii`
stays false; `beforeSend` runs the scrubber; request headers and cookies are never attached; URLs
lose their query strings. The DSN is server-only. The CSP is untouched because the browser never
talks to Sentry. The client-error endpoint stays unauthenticated, size-capped and schema-validated,
with the new forwarding cap. Check `docs/internal/incidents/` before touching the proxy.

## Observability

If reporting itself breaks, the stdout line is still written for every entry, so the host's logs
remain the fallback. A failed adapter start logs `monitoring.init_failed` once.

## Accessibility

Not triggered: no user-facing UI changes. The three error boundaries keep their markup and gain
only a reporting call.

## References

- `docs/how-to/development/plug-in-error-monitoring.md` — the seam this plugs into
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`
  and `instrumentation-client.md` — the two file conventions used
- `lakira-backend`: `src/utils/sentry-scrub.ts`, `src/shared/middleware/request-id.ts`, ADR-0021
