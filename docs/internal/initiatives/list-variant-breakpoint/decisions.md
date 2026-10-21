# List variant breakpoint — Decisions

## D-01 — A paginated list shows the table from 640 px, chosen in CSS

> **Promoted to [ADR-0035](../../../explanation/decisions/adr-0035-a-list-picks-table-or-cards-in-css-at-sm.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-21

**Context.** Register row F-34, from `2026-10-07-todo-metrics-list-hidden-above-640.md`
§ Discovered.

- **`/metrics` was out of step.** It chose its paginated variant in JavaScript at 1024 px. Three
  other lists chose in CSS at `sm`: a category's metric list, the categories list and the logs.
- **What a tablet saw:** cards on `/metrics` and the table in a category's list. The categories
  page also showed its sort chips by the same 1024 px query, so a tablet got chips beside a
  sortable table.

**Decision.** The owner answered O-07 on 2026-10-21: the table from 640 px.

- `/metrics` renders both variants in paginated mode (`MetricTable`'s default `"both"`).
- The sort chips on `/metrics` and on the categories page carry `sm:hidden` instead of a
  JavaScript test.
- Infinite mode is unchanged.

**Options considered.**

- _Cards until 1024 px:_ matches the shell's `lg`, but moves three consistent lists to match the
  one that was not. Not chosen.
- _Keep the JavaScript switch everywhere:_ keeps the server rendering cards that a desktop then
  swaps for the table.

**Consequences.**

- **Integration suites see both variants.** `MetricsPageClient.int` and its dummy suite scope
  their queries to the table or the card list.
- **`isDesktopViewport` stays on both pages, for the `Card` wrapper at `lg`.** That is the shell's
  breakpoint, not the list's.
