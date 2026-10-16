# Chart text summary — Decisions Log

`D-NN` entries scoped to this kit. `F-NN` is a row of
[`frontend-debt-register/register.md`](../frontend-debt-register/register.md).

---

## D-01 — MetricChart renders a screen-reader summary of its values

- **Status:** Accepted
- **Date:** 2026-10-16

**Context.** F-32: `docs/reference/accessibility-baseline.md` § 7.3 asks every chart for a textual
summary of its values, for example "Last 7 days: average value 72, min 60, max 90".
`MetricChart.tsx` gave the chart `role="img"` and an `aria-label` and nothing else, and the baseline
left the summary to "a page that shows a chart". Two pages show one. The dashboard card
(`MetricCardFromBatch.tsx`) prints a visible `avg / min / max / n` row that nothing ties to the
chart. The metric detail page (`Visualization.tsx`) prints nothing. Both pass a `VizResponse`,
which already carries `stats` and `meta.unit`.

**Decision.** `MetricChart` builds the summary itself from the data it is given, with
`buildChartSummary` in `viz-helpers.ts`, and renders it as a sibling `<p className="sr-only">` that
the chart's `aria-describedby` points at. The summary gives the span from the first to the last
bucket, the average, minimum and maximum with the metric's unit, the number of logs, and the goal
when a goal line is drawn. The "No data" state is unchanged. No prop changes.

**Options considered.**

- _A visible summary under every chart._ It changes the look of both pages and repeats the
  dashboard's stats row. Whether the metric page should show its figures visibly is a product
  decision, not an accessibility one.
- _A summary supplied by each page._ That was the baseline's arrangement, and it is why the detail
  page had none: the next caller would forget it again.
- _A table of every bucket._ Thirty rows for the default range, where the baseline asks for a
  summary.

**Consequences.** Every chart is described, including any future caller, at no visual cost.
Screen-reader users on the dashboard hear the figures twice, once as the chart's description and
once from the visible row; that row is left alone. The label is still the metric's id, not its
name: fixing that needs a new prop and is register row F-55.

---

## D-02 — The summary formats in the series' time zone and a fixed English locale

- **Status:** Accepted
- **Date:** 2026-10-17

**Context.** Found in review, after every gate had passed. The first cut formatted the dates with
`formatHuman` and the numbers with `Intl.NumberFormat`, both in the runtime's default locale and
time zone. The dashboard prefetches its data on the server (`src/app/(app)/dashboard/page.tsx`),
so the chart and its summary render there as well as in the browser. A server in UTC and a browser
in Jakarta would write a different day for the same bucket, and a different locale a different
date order: a hydration mismatch, and on the server a summary a day off. The stack run could not
show it, because its server and browser share one machine's zone and locale.

**Decision.** `buildChartSummary` formats each bucket start in `meta.tz`, the zone the backend
bucketed in, and writes dates and numbers in `en-GB` ("1 Feb 2026", the form `formatHuman`'s own
example gives). An unknown zone falls back to UTC rather than throwing.

**Options considered.**

- _The runtime's zone and locale._ The mismatch above.
- _Render the summary only after mount._ It leaves a server-rendered chart with no description
  until hydration, and keeps the off-by-a-day dates, since the browser's zone need not be the one
  the buckets were cut in.

**Consequences.** The summary reads the same everywhere, in English, matching the rest of the
app's copy. A reader whose own locale writes dates another way still sees "1 Feb 2026".
