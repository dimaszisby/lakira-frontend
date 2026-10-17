# 2026-10-17 - Todo: the mobile lists stop hiding themselves; a category's list gets a width check

**Context:** debt register row F-34, its second and third items, from
`2026-10-07-todo-metrics-list-hidden-above-640.md` § Discovered. That fix took `sm:hidden` off
`MetricMobileTable` and let `MetricTable` decide. Two other mobile lists still carried the class,
and a category's metric list, which renders the same table, had no browser check. The first item,
which variant a 640 to 1023 px viewport should get, waits on owner question O-07 and is not here.

## Checklist

- [x] `MetricCategoryMobileTable.tsx`, `LogMobileTable.tsx`: no breakpoint class of their own.
      Their parents, `MetricCategoryTable.tsx` and `LogTable.tsx`, pass `sm:hidden`, so both pages
      show what they did before. Today the parents always render both variants, so nothing was
      wrong; the class would have blanked the list from 640 px up the day either table gained a
      `variant`, as `MetricTable` has.
- [x] Unit cases, written first and seen to fail (4 of 16): each mobile table carries no `hidden`
      class, and each parent passes `sm:hidden`. The second pair keeps the desktop and mobile
      variants from both showing from 640 px up.
- [x] `cypress/e2e/stack/metrics-list-widths.cy.ts`: the metric is created in a category, and the
      category's page is checked at the same four widths in both list modes; 8 new cases.
- [x] The spec seen to fail: with `sm:hidden` put back into `MetricMobileTable.tsx` on a scratch
      build (the file restored afterwards, `git diff` empty), 8 of 17 failed. They were the five
      `/metrics` cases that were blank on 2026-10-07, and the category list in infinite mode at
      800, 1000 and 1280 px.
- [x] Found and fixed in the spec: `cy.contains` yields the first match in the DOM. A category's
      paginated list renders both variants, so at 600 px it found the hidden desktop cell and
      failed on a correct page. The check now takes the innermost elements holding the name and
      asserts one is visible.
- [x] `docs/how-to/testing/run-stack-e2e.md` mentions the category list.
- [x] Gates

## Status

Done 2026-10-17 on `refactor/mobile-lists-breakpoint-class`. Node 24.21.0, production build,
backend on `:8001`.

The widths spec is 17 of 17 on the real build; the full stack suite is 45 of 45. Unit 1024,
integration 142.

Not browser-checked: the categories list and the logs list at each width. The first because the
backend answers a repeated category list query with a 500 (F-57). The parent-table unit cases hold
their classes.
