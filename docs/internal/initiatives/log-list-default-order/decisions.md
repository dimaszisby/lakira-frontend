# Log list default order — Decisions

## D-01 — The log list defaults to `-loggedAt`

- **Status:** Accepted
- **Date:** 2026-10-22

**Context.** Register row F-60, from `2026-10-18-todo-metric-logs-order-after-backend-125.md`. A
metric's log list opened sorted `-createdAt`, so a value backfilled into the past was listed at
the top. The backend has ordered logs by `loggedAt` since #125 (its ADR-0052). `createdAt` is not
one of the list's columns, so the list also opened with no column or chip marked as sorted. Which
order is right is a product choice, asked as O-13.

**Decision.** The owner chose newest logged first on 2026-10-22. `metricLogSort`'s `defaultSort`
in `src/features/metric-logs/sort.ts` is `-loggedAt`. The cursor key's fallback in `keys.ts`
reads the same constant, so the two cannot disagree. An explicit `sort` in the URL is honoured
as before, `-createdAt` included.

**Options considered.** Keeping `-createdAt`: rejected, a backfill stays on top and no column is
marked. A saved per-user preference: rejected, nothing asked for one. The deprecated offset path
(`normalizeList`, `sortBy ?? "createdAt"`) is left alone: the list does not use it.

**Consequences.** A log entered today for last week now lands among last week's rows, not at
the top. A user who wants entry order has no chip for it; `?sort=-createdAt` still works.
