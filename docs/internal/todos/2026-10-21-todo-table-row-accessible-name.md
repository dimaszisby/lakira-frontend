# 2026-10-21 - Todo: every clickable table row is named "View row details"

**Context:** register row F-72, seen while fixing F-34 (kit `list-variant-breakpoint`, #133). A
Cypress spec that opened a metric from the desktop table could not tell its rows apart by name.

## What is there

`src/components/ui/Table.tsx` renders each row as a focusable `<tr>`. When the caller passes
`onRowClick`, the row gets `tabIndex={0}` and `aria-label="View row details"`. All three desktop
tables pass it:

- `MetricDesktopTable`;
- `MetricCategoryDesktopTable`;
- `LogDesktopTable`.

So every row in every one of them has the same accessible name. The `aria-label` replaces the name
a row would otherwise get from its cells, so it says neither which metric, category or log the row
is, nor what activating it does.

**Inference, not tested with a screen reader:** a keyboard and screen-reader user tabbing through
a list hears "View row details" for each row and has to explore inside it to learn which one it
is. This looks like it falls short of WCAG 2.4.6 Headings and Labels (a label describes its
purpose), and possibly 2.4.4 Link Purpose in context. jest-axe and cypress-axe do not flag it,
because a duplicate name is not an axe rule.

## To decide when it is picked up

- **What names a row.** Two options:
  - the row's primary cell, such as the metric's name, through `aria-labelledby` pointing at that
    cell;
  - a caller-supplied label, for example `rowLabel={(m) => \`Open ${m.name}\`}`.

  The first keeps `Table` generic, while the second matches the mobile cards' "Open metric …"
  buttons.

- **Whether a focusable `<tr>` is the right pattern at all.** A link or button in the first cell,
  as the cards have, would be the conventional one (`accessibility.md` § Structure: links
  navigate, buttons act).

## Items

- [x] Choose the naming, and record it as a decision entry if it changes `Table`'s props
- [x] `Table.tsx` and the three desktop tables
- [x] `src/app/(app)/metrics/[metricId]/logs/_components/__tests__/MetricLogsClient.int.test.tsx`:
      its queries rely on the current label (its comment says so), so it changes with the fix
- [x] A case that fails while two rows share a name
- [x] A keyboard pass in a real browser, both themes

## Status

Done 2026-10-22 in kit `table-row-accessible-name`, PR #137. The owner chose a caller-supplied
label (option B): `Table` requires `rowLabel` wherever `onRowClick` is passed, and the three
tables name rows "Open metric ...", "Open category ..." and "Open log from <the cell's
timestamp>" ([ADR-0037](../../explanation/decisions/adr-0037-a-clickable-row-is-named-by-its-caller.md)).
A keyboard pass in Electron, both themes, tabbed through two rows of each table: each was focused
with a visible ring and named apart, and Enter or Space opened it.
