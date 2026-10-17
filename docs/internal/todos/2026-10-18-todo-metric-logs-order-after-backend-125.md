# 2026-10-18 - Todo: did the log lists change order after backend #125?

**Context:** debt register row F-37, from `2026-09-30-todo-npm-audit-brace-expansion.md`
§ Discovered. Backend #125 (`2fd4e29`, merged 2026-09-30, "fix(db): make ordered queries total and
order logs by logged time") orders logs by `loggedAt` instead of `createdAt` in some queries. Whether
the frontend's log lists came back in a different order afterwards was never checked.

**Answer: no.** Nothing the frontend renders changed order. Checked by reading both repositories;
the backend on `dev` through `gh api`.

## Checklist

- [x] The list the logs tab renders. `MetricLogsClient.tsx` calls `GET /metric-logs` with an
      explicit `sort`, `-createdAt` unless the user picks another column
      (`src/features/metric-logs/sort.ts`, `defaultSort`; `api.ts`, `getMetricLogsListViaCursor`). The
      backend answers it from `MetricLogQueryRepoSequelize.ts`, whose `buildOrder` orders by the
      requested field and then `id`, and defaults to `-createdAt` too. #125 did not change that file;
      its last change is `e76f25c` (#46, 2026-05-15).
- [x] What #125 did reorder. The logs embedded in `GET /metrics/:id` (`MetricReadRepoSequelize.ts`)
      went from `createdAt DESC` to `loggedAt DESC, id DESC`. The backend adds them only when the
      request includes `logs`. No caller asks for them: `getUserMetricDetails` is called with
      `["category", "settings"]` or no includes (`metrics/[metricId]/layout.tsx`,
      `metrics/[metricId]/edit/page.tsx`,
      `metric-categories/[categoryId]/metrics/[metricId]/page.tsx`), and nothing reads
      `UserMetricDetailResponseDTO.logs`.
- [x] The rest of #125. Trend points moved to `loggedAt`, and the frontend does not call the trends
      endpoint. The dashboard query gained an `id` tie-break, which changes nothing but ties.
- [x] Found, out of scope: the log list shows newest _created_ first. A value backfilled into the
      past is listed at the top rather than where its date puts it. The backend now treats
      `loggedAt` as a log's order (#125, its ADR-0052). Whether the list should default to
      `-loggedAt` is a product choice: register row F-60, owner question O-13.

## Status

Done 2026-10-18 on `docs/metric-logs-order-after-backend-125`, docs only. Nothing was run against a
backend: the local image's age is unchecked (F-51), and the code on backend `dev` is what answers
the question.
