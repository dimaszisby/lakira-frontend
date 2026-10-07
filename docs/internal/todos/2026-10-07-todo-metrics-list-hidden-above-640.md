# 2026-10-07 - Todo: the metrics list is blank from 640 px up wherever the page picks its mobile variant

**Context:** found by the first run of a draft end-to-end spec for the metric-to-dashboard journey
(the audit's open P1 on e2e coverage). At Cypress's 1000 x 660 viewport a metric was created and
the list showed no rows: the row was in the DOM and not visible. That spec is parked until this
lands.

## Cause

- `MetricTable` takes a `variant`. `MetricsPageClient` passes `"mobile"` below 1024 px
  (`LIST_MODE_DESKTOP_MQ` in `src/hooks/useListMode.ts`) and always in infinite mode.
  `MetricListSection`, a category's metric list, passes it in infinite mode too.
- For `"mobile"`, `MetricTable` gives the mobile list the class `block`.
- `MetricMobileTable` had `sm:hidden` among its own classes. `block` does not override a class at
  another breakpoint, so the list was hidden from 640 px up.

Inference: it dates from 2026-02-26 (0ac16cb), when `variant` was added on top of a base class
written on 2025-11-24. Nothing caught it because every signed-in spec visited the list with a new
account, which has no metrics to miss, and jsdom applies no CSS.

## Checklist

- [x] `cypress/e2e/stack/metrics-list-widths.cy.ts`: the list at 600, 800, 1000 and 1280 px, in
      paginated and infinite mode
- [x] Run against the unfixed build first, to see what actually fails
- [x] `src/features/metrics/components/MetricMobileTable.tsx`: no breakpoint class of its own;
      `MetricTable` decides
- [x] `src/features/metrics/components/__tests__/MetricMobileTable.test.tsx`: the list carries no
      `hidden` class; mutation-checked
- [x] Gates
- [x] `docs/how-to/testing/run-stack-e2e.md` names the new spec

## Discovered

- [ ] Found: `MetricCategoryMobileTable` and `LogMobileTable` carry the same `sm:hidden`. Their
      tables have no `variant`, so CSS alone picks desktop or mobile and the two agree -> out of
      scope. It becomes this defect the day either gains a variant.
- [ ] Found: the list switches variant at 1024 px in JavaScript and at 640 px in CSS. With this
      fix a 640 to 1023 px viewport gets cards on `/metrics` and the table in a category's
      paginated list -> out of scope; which one tablets should get is a design decision.
- [ ] Found: a category's metric list in infinite mode is the same component and the same defect,
      and is not browser-checked here: reaching it needs a category with metrics -> out of
      scope for the spec; covered by the unit test.

## Status

Fixed 2026-10-07 on `fix/metrics-list-hidden-above-640`. Node 24.21.0, production build, backend
on `:8001`.

Before the fix, the new spec against the unfixed build: 3 of 8 cases passed.

| Width   | Paginated | Infinite |
| ------- | --------- | -------- |
| 600 px  | shown     | shown    |
| 800 px  | blank     | blank    |
| 1000 px | blank     | blank    |
| 1280 px | shown     | blank    |

After it: 8 of 8. The full stack suite is 22 of 22.

The unit test fails when `sm:hidden` is put back (1 of 4 fails) and passes when the file is
restored, compared byte for byte. Nothing was deployed, so no user met this; no postmortem.
