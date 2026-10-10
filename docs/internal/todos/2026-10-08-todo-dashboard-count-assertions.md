# 2026-10-08 - Todo: assert the dashboard's counts in the metric journey spec

**Context:** `cypress/e2e/stack/metric-to-dashboard.cy.ts` (#78) asserted no count on the dashboard
card, because the backend took a card's figures from the first bucket of the range only. Backend
#145 (`41dba33`, merged 2026-10-08) computes them over the whole series. With the counts, a browser
test shows a logged value reaching the dashboard, through the back button too.

It took two rounds. #79 added the first count only, because a second backend defect kept the
dashboard's old figures in the browser. Backend #147 (`d8f5351`, merged 2026-10-09) fixed that, and
the other two counts followed on `chore/dashboard-counts-after-log`.

## Checklist

- [x] `docs/internal/initiatives/metric-detail-contrast/README.md` says merged in #78
- [x] The spec asserts `n: 0` on the new metric's card
- [x] Run of all three count cases against the old backend image (recorded under Status)
- [x] Backend container rebuilt on #145 by the owner; confirmed from inside the container
- [x] Full stack suite on the rebuilt backend (recorded under Status)
- [x] Notion: the new record raised; "Dashboard stats describe the first bucket only" completed
- [x] Gates
- [x] The spec asserts `n: 1` after the first value, and `n: 2` through the back button
- [x] The back-button case run with the invalidation removed -> it still passes; see "What the
      back-button case proves"

## What blocked the other two counts, until backend #147

Measured on 2026-10-08 17:04 UTC through the proxy, backend `dev` at `41dba33`, frontend `dev` at
`862f83e`. On Notion as "FE and BE messages", Part 1, "Dashboard responses stay cached in the
browser after a log changes".

- `GET /analytics/dashboard` answered with
  `Cache-Control: private, max-age=60, stale-while-revalidate=30`, and the proxy passes it to the
  browser. For 60 seconds the browser answered the dashboard request from its own cache.
- Its `ETag` was `sync.etagSeed`, a hash of the request's parameters and of the metrics', settings'
  and categories' `updated_at`. A log changes none of them. With one log the ETag was
  `"5tt8xTwECDwEgmNvpnSFIoHWwHo"`; after a second log a plain GET returned `count: 2` under the
  same ETag, and a GET with `If-None-Match` got 304.
- The API's figures were right: a plain GET returned `count: 1` after one log and
  `{average: 5150, min: 4200, max: 6100, count: 2}` after two.

Backend #147 hashes the response body for the ETag on both analytics routes and sends
`Cache-Control: private, no-cache`.

## What the back-button case proves

It proves that a user who logs a value and goes back to the dashboard sees the new count. It does
not prove that the dashboard invalidation from #76 does anything.

Measured on 2026-10-09: with `invalidateDashboardVisualizations` removed from
`src/features/metric-logs/hooks/create.mutation.ts` and the app rebuilt, the case still passed, and
the browser made no request to `/api/proxy/analytics/dashboard` after going back. The new figures
came from the server. Closing the log dialog calls `router.refresh()`
(`src/features/metric-logs/components/MetricLogFormDialog.tsx:19-21`), so going back renders the
dashboard page on the server again, and its prefetch hydrates the query with newer data. The file
was restored and compared with `git diff` before the gates ran.

The owner chose to keep the case, described as what it is.

Why a count is expected at all for a value logged today, read from backend `dev` at `41dba33`:
`last=7d` with a `1d` bucket ends at 00:00 UTC today (`anchorNow`, `schema.zod.ts:44`), so the
value is outside the requested range, and a metric with nothing in that range is answered from the
range of its latest logs. The spec's metric is always new, so it is always on that path.

## Discovered

- [x] Found: the local backend container had no source mount and an image built on 2026-09-29,
      so every stack run from then until 2026-10-08 tested a backend about twenty pull requests
      behind `dev` -> in scope as far as rebuilding it and re-running the suite.
      `docs/how-to/testing/run-stack-e2e.md` already says to rebuild; nothing checks it.
- [ ] Found: the parked draft also took the metric off the dashboard from its settings and put it
      back. Not a count assertion -> out of scope.
- [ ] Found: with `tz=UTC` the same metric came back with `count: 0` and an empty series, its one
      log dated that day; with `tz=Asia/Jakarta` it was counted. Inference: the fallback range
      ends at `lastLogAt` exclusively, and the Jakarta request passes only because `lastLogAt` is
      shifted seven hours forward -> out of scope; added to the Notion record "Relative ranges
      exclude today; lifecycle timestamps are shifted".
- [x] Found: the same `max-age=60` was on `GET /analytics/metrics/:id` -> fixed by backend #147.
- [ ] Found: the dashboard invalidation from #76 has no browser evidence. No path was found on
      which it changes what the user sees; only its unit tests show it -> out of scope.
- [ ] Found: a second value logged in the same minute is refused. The form rounds the time to the
      minute (`toISOZ`, `src/utils/date-io.ts:73-79`) and the backend keeps one log per timestamp
      per metric (`CreateMetricLog.ts`, 409). The dialog then shows "Request failed with status
      code 409", not the backend's "A log entry already exists for this timestamp for this
      metric" -> out of scope. The spec logs its second value at another minute.
- [ ] Found: in the log form's time picker, choosing minute 0 changed nothing when the current
      minute was 02; the field stayed at 9:02 PM. Seen once, in Cypress. Inference: the minute
      list steps by five, so at minute 02 no option matches, the list shows its first option, 0,
      and choosing it is not a change -> out of scope, not reproduced by hand.

## Status

Done on `chore/dashboard-counts-after-log`, 2026-10-09. Node 24.21.0, production build, local
backend rebuilt on backend `dev` at `a7b1b0d`.

- 2026-10-08, all three count cases against the backend image of 2026-09-29: `n: 0` passed; `n: 1`
  and the back-button case read `n: 0`. The same after the owner rebuilt the container on
  `41dba33`. #79 shipped the `n: 0` assertion.
- 2026-10-09, after backend #147: the spec's six cases pass, and the stack suite passes with 28
  cases.
- The first helper for reading the count never matched a card with values: it looked for a word
  break before `n:`, and the card's text runs together as `max: 4200n: 1`. It now matches the
  count's own element.
