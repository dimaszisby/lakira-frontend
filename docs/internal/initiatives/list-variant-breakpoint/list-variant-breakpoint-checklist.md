# List variant breakpoint — Checklist

Register row F-34. Between 640 and 1023 px, `/metrics` showed cards and a category's list the
table, and the categories page showed its sort chips beside its table. The owner chose the table
from 640 px (O-07, [D-01](decisions.md), promoted to ADR-0035).

## Code

- [x] `src/app/(app)/metrics/_components/MetricsPageClient.tsx`: `paginatedTableVariant` removed.
      The paginated `MetricTable` takes the default `"both"`, and its `SortChipGroup` always
      renders with `sm:hidden`. The infinite section is unchanged
- [x] `src/app/(app)/metric-categories/_components/MetricCategoriesPageClient.tsx`: the sort chips
      lose their `!isDesktopViewport` test and carry `sm:hidden`

## Tests

- [x] `MetricsPageClient.int.test.tsx`:
  - paginated mode renders the table and the card list, with the list and the chips carrying
    `sm:hidden`;
  - infinite mode renders cards only, with chips that do not.

  The two existing row cases scope to one variant.

- [x] `MetricsPageClient.dummy.int.test.tsx`: its delete case scopes to the card list, which
      carries the swipe actions
- [x] `MetricCategoriesPageClient.int.test.tsx`: the chips carry `sm:hidden` in both modes
- [x] `cypress/e2e/stack/metrics-list-widths.cy.ts`:
  - **paginated mode:** at 600, 800, 1000 and 1280 px, the visible variant on `/metrics` and a
    category's page, and the chips on `/metrics`;
  - **the categories page:** added, in both modes, with its variant and chips;
  - **coverage:** 25 cases, up from 17.

## Docs and rules

- [x] ADR-0035 and its registry row; D-01 carries the promotion banner
- [x] `.claude/rules/styling.md` § Hard rules, enforced by review: lists switch in CSS at `sm`
- [x] `docs/how-to/testing/run-stack-e2e.md`: the widths spec covers the categories list
- [x] Register: F-34 closed, O-07 removed, "As of" moved; the register README's status line
- [x] `2026-10-07-todo-metrics-list-hidden-above-640.md`: its open Found box ticked, pointing here

## Discovered

- [x] Found: the categories page showed its sort chips by the same 1024 px query, beside its
      table between 640 and 1023 px → in scope, the same rule
- [x] Found, in the spec: `should("not.be.visible")` fails on an element that is not rendered.
      The old `/metrics` renders only one variant, so four cases failed on absence, not on a
      wrong variant → in scope; "not shown" now means hidden or absent
- [x] Found, in the full stack suite: two specs opened a metric by its card's button, which is
      hidden at Cypress's default 1000 px now that the table shows there:
      `metric-to-dashboard.cy.ts` (7 of 9 failed, the journey stopping at the first click) and
      `log-time-picker.cy.ts` → in scope; both click whichever variant is visible
- [x] Found: the dark-theme metrics table at 1000 px fails `color-contrast` on the category chip,
      4.11:1, which is F-56 (owner question O-12), excluded until now at 1280 px only. The table
      shows from 640 px, so tablets in the dark theme now meet a known defect they did not
      before → in scope as far as the spec goes: `app-pages-with-data.a11y.cy.ts` leaves the
      metrics list out in the dark theme wherever the table shows, and the F-56 row says so. The
      defect itself stays with O-12

## Acceptance

- [x] From 640 px a paginated list shows the table, and below it the cards, on `/metrics`, a
      category's page and the categories page. _Why:_ F-34; one rule for every list. ·
      **Cypress**, `metrics-list-widths.cy.ts`. Against a production build of the old pages, 6
      of 25 failed: `/metrics` paginated at 800 and 1000 px, and the categories chips at 800 and
      1000 px in both modes.
- [x] Sort chips show exactly when the cards do. _Why:_ a table's headers already sort, so chips
      beside one repeat them. · **jest**, both page suites, written first and seen to fail
      (3 cases). **Cypress**, the same spec.
- [x] Infinite mode is unchanged: cards at every width on `/metrics` and a category's page. _Why:_
      the owner's answer covered paginated mode. · **jest**, the infinite case, which passes
      before and after. **Cypress**, the infinite cases pass on both builds.
- [x] `/metrics` renders the same variant on the server and after hydration. _Why:_ the server
      snapshot of the media query was `false`, so a desktop got cards and then the table. · By
      construction: no list variant depends on `useMediaQuery` any more. Nothing measures the
      first paint.

## Gates

Run 2026-10-21 on Node 24.21.0, against a production build with CI's environment and the local
backend at `2c1c098` (backend `dev`).

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with coverage: 1116 tests; 56.79 / 46.95 / 51.2 / 56.28 %, every folder goal met
- [x] integration: 173 tests
- [x] spec drift: `api:spec:check` (33 paths) and `api:types:check` in sync; `security:audit` clean
- [x] build
- [x] e2e and e2e (csp): 18 and 7 tests
- [x] e2e (stack) and e2e (csp, stack): 69 and 8 tests. The first stack run failed 9 of 70 on the
      two findings above; this is the run after them
