# F-12 — Field web vitals are logged and nothing aggregates them

Register row [F-12](register.md). Read at `f67716e`.

## 1. What is wrong

The app collects Core Web Vitals from real page loads and does nothing with them beyond one log
line each. `src/app/_components/WebVitalsReporter.tsx:20` hooks Next's reporter and posts each
metric to `/api/observability/web-vitals` (`WebVitalsReporter.tsx:17`). The route validates the
beacon and writes it at `info` (`src/app/api/observability/web-vitals/route.ts:42`).

`docs/reference/performance-budget.md:169-178` sets field budgets at the 75th percentile: LCP
2.5 s, CLS 0.1, INP 200 ms. A percentile needs the lines gathered and grouped by route, and
nothing does that. The audit of 2026-10-10 grades "Field performance data" Partial: emitted,
never compared with the budget.

## 2. Root cause

The collection half was built (iteration plan, phase 4) and the reading half needs somewhere for
log lines to go. There is no deployed environment, so there is no log drain to query.

## 3. Options

- **A. Read them where the logs land.** Once the app is hosted, the server's stdout goes to that
  host's log store. A saved query or dashboard there computes p75 per route from the `web-vital`
  lines. No application code; depends entirely on the host.
- **B. Send them to the registered sink.** `src/lib/logger.ts:127` exposes `setLogSink`, and the
  server registers Sentry behind it when a DSN is set (`src/lib/monitoring/server.ts:54`). Forward `web-vital` events as measurements. Code
  here, and a cost per event at the vendor.
- **C. Aggregate in the app.** Keep rolling percentiles in memory and expose them. Wrong on more
  than one instance and lost on restart.
- **D. Use the host's own real-user monitoring** where it has one, and stop collecting here.
  Removes code; ties the template to one host.

## 4. Recommendation

**A, decided together with O-01.** The lines are already structured and bounded, so any log store
can group them. Until a host exists there is nothing to build, and building B first would choose
a vendor for a problem the host may solve for free.

What the fix should not do is move the budget. The budget stays in
`docs/reference/performance-budget.md`; the fix adds where the field number is read.

## 5. Acceptance criteria for the fix

- **AC-1** — A documented query or dashboard gives p75 LCP, CLS and INP per route from production
  traffic. _Why:_ the audit item; `performance-budget.md:169-178`.
- **AC-2** — `docs/reference/performance-budget.md` § 7 names where that number is read.
  _Why:_ `.claude/rules/documentation.md`: a metric nobody can locate is a wish.
- **AC-3** — `docs/how-to/releases/performance-release-checklist.md` has a step that compares
  the field figures with the budget. _Why:_ otherwise the number exists and is never looked at.
- **AC-4** — The beacon's `path` is confirmed to carry no identifier a log store should not keep,
  or is reduced before logging. _Why:_ a route such as `/metrics/<id>` puts an identifier in
  every line.

## 6. Size and shape

Unsizeable until the host is known: an hour of documentation under A, half a day or more under B.
An ephemeral todo under A; a small sweep with a decision under B. No ADR unless a vendor is
added, which is a dependency. Gates: format under A; the always-on gates under B.

## 7. Depends on, unblocks

Depends on O-01 and so on F-01. Unblocks the audit's "Field performance data" at the next dated
run. F-38 (the signed-in routes outside the Lighthouse gate) is the lab half of the same gap.

## 8. Not verified

- What any candidate host keeps of stdout, or for how long.
- The volume: the route allows 600 beacons a minute (`route.ts:18`); nobody has measured a real
  day.
- Whether `path` holds identifiers today. AC-4 exists because this was not checked.
- No reproduction was run for this kit; the grade is the audit's of 2026-10-10.
