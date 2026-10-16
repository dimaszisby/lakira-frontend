# Chart text summary — Checklist

## Phase 0 — Describe every chart

- [x] `src/features/data-visualizations/viz-helpers.ts`: `buildChartSummary(data, goalValue)`
      gives the span from the first to the last bucket, the average, minimum and maximum with the
      unit, the number of logs, and the goal when one is drawn (D-01). Dates in `meta.tz` and
      `en-GB` (D-02)
- [x] `MetricChart.tsx`: a sibling `<p className="sr-only">` with the summary, pointed at by the
      chart's `aria-describedby` (`useId`); the "No data" state unchanged; no prop changed
- [x] `__tests__/viz-helpers.test.ts` (new), `MetricChart.test.tsx`,
      `DashboardContent.int.test.tsx`: each new assertion seen to fail on the unchanged chart
- [x] `cypress/e2e/stack/chart-summary.cy.ts` (new): the real backend's figures on both pages

## Discovered

- [x] Found: the chart's label is `Metric chart for <metric id>`, a UUID, so the baseline's
      "label describing what the chart shows" holds only in form. Naming the metric needs a new
      `MetricChart` prop → out of scope, register row F-55.
- [x] Found in review: the dashboard renders the chart on the server, so dates and numbers in the
      runtime's zone and locale could differ between server and browser → in scope, D-02.

## Acceptance

- [x] AC-1 — The metric page's chart has an accessible description giving the span, average,
      minimum, maximum and log count. Machine: `chart-summary.cy.ts` against the local stack
      reads "average 7 cups, minimum 6 cups, maximum 8 cups, from 2 logs." through the chart's
      `aria-describedby`. _Why:_ `docs/reference/accessibility-baseline.md` § 7.3; WCAG 1.1.1.
- [x] AC-2 — The same holds on a dashboard card's chart. Machine: `DashboardContent.int.test.tsx`
      (`toHaveAccessibleDescription`) and `chart-summary.cy.ts`. _Why:_ as AC-1.
- [x] AC-3 — The summary follows the data: the unit when there is one, at most two decimals, a null
      figure left out, "1 log" singular, the goal only when drawn, and each date in the zone the
      backend bucketed in. Machine: `viz-helpers.test.ts`. _Why:_ a summary that misstates the
      chart is worse than none.
- [x] AC-4 — Nothing changes visually, the empty state is unchanged, and axe passes. Machine: the
      existing unit and integration suites with their axe checks, and `app-pages.a11y.cy.ts` in
      the stack run. _Why:_ D-01 chose a hidden summary to leave the look alone.

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — plus `coverage:check`
- [x] integration
- [x] spec drift — `api:spec:check`
- [x] build
- [x] e2e (stack) — 30 of 30, the new spec included
- [ ] e2e, e2e (csp), e2e (csp, stack) — skipped: no public page, policy or layout changed, and
      the change adds no script or style

## Evidence

The stack run's new spec created a metric with the unit "cups" and logged 6 yesterday and 8 today
through the proxy. On `/dashboard` and on `/metrics/<id>`, the chart's description read "average
7 cups, minimum 6 cups, maximum 8 cups, from 2 logs."

The server and the browser shared one zone in that run, so it does not show D-02's mismatch either
way. D-02 rests on its unit cases, which give the same text in any runtime zone.
