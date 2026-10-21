# Table row accessible name — Decisions

## D-01 — The caller names each clickable row, and must

> **Promoted to [ADR-0037](../../../explanation/decisions/adr-0037-a-clickable-row-is-named-by-its-caller.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-22

**Context.** Register row F-72, from `2026-10-21-todo-table-row-accessible-name.md`. `Table` gave
every clickable row `aria-label="View row details"`, so no row in the three desktop tables could
be told apart by name.

**Decision.** The owner chose option B on 2026-10-22: a label supplied by the caller.

- `Table` takes `rowLabel`, required by type whenever `onRowClick` is passed.
- The metrics table passes `Open metric <name>` and the categories table `Open category <name>`,
  as their mobile cards do.
- The logs table passes `Open log from <the cell's timestamp>`. It uses the cell's own format
  rather than the card's `formatHuman`, so the name contains the text the row shows (WCAG 2.5.3).

**Options considered.**

- _A, name from the primary cell:_ the name would be the value alone, with no action.
- _C, a link or button in the first cell:_ the conventional pattern, and the biggest change.
  Not chosen.

**Consequences.**

- `MetricLogsClient.int.test.tsx` finds the row by `/open log from/i`, and still fails when the
  client drops `onRowClick`: checked by removing that line, then restoring it.
- Each desktop table's unit suite checks that two rows get different names. axe does not check
  this.
