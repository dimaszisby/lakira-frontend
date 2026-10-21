# ADR-0037 — A clickable table row is named by its caller

- **Status:** Accepted
- **Date:** 2026-10-22
- **Origin:** kit `table-row-accessible-name`, D-01 — [`decisions.md`](../../internal/initiatives/table-row-accessible-name/decisions.md); debt register row F-72

---

## Context

`Table` (`src/components/ui/Table.tsx`) makes a row clickable when its caller passes
`onRowClick`. That row becomes a focusable `<tr>`, with `tabIndex={0}` and Enter and Space wired
to the handler. It also got a fixed `aria-label="View row details"`.

Three desktop tables pass `onRowClick`: `MetricDesktopTable` (on `/metrics` and a category's
page), `MetricCategoryDesktopTable` and `LogDesktopTable`. Every row in all of them therefore had
the same accessible name. The `aria-label` replaced the name the row would otherwise get from its
cells, so the name said neither which item the row was nor what activating it would do. Neither
jest-axe nor cypress-axe flags this, because axe has no rule for duplicate names.

The mobile cards for the same items already name themselves: "Open metric …", "Open category …",
"Open log from …".

## Decision

The owner chose this on 2026-10-22.

- **The caller names each clickable row.** `Table` takes `rowLabel: (item: T) => string`, and its
  result is the row's `aria-label`.
- **`rowLabel` is required wherever `onRowClick` is passed.** `TableProps` is a union: either both
  or neither. A clickable row with no name is a compile error, and
  `src/components/ui/__tests__/Table.test.tsx` pins this with `@ts-expect-error`.
- **The wording is the mobile card's: the action, then the item.** "Open metric Running",
  "Open category Health".
- **When the row shows the item's text, the name contains that text** (WCAG 2.5.3, Label in
  Name). A log row's name uses the timestamp its cell shows, not the card's shorter format.
- **The row stays a focusable `<tr>`.** Only its name changed.

## Options considered

- **Name each row from its primary cell, with `aria-labelledby`.** Not chosen. `Table`'s props
  would stay generic, but the name would be the bare value ("Running", a timestamp) with no
  action. Each table would still have to say which cell is primary.
- **Stop making `<tr>` focusable and put a link or button in the first cell.** Not chosen. It is
  the conventional pattern (links navigate, buttons act), but it is the biggest change: the
  table's structure, its focus styles, its keyboard model and the metrics table's prefetch on
  hover would all move. Open as a later step if the focusable row proves wrong in use.

## Consequences

- **A new clickable table supplies `rowLabel` or does not compile.** No shared default name
  remains to repeat.
- **Tests find a row by its name** (`getByRole("row", { name: /open log from/i })`). Each table's
  suite checks that two rows' names differ, because axe does not check that.
- **The Cypress specs that open a metric from the table are unaffected.** They select the row by
  its visible text (`tr:contains(...)`), not by its name.
