# 2026-10-08 - Todo: assert the dashboard's counts in the metric journey spec

**Context:** `cypress/e2e/stack/metric-to-dashboard.cy.ts` (#78) asserted no count on the dashboard
card, because the backend took a card's figures from the first bucket of the range only. Backend
#145 (`41dba33`, merged 2026-10-08) computes them over the whole series. With the counts, a browser
test would show a logged value reaching the dashboard, through the back button too, which is what
the dashboard invalidation from #76 is for and which only unit tests show.

Only the first count could be added. The other two are blocked by a second backend defect, found
here and described under "What blocks the other two counts".

## Checklist

- [x] `docs/internal/initiatives/metric-detail-contrast/README.md` says merged in #78
- [x] The spec asserts `n: 0` on the new metric's card
- [x] Run of all three count cases against the old backend image (recorded under Status)
- [x] Backend container rebuilt on #145 by the owner; confirmed from inside the container
- [x] Full stack suite on the rebuilt backend (recorded under Status)
- [x] Notion: the new record raised; "Dashboard stats describe the first bucket only" completed
- [x] Gates
- [ ] The spec asserts `n: 1` after the first value, and `n: 2` through the back button -> blocked
      by the backend; the two cases are kept below
- [ ] The back-button case fails with the invalidation removed -> waits on the item above

## What blocks the other two counts

Measured on 2026-10-08 17:04 UTC through the proxy, backend `dev` at `41dba33`, frontend `dev` at
`862f83e`. On Notion as "FE and BE messages", Part 1, "Dashboard responses stay cached in the
browser after a log changes".

- `GET /analytics/dashboard` answers with
  `Cache-Control: private, max-age=60, stale-while-revalidate=30` (backend `controller.ts:11-18`),
  and the proxy passes it to the browser. For 60 seconds the browser answers the dashboard request
  from its own cache and asks nobody.
- Its `ETag` is `sync.etagSeed`, a hash of the request's parameters and of the metrics', settings'
  and categories' `updated_at` (`deriveEtagSeed`). A log changes none of them. With one log the
  ETag was `"5tt8xTwECDwEgmNvpnSFIoHWwHo"`; after a second log a plain GET returned `count: 2`
  under the same ETag, and a GET with `If-None-Match` got 304.
- Together: a browser that has seen the dashboard keeps showing those figures after a value is
  logged, until a metric, its settings or a category is edited or the day rolls over. The
  invalidation from #76 marks the query stale and refetches, and the refetch is answered by the
  browser's cache.
- The API's figures are right: a plain GET returned `count: 1` after one log and
  `{average: 5150, min: 4200, max: 6100, count: 2}` after two.

## The two cases to add when that record is completed

They ran, and failed on `n: 0`, as written here. The back-button navigation after the failing
assertion has never run.

```ts
it("logs a value, lists it and counts it on the dashboard", () => {
  // ...the existing "logs a value and lists it" test, then:
  // A fresh visit: the page's server prefetch supplies the data whatever the client holds.
  cy.visitInTheme("/dashboard", THEME);
  cardCount().should("contain.text", "n: 1");
});

it("counts a newly logged value when the dashboard is reached with the back button", () => {
  // Going back restores the page the browser already had, and there only a query that was
  // marked stale refetches. Until #76 nothing marked the dashboard stale.
  cy.visitInTheme("/dashboard", THEME);
  cardCount().should("contain.text", "n: 1");

  cy.contains("nav a", "Metrics").click();
  cy.location("pathname").should("eq", "/metrics");
  cy.contains("button", METRIC_NAME).click();
  cy.location("pathname").should("match", /^\/metrics\/[^/]+$/);
  // log 6100 from the Logs tab, as the test above logs 4200

  // Dashboard, metrics, the metric, its logs tab: three steps back.
  cy.go(-3);
  cy.location("pathname").should("eq", "/dashboard");
  cardCount().should("contain.text", "n: 2");
});
```

Then mutation-check the second: remove `invalidateDashboardVisualizations` from
`src/features/metric-logs/hooks/create.mutation.ts`, rebuild, and watch it fail.

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
- [ ] Found: the same `max-age=60` is on `GET /analytics/metrics/:id`, whose ETag is a hash of the
      body and so does change. A metric's own chart can be up to a minute behind a new log ->
      out of scope; named in the Notion record's ask.

## Status

Partly done on `chore/dashboard-count-assertions`, 2026-10-08. Node 24.21.0, production build.

- All three count cases against the backend image of 2026-09-29: 4 of 6 cases pass. `n: 0` passes;
  `n: 1` and the back-button case read `n: 0`.
- After the owner rebuilt the container on `41dba33`: the same two fail the same way. The 22 stack
  cases that existed before #78 pass on the rebuilt backend, the first run against a current
  backend since 2026-09-29.
- The owner chose to raise it with the backend and ship what passes: the `n: 0` assertion.
