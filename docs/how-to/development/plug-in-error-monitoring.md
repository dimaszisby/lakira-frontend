# Plug in error monitoring

The app emits structured logs to stdout and exposes one seam, `setLogSink()`, for forwarding
them. A Sentry adapter ships behind that seam and is **off unless `SENTRY_DSN` is set**
([ADR-0024](../../explanation/decisions/adr-0024-sentry-on-the-server-only.md)).

No monitoring code runs in the browser. A fork that sets no DSN loads no vendor code at all, and
one that prefers another provider replaces one file.

## Turn on Sentry

1. Create a project in Sentry for the frontend, separate from the backend's. Both tag events
   with `requestId`, which is how an error here is matched to the backend's record of it.
2. Set the DSN where the server runs. Locally that is `.env.local`:

   ```bash
   SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>
   # optional, shown as the release on each event
   APP_RELEASE=<git sha>
   ```

3. Restart the server. It logs `monitoring.enabled` once at startup.

Neither variable is `NEXT_PUBLIC_`. The browser never talks to Sentry, so the CSP needs no new
origin.

## What gets reported

| Source                                                         | Reaches Sentry as                                   |
| -------------------------------------------------------------- | --------------------------------------------------- |
| A server component, route handler or server action that throws | An exception, via `onRequestError`, with its digest |
| The proxy failing to reach the backend                         | `proxy.upstream_unreachable`                        |
| A browser page crash, uncaught error or unhandled rejection    | `client.error`, with the page path                  |
| Any other `logger.error(...)` on the server                    | A message named after the log event                 |

`info` and `warn` entries are not forwarded. A backend 5xx is logged here at `warn`: the backend
reports it to its own project, and the shared `requestId` links the two.

Browser reports go through the app's own `/api/observability/client-error` endpoint. They arrive
with a message, page, request ID and the browser's raw stack trace, not source lines. That is the
stated cost of keeping the SDK out of the browser.

Two limits protect the quota, because that endpoint is unauthenticated: a page sends at most 5
reports per load, and a server process forwards at most 30 browser reports a minute. Reports past
the cap are still written to stdout.

## What is removed before anything is sent

- Every SDK data-collection category is off (`dataCollection` in
  `src/lib/monitoring/server.ts`). In `@sentry/node` 11 they default to on; `sendDefaultPii` no
  longer exists.
- `scrubSentryEvent` runs as `beforeSend`: cookies and query strings are deleted, and keys
  matching `SENSITIVE_KEY_PATTERN` are redacted.
- Free text (messages and stack traces) is scrubbed by pattern: email addresses, bearer values,
  token-shaped strings and `?key=value` queries. Key-based redaction cannot see inside a value.
- Paths lose their query string. Reset, verify and invite links carry their token there.

Pattern scrubbing is a net, not a guarantee. Do not put user data in an error message.

## What exists already

| Piece                | Where                                             | Emits                              |
| -------------------- | ------------------------------------------------- | ---------------------------------- |
| Structured logger    | `src/lib/logger.ts`                               | One JSON object per line on stdout |
| CSP violations       | `src/app/api/security/csp-report/route.ts`        | `csp.violation`                    |
| Core Web Vitals      | `src/app/api/observability/web-vitals/route.ts`   | `web-vital`                        |
| Client errors        | `src/app/api/observability/client-error/route.ts` | `client.error`                     |
| Last-resort boundary | `src/app/global-error.tsx`                        | POSTs to the client-error route    |

A log line looks like this:

```json
{
  "level": "info",
  "msg": "web-vital",
  "time": "2026-08-26T04:57:45.451Z",
  "metric": "LCP",
  "value": 1840,
  "rating": "good",
  "path": "/dashboard"
}
```

## Other destinations

### A log drain (no code)

Every host already collects stdout. On Vercel, point a
[log drain](https://vercel.com/docs/observability/log-drains) at the project. In
Docker or under a process manager, ship the container's stdout. Because each
line is a complete JSON object, any collector can parse it without a custom
grok pattern.

It requires no dependency, no DSN and no CSP change, and it works alongside
Sentry: the adapter always writes the stdout line before it forwards.

### A different sink

To forward to another provider, implement `LogSink` and register it in
`startMonitoring()` (`src/lib/monitoring/server.ts`) in place of the Sentry one.
`src/lib/monitoring/sentry-sink.ts` is the shape to copy: it calls `writeToStdout`
first, then forwards `error` entries.

```ts
import { setLogSink, writeToStdout } from "@/lib/logger";

setLogSink((entry) => {
  writeToStdout(entry);
  if (entry.level === "error") {
    // yourVendor.captureMessage(entry.msg, { extra: entry });
  }
});
```

Keep vendor imports inside `src/lib/monitoring/**` and `src/instrumentation.ts`. Lint
rejects `@sentry/*` anywhere else; extend that rule's pattern for a new vendor.

`setLogSink(null)` restores the default writer.

## If you add an SDK to the browser

ADR-0024 defers this. If you do it, three things this repo will hold you to:

1. **Add the ingest origin to the CSP explicitly** in `next.config.ts`. Do not
   widen a directive to a wildcard. See `.claude/rules/security.md`.
2. **Scrub PII before it leaves the process.** The logger already redacts by key
   (`SENSITIVE_KEY_PATTERN`), but a vendor SDK captures breadcrumbs, request
   bodies, and local variables the logger never sees. Sentry's equivalent is
   `beforeSend`; `src/lib/monitoring/scrub.ts` is the server-side one here, and
   `lakira-backend` has its own in `src/utils/sentry-scrub.ts`.
3. **Fail soft.** Monitoring must never break a render or a request. Absent
   configuration should disable reporting, not throw.

## Redaction

`SENSITIVE_KEY_PATTERN` in `src/lib/logger.ts` is **substring-matched, not
suffix-anchored**. That distinction matters: an anchored pattern like
`/(password|secret|token|key)$/i` matches `apiKey` but misses `authorization`,
`cookie`, `bearer`, and `dsn` entirely. The backend logged exactly that gap as
caveat C6.

If you add a field name that carries secrets, add it to the pattern and to
`src/lib/__tests__/logger.test.ts`.

## Related

- `docs/reference/performance-budget.md` — the budgets web vitals measure
- `.claude/rules/security.md` — CSP and secret-handling rules
- `SAAS-BASE-CHECKLIST.md` — current readiness verdict
