# Table row accessible name — Checklist

Register row F-72. Every clickable row in the three desktop tables was named "View row details".
The owner chose a label supplied by the calling table ([D-01](decisions.md), promoted to
ADR-0037).

## Code

- [x] `src/components/ui/Table.tsx`: `rowLabel` added and required by type wherever `onRowClick`
      is passed (a union on `TableProps`); the row's `aria-label` is `rowLabel(item)`. The
      `"View row details"` literal is gone
- [x] `src/features/metrics/components/MetricDesktopTable.tsx`: `Open metric <name>`. It covers
      `/metrics` and a category's page
- [x] `src/features/metric-categories/components/MetricCategoryDesktopTable.tsx`:
      `Open category <name>`
- [x] `src/features/metric-logs/components/LogDesktopTable.tsx`: `Open log from <timestamp>`,
      using the timestamp the cell shows

## Tests

- [x] `src/components/ui/__tests__/Table.test.tsx`:
  - rows are named from `rowLabel`;
  - no two rows share a name;
  - a row without `onRowClick` has no name and is not focusable;
  - `onRowClick` without `rowLabel` does not compile (`@ts-expect-error`; typecheck is the
    gate);
  - the three existing row-click cases pass `rowLabel`.
- [x] `MetricDesktopTable`, `MetricCategoryDesktopTable` and `LogDesktopTable` unit suites: two
      rows, each named after its item
- [x] `MetricLogsClient.int.test.tsx`: finds the row by `/open log from/i`; comment updated
- [x] Stack specs `metric-to-dashboard`, `log-time-picker` and `metrics-list-widths`: no edit
      needed. They select by `tr:contains(...)`, not by name, and pass

## Docs and rules

- [x] ADR-0037 and its registry row; D-01 carries the promotion banner
- [x] `.claude/rules/accessibility.md` § Every interactive element: clickable rows are named by
      `rowLabel`
- [x] `2026-10-21-todo-table-row-accessible-name.md`: boxes ticked, `## Status` appended
- [x] Register: F-72 closed with #137, "As of" moved to `c1821df`, and F-73 added for the Notion
      record "A new error-envelope key reaches the browser only once the frontend lists it"
      (N1, tier 5, owed to BE); the register README's status line

## Discovered

- [x] Found: no `docs/reference/components/` page documents `Table`'s props → nothing to update
- [x] Found: two items that show the same text still share a name, such as two logs whose dates
      are both invalid ("N/A") → in scope only as a note. Their rows are indistinguishable on
      screen too, so the name matches what is shown

## Acceptance

- [x] No two clickable rows in a desktop table share a name; each says the action and the item.
      _Why:_ F-72; WCAG 2.4.6. · **jest**, the four suites above, written first and seen to fail
      against the old `Table.tsx` (5 cases). **Keyboard pass**, below.
- [x] "View row details" appears nowhere in `src/`. _Why:_ no shared default name is left to
      repeat. · `grep -rn "View row details" src` matches nothing.
- [x] `onRowClick` without `rowLabel` fails typecheck. _Why:_ the next clickable table cannot
      ship unnamed rows (ADR-0037). · **typecheck**: against the old `Table.tsx` the
      `@ts-expect-error` was unused (TS2578).
- [x] Mouse, Enter and Space behave as before, and interactive cells still don't trigger the
      row. _Why:_ only the name was to change. · **jest**, the existing `Table` cases, unchanged
      and passing. `MetricLogsClient.int` still fails when the client drops `onRowClick`: checked
      by deleting that line, running it (3 failed), and restoring the file (`git diff` empty).
- [x] **Manual keyboard pass, in a real browser.** Electron through Cypress, with real key presses
      (`cy.press`), a production build and the local stack, in both themes. A temporary spec,
      deleted after the run, tabbed from each table's last sort button through two rows. In
      `/metrics`, the categories list and a metric's logs, each row was a focused `<tr>` with a
      visible outline and its own name, and Enter (metrics, logs) or Space (categories) opened
      it. 6 of 6.

## Gates

Run 2026-10-22 on Node 24.21.0, against a production build with CI's environment and the local
backend at `53f6bce` (backend `dev`).

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with coverage: 1123 tests; 56.81 / 46.97 / 51.3 / 56.3 %, every folder goal met
- [x] integration: 173 tests
- [x] spec drift: `api:spec:check` (33 paths) and `api:types:check` in sync; `security:audit` clean
- [x] build
- [x] e2e and e2e (csp): 18 and 7 tests
- [x] e2e (stack) and e2e (csp, stack): 69 and 8 tests
