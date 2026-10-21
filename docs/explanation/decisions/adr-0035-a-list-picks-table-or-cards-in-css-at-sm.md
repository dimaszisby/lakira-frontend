# ADR-0035 — A list picks table or cards in CSS, at `sm`

- **Status:** Accepted
- **Date:** 2026-10-21
- **Origin:** kit `list-variant-breakpoint`, D-01 — [`decisions.md`](../../internal/initiatives/list-variant-breakpoint/decisions.md); debt register row F-34, owner question O-07

---

## Context

Each list renders a desktop table and a mobile card list, and something decides which of the two
shows. Until this decision two mechanisms decided it, at two widths:

- **In CSS, at Tailwind's `sm` (640 px):**
  - a category's metric list (`MetricListSection.tsx`);
  - the categories list (`MetricCategoryTable.tsx`);
  - a metric's logs (`LogTable.tsx`).

  Each renders both variants, and the desktop table carries `hidden sm:block` while the cards
  carry `sm:hidden`.

- **In JavaScript, at 1024 px:** `/metrics` in paginated mode, through
  `useMediaQuery(LIST_MODE_DESKTOP_MQ)` in `MetricsPageClient.tsx`. The categories page also showed
  its sort chips by the same query.

So between 640 and 1023 px:

- `/metrics` showed cards, and a category's list showed the table, for the same metrics;
- the categories page showed its sort chips beside a table whose headers already sort.

`useMediaQuery` answers `false` on the server, so a desktop visit to `/metrics` also rendered cards
before hydration and then swapped to the table.

## Decision

The owner chose this on 2026-10-21.

- **A paginated list shows the table from 640 px and the cards below it.** The page renders both
  variants and CSS shows one, at `sm`. No list picks its variant in JavaScript.
- **Sort chips sort the cards, so they carry `sm:hidden` and show exactly when the cards do.**
  They are on `/metrics` and the categories page.
- **Infinite mode is unchanged.** `/metrics` and a category's metric list keep `variant="mobile"`,
  cards at every width, and the categories list keeps switching at `sm` as it always did.
- **`lg` (1024 px) stays the shell's breakpoint:** sidebar or bottom bar, and the pages'
  `Card` wrapper. `LIST_MODE_DESKTOP_MQ` remains for that, and for `useListMode`'s default mode.

## Options considered

- **Cards until 1024 px, every list.** Rejected by the owner. It would have matched the shell's
  `lg`, but it changes three lists that were consistent in order to match the one that was not.
- **Keep the JavaScript switch and move the others to it.** Rejected for the same reason, and
  because it keeps the server-rendered cards that a desktop then swaps out.

## Consequences

- **A new list renders both variants and lets CSS choose:** `hidden sm:block` on the table, and
  `sm:hidden` on the cards and their chips. A variant prop remains for a section that must always
  show one, as infinite mode does.
- **Tests choose a variant explicitly.** jsdom applies no CSS, so a suite finds two copies of
  each row and scopes its queries to the table or the card list.
  `cypress/e2e/stack/metrics-list-widths.cy.ts` checks the visible variant and the chips at 600,
  800, 1000 and 1280 px on `/metrics`, a category's page and the categories page.
- **The visual swap after hydration on a desktop `/metrics` is gone.** The server renders both
  variants and CSS shows the right one at first paint.
