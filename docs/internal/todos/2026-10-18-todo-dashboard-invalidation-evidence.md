# 2026-10-18 - Todo: browser evidence for the dashboard invalidation, and the dashboard toggle

**Context:** debt register rows F-35 and F-36, both from
`2026-10-08-todo-dashboard-count-assertions.md` § Discovered.

- **F-35.** #76 made fifteen mutations call `invalidateDashboardVisualizations`
  (`src/features/data-visualizations/cache.ts`). No browser test showed it changing anything: the
  journey's back-button case passed with it removed, because closing the log dialog calls
  `router.refresh()`, so the dashboard is rendered on the server again and its prefetch supplies
  the new figures. The settings and metric dialogs do the same.
- **F-36.** The journey spec never took a metric off the dashboard and put it back.

Deleting a log is the one log mutation with no dialog: `MetricLogsClient.tsx` calls it from the
mobile card's "Delete" action, and nothing refreshes the router. Going back then restores the
dashboard from the router's cache, and its query, inside its 60 s `staleTime`, refetches only if
something marked it stale.

## Checklist

- [x] `cypress/e2e/stack/metric-to-dashboard.cy.ts`, "drops a deleted value from the dashboard
      reached with the back button": at 600 px, where the log list is cards (the desktop table has
      no delete control). Dashboard at `n: 2`, then the metric's logs, "More actions", "Delete",
      three steps back, and `n: 1`.
- [x] Seen to fail: with the `invalidateDashboardVisualizations` call removed from
      `src/features/metric-logs/hooks/delete.mutation.ts` on a scratch build, that case read
      `n: 2` and failed; the spec's other eight passed. The file was restored before the real
      build, `git diff` empty. The case took 2.8 s on the real build, well inside the 60 s
      `staleTime`, so it does not pass by the query going stale on its own.
- [x] "takes the metric off the dashboard from its settings": "Show on Dashboard" off, saved; the
      dashboard shows "No dashboard metrics yet". It is the account's only metric, so the empty
      state shows the page loaded without the card rather than before it.
- [x] "puts the metric back on the dashboard from its settings": switched on, saved; the card is
      back with `n: 1`.
- [x] The spec's header comment says which case needs the invalidation and why.
- [x] `docs/how-to/testing/run-stack-e2e.md` names the two new steps of the journey.
- [x] Gates

## Status

Done 2026-10-18 on `test/dashboard-invalidation-evidence`. Node 24.21.0, production build, backend
on `:8001`.

The journey spec is 9 of 9; the full stack suite is 48 of 48. Unit 1024, integration 142.

What this shows and does not: the delete-log mutation's call changes what a user sees. The other
fourteen calls are still shown only by their `dashboard-invalidation` unit tests. Those mutations
run from a dialog that refreshes the router, so no browser path is known on which they matter.
The F-36 cases do not depend on the invalidation, since Save goes through the settings dialog,
which refreshes.
