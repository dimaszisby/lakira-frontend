# Sentry error monitoring — Checklist

## Phase 0 — The adapter (server)

- [x] `package.json`: `@sentry/node` in `dependencies`; no install script runs (ADR-0019)
- [x] `src/lib/env.ts`: server-only `SENTRY_DSN` and `APP_RELEASE`, read leniently
- [x] `src/lib/monitoring/scrub.ts`: `scrubSentryEvent`, with query-string stripping
- [x] `src/lib/monitoring/sentry-sink.ts`: a `LogSink` that writes stdout, forwards `error`
      entries with `requestId`, `digest` and `msg` tags, and caps client reports
- [x] `src/instrumentation.ts`: `register()` and `onRequestError`, both delegating to
      `src/lib/monitoring/server.ts` under the Node runtime (see Discovered)
- [x] `eslint.config.mjs`: `@sentry/*` importable only from `src/lib/monitoring/**` and
      `src/instrumentation.ts`

## Phase 1 — Request ID linking

- [x] `src/services/api/normalizeApiError.ts`: optional `requestId` from `x-request-id`
- [x] `src/app/api/proxy/[...path]/route.ts`: `proxy.upstream_unreachable` at `error`, answered
      with a 502; a `warn` line carrying `requestId` on an upstream 5xx

## Phase 2 — Browser reports through the app's own endpoint

- [x] `src/lib/monitoring/report-client-error.ts`: the shared reporter, 5 per page load
- [x] `src/instrumentation-client.ts`: `error` and `unhandledrejection` listeners
- [x] `src/app/global-error.tsx`, `src/app/(app)/dashboard/error.tsx`,
      `src/app/(app)/metrics/[metricId]/error.tsx`: call the reporter
- [x] `src/app/api/observability/client-error/route.ts`: schema gains `stack`, `requestId`, `kind`

## Phase 3 — Docs, after review

- [x] `docs/how-to/development/plug-in-error-monitoring.md`, including the stale note about the
      backend's missing scrubber
- [x] `docs/reference/configuration.md`, `docs/reference/environments.md`, `.env.example`
- [x] `.claude/rules/environment.md`, `.claude/rules/security.md`, `SECURITY.md`
- [x] `docs/internal/todos/2026-08-24-todo-saas-readiness.md` (4b boxes),
      `docs/internal/audits/saas-readiness/iteration-plan.md` (Status column),
      `SAAS-BASE-CHECKLIST.md`
- [x] D-01 promoted to ADR-0024, with its registry row
- [x] A todo for the backend accepting any `x-request-id` unchecked

## Discovered

- [x] Found: `@sentry/node` 11 has no `sendDefaultPii`. It was replaced by `dataCollection`,
      whose categories (cookies, headers, bodies, query parameters, local variables) default to
      **on**. The plan assumed the old default-off option -> in scope, Phase 0:
      `src/lib/monitoring/server.ts` switches every category off, and a test pins it.
- [x] Found: with the logger imported by `src/instrumentation.ts`, the build compiled it for the
      Edge runtime too and warned twice about `process.stdout` -> in scope, Phase 0: the Node-only
      code moved to `src/lib/monitoring/server.ts`, loaded by dynamic import. The build has no
      warnings.
- [x] Found: a failed request to the backend escaped the proxy as an unhandled rejection and a
      bare 500 -> in scope, Phase 1: caught, logged, answered with a 502 and a JSON body.
- [x] Found: Turbopack rejects a symlinked `node_modules` ("points out of the filesystem root"),
      so a scratch-worktree build needs a real copy (`cp -Rc` clones it on APFS) -> in scope, used
      for the bundle baseline.

- [x] Found in review: `redact` and the scrubber matched by key only, so messages and stacks left
      unscrubbed -> in scope: `scrubText`, D-06.
- [x] Found in review: a retry that failed after a successful token refresh answered without the
      rotated cookies, which gets the session revoked as replay on the next refresh. True before
      this branch too, where the rejection escaped -> in scope: the 502 carries them, with a test.
- [x] Found in review: the Node SDK parses only V8 stacks, so rebuilt browser errors would have
      frames for Chrome and none for Firefox or Safari -> in scope: D-07.
- [x] Found: the first email pattern rewrote every Firefox and Safari stack frame
      (`function@file.js:1:2`), caught by the sink test -> in scope: fixed, with a test.
- [x] Found: `SECURITY.md` still lists `middleware.ts` as doing a presence-only cookie check. The
      file is `src/proxy.ts` and has validated `exp` since 2026-09-12 -> out of scope, filed as
      `docs/internal/todos/2026-10-04-todo-security-md-stale-known-items.md`.
- [x] Found: the backend accepts any `x-request-id` unchecked -> out of scope, filed as
      `docs/internal/todos/2026-10-04-todo-backend-request-id-unvalidated.md`.

- [x] Found by the live check (AC-9): only the server error reached Sentry; both browser reports
      stopped at stdout. Next bundles `src/lib/logger.ts` into each server chunk that imports it
      (seven of them), and the registered sink was a module variable, so only the copy inside the
      instrumentation chunk had it. No unit test or local smoke run could see this -> in scope:
      the sink is held on `globalThis` under `Symbol.for`, with a two-module-instance test.
- [x] Found by the live check (AC-9): Sentry grouped two different browser errors into one issue.
      The SDK attached the stack of the sink's own call site to every message and grouped by it
      -> in scope: `attachStacktrace: false`, and an explicit fingerprint of event, kind and text.

## Acceptance

- [x] AC-1 — unit test · `src/__tests__/instrumentation.test.ts`
- [x] AC-2 — unit test for `onRequestError` · `src/__tests__/instrumentation.test.ts`; the
      live half is AC-9
- [x] AC-3 — unit test · `src/lib/monitoring/__tests__/sentry-sink.test.ts`
- [x] AC-4 — unit test · `src/lib/monitoring/__tests__/report-client-error.test.ts`, and the
      client-error route test
- [x] AC-5 — unit test · `src/services/api/__tests__/normalizeApiError.test.ts`, and the sink test
- [x] AC-6 — unit test · `src/lib/monitoring/__tests__/scrub.test.ts`
- [x] AC-7 — grep of the built client chunks (0 files contain `sentry`); `git diff` of
      `next.config.ts` (empty); an `@sentry/node` import planted in `src/components/ui/Button.tsx`
      failed lint. Client JS: 2,171,657 bytes on `dev`, 2,172,694 on the branch
- [x] AC-8 — unit test of the cap in the sink test
- [x] AC-9 — **manual, against a real Sentry project** (`lakira` organisation, EU region), on
      2026-10-04 at about 15:05 UTC, from the production build with a temporary throwing route
      and a temporary Cypress spec driving a real browser, both deleted afterwards. Read from the
      Sentry issue pages: - a route handler that throws arrived as an exception, tagged `msg: server.request_error`
      and `routeType: route` - an uncaught browser error and an unhandled rejection arrived as two separate issues - the rejection carried `requestId: ac9-live-req-3` and `kind: unhandled-rejection`, and its
      message read `... for [email]` where the browser had sent an address - `should-not-appear`, placed in the query string of both requests, was on no event; no
      event had a request section, cookies or headers - two earlier rounds failed and found the two defects listed under Discovered - not covered live: a Server Component render error and its `digest`. A route handler error
      has no digest. That path is covered by the unit test only.
- [x] AC-10 — grep for stale statements

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests
- [x] integration
- [x] spec drift
- [x] security audit
- [x] build
- [x] e2e
- [x] e2e (stack)

Run on 2026-10-04 with Node 26.5.0. Unit: 755 tests. Integration: 127. e2e: 18. e2e (stack): 13,
against the local backend and Mailpit. Every new test was watched failing against deliberately
broken code (47 mutations across the five source files, all caught), and the two tests added
after the live check were each seen failing first. The built server was started
with no DSN (no monitoring line, pages serve) and with a fake DSN (`monitoring.enabled`, pages
serve).

Review: `code-reviewer`, 2026-10-04, request changes on two points (free-text scrubbing, the 502
dropping rotated cookies), both fixed; see Discovered.
