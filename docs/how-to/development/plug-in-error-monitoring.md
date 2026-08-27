# Plug in error monitoring

This app has no monitoring-vendor dependency. It emits structured logs to
stdout and exposes one seam you implement to forward them somewhere.

That is deliberate: a fork should not have to remove someone else's SDK before
adding its own.

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

## Option 1: a log drain (no code)

Every host already collects stdout. On Vercel, point a
[log drain](https://vercel.com/docs/observability/log-drains) at the project. In
Docker or under a process manager, ship the container's stdout. Because each
line is a complete JSON object, any collector can parse it without a custom
grok pattern.

This is the recommended starting point. It requires no dependency, no DSN, and
no CSP change.

## Option 2: register a sink

To forward entries programmatically — to Sentry, Datadog, Axiom, anything —
implement `LogSink` and register it once during server startup:

```ts
// instrumentation.ts (Next.js runs this once per server process)
import { setLogSink } from "@/lib/logger";

export function register() {
  setLogSink((entry) => {
    // Still write the event stream, then forward.
    process.stdout.write(`${JSON.stringify(entry)}\n`);
    if (entry.level === "error") {
      // yourVendor.captureMessage(entry.msg, { extra: entry });
    }
  });
}
```

`setLogSink(null)` restores the default writer.

## If you add a vendor SDK

Three things this repo will hold you to:

1. **Add the ingest origin to the CSP explicitly** in `next.config.ts`. Do not
   widen a directive to a wildcard. See `.claude/rules/security.md`.
2. **Scrub PII before it leaves the process.** The logger already redacts by key
   (`SENSITIVE_KEY_PATTERN`), but a vendor SDK captures breadcrumbs, request
   bodies, and local variables the logger never sees. Sentry's equivalent is
   `beforeSend`. `lakira-backend` shipped without one and it has been an open
   caveat (C5) since 2026-05-24 — do not repeat that.
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
