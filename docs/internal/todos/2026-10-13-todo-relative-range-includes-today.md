# 2026-10-13 - Todo: show that a value logged today reaches the dashboard

**Context:** debt register row F-10. For a metric that already had logs inside the requested
range, a value logged today was missing from the dashboard until the next day. The defect was
the backend's: a relative range ended at the start of the current day in UTC. Backend #163
(`c8e1a87`, merged 2026-10-13) ends the range with the current bucket. Nothing in this app
needed to change; what was missing was evidence that the app now shows the value.

The register's analysis asked only for a re-run of the count assertions in
`cypress/e2e/stack/metric-to-dashboard.cy.ts`. That re-run shows nothing: the spec's metric is
new on every run, and a metric with nothing in the range was answered from the range of its
latest logs, so it passed before the fix as well as after. The case that failed needs a metric
with an older log.

## Checklist

- [x] Read every use of the three values backend #163 moved (recorded below)
- [x] `cypress/e2e/stack/dashboard-counts-today.cy.ts`: a metric with a log dated 24 hours ago
      and one dated now reads `n: 2` on its dashboard card
- [x] `cypress/support/dashboard.ts` holds `cardCount`, shared with the journey spec
- [x] The journey spec's comment on why a value logged today is counted says what is true now
- [x] The new spec run against the backend image without the fix: it fails with `n: 1`
- [x] Backend container rebuilt by the owner on a checkout that includes #163; confirmed by a
      relative range whose `meta.range.endISO` is later than now
- [x] The new spec and the whole stack suite on the rebuilt backend
- [x] Gates
- [x] Register: F-10 closed

## What this app reads of the values that moved

Backend #163 says three values move and that it could not confirm no frontend code minds.
Read on 2026-10-13 at `2b903d3`:

- `meta.range.endISO`, now in the future for a relative range. `DashboardContent.tsx` passes
  `meta.range` to `MetricCardFromBatch`, which passes it into `MetricChart`. `MetricChart` reads
  `meta.unit`, `meta.metricId` and `meta.bucket`, and never the range. Nothing displays it or
  computes from it.
- `firstLogAt` and `lastLogAt`, now the stored instants. No file under `src/` names either,
  outside the generated types.
- A fallback's `actualRange.endISO`, now a bucket edge, and `requestedRange`. No file under
  `src/` names either.

## Discovered

- [x] Found: the local backend container was an image built on 2026-10-10 with no source mount,
      so the stack runs reported for #91 and #92 on 2026-10-13 tested a backend three days
      behind `dev`. The same thing was found on 2026-10-08
      (`2026-10-08-todo-dashboard-count-assertions.md`) -> in scope as far as having it rebuilt
      and re-running the suite. Nothing checks the image's age before a stack run: register
      row F-51.

## Status

Done on `test/relative-range-includes-today`, 2026-10-13. Node 24.21.0, production build on
port 3000. No runtime code changed.

- Against the backend image of 2026-10-10, which lacks #163: the new spec fails, the card reading
  `n: 1` where `n: 2` is expected. So the spec tests the fix.
- The owner rebuilt the container at 2026-10-13T13:08Z. The backend checkout's history puts it
  on `fix/domain-imports-no-application` at `83a81cd` seventeen seconds earlier, which is backend
  `dev` at `7cbe2db` plus that one commit; the image itself records no commit. It holds
  `relative-range.ts`, and `GET /analytics/dashboard?last=30d` through the proxy at 17:25Z
  returned a range ending `2026-10-14T17:00:00.000Z`, the end of the current day in
  `Asia/Jakarta`.
- Against that image: the new spec passes with `n: 2`; the stack suite passes with 29 cases in
  six specs; the CSP stack suite passes with 7 cases. No existing spec needed a change for the
  newer backend.
- Gates: lint, css lint, typecheck, format, unit (982, `coverage:check` passes), build and
  `api:spec:check` pass. Integration, e2e and e2e (csp) were not run: no runtime code and no
  public page changed.
- The stack runs reported for #91 and #92 earlier the same day ran against the 2026-10-10
  image. The run above repeats the same specs against the newer one.
