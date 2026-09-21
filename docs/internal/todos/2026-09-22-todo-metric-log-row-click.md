# Metric log rows are inert on desktop

**Purpose:** ticket #4 from the UI-refactor follow-ups — clicking a log row on desktop does nothing.
**Owner:** hardini
**Branch:** `fix/metric-log-row-click` off `dev`

## What was wrong

`MetricLogsClient` rendered `LogTable` with `onEdit` and `onDelete` but never `onRowClick`:

```tsx
<LogTable
  logs={pages.items}
  …
  onEdit={handleEditLogClick}
  onDelete={handleDeleteClick}
/>
```

Everything below that point forwards the prop correctly — `LogTable` → `LogDesktopTable` → `Table` —
so the wiring was complete except at the top.

**This removed desktop editing rather than degrading it.** `LogDesktopTable` never destructures
`onEdit`; it renders two columns and passes only `onRowClick` through to `Table`. The mobile card
has its own edit control, so editing worked on mobile and by typing the URL, and nowhere else. That
is why it read as a broken page rather than a missing feature.

`metric-logs` was the only list in the app not passing `onRowClick` — `MetricsPageClient`,
`MetricListSection` and `MetricCategoriesPageClient` all do. An oversight, not a deliberate
difference.

## The fix

- [x] `MetricLogsClient` passes `onRowClick={handleEditLogClick}` — the same handler `onEdit`
      already used, which pushes `/metrics/<metricId>/logs/<logId>`.

No change below that line. `Table` already implements the accessible behaviour ADR-0007 requires:
`tabIndex={0}`, `aria-label="View row details"`, Enter/Space via `onKeyDown`, and a guard so clicks
originating in a nested button or link do not also fire the row handler.

## Tests

Added to `MetricLogsClient.int.test.tsx`:

- [x] clicking the row navigates to the log
- [x] focusing the row and pressing Enter navigates to the log
- [x] axe on the **populated** table — focusable rows are new interactive surface, and the
      pre-existing axe assertion covers the empty state only

**Both navigation tests were demonstrated failing first**, and for the right reason rather than by
construction: `Table` sets `aria-label="View row details"` and `tabIndex={0}` _only_ when
`onRowClick` is supplied, so before the fix the row had no accessible name and the query could not
find it —

```
TestingLibraryElementError: Unable to find an accessible element with the role "row"
and name `/view row details/i`
```

jsdom applies no CSS, so the mobile list renders alongside the desktop table; the queries scope to
`getByRole("table", { name: /metric logs table/i })` to avoid matching the mobile card instead.

## Verification

| Gate                                 | Result                                                      |
| ------------------------------------ | ----------------------------------------------------------- |
| `lint`                               | 0 errors, 17 warnings (`dev` baseline; touched files clean) |
| `lint:css`                           | clean — not triggered, no CSS changed                       |
| `typecheck`                          | clean                                                       |
| `format`                             | clean                                                       |
| `test:unit`                          | 80 suites, 669 tests                                        |
| `test:integration`                   | 19 suites, 99 tests (was 96)                                |
| `api:spec:check` / `api:types:check` | in sync — not triggered                                     |
| `build`                              | passes                                                      |
| `test:e2e`                           | skipped, not run — not triggered                            |

## Status

**Complete, with one check not done.** The browser pass was not run: the local session had expired
and signing in is not something this session can do. The behaviour is covered by the two
integration tests above, both proven failing first, plus an axe pass on the populated table — but
that is not the same as clicking a real row, and the distinction is worth keeping honest.

Worth doing when someone is signed in locally: open a metric with at least one log, click a row on a
desktop-width viewport, and confirm it opens the log. `Daily Steps`, `Body Weight` and `Sleep` all
showed "No data" on the dashboard as of 2026-09-20, so a log may need creating first.
