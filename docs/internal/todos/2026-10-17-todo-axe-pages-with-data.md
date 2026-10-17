# 2026-10-17 - Todo: run axe on signed-in pages with data on them

**Context:** debt register row F-33. The 2026-10-10 audit
(`docs/internal/audits/saas-readiness/audit-2026-10-10.md`, § 7) noted that no browser or jsdom
suite ran axe on a dashboard with cards or a metrics list with rows:
`cypress/e2e/stack/app-pages.a11y.cy.ts` uses a new account, so it only sees empty states.
`metric-to-dashboard.cy.ts` already checks the metric's own pages with a metric and a log.

## Checklist

- [x] `cypress/e2e/stack/app-pages-with-data.a11y.cy.ts`: one category (the form's default colour
      and icon), one metric in it and two logs, created through the proxy; axe on `/dashboard`
      and `/metrics` at 1000 px and 1280 px (either side of the 1024 px switch to the desktop
      table), in both themes. Each check waits for the metric's name before axe runs.
- [x] The guard seen to work: the same spec with the seed removed failed all 7 checks on the
      missing name, instead of passing on empty pages. The probe was deleted.
- [x] Found and fixed: the chart's `<canvas>` had `role="img"` and no name (axe `role-img-alt`,
      serious, on all four dashboard checks). `react-chartjs-2` gives its canvas that role; it sits
      inside `MetricChart`'s labelled wrapper. The canvas is now `aria-hidden`. The unit case in
      `MetricChart.test.tsx` failed before the fix.
- [x] Found, out of scope: the category chip's text is 4.11:1 on its tint in the desktop metrics
      table in the dark theme (`#f2f2f2` on `#757575`, WCAG 1.4.3 asks 4.5:1), with the default
      colour `#D9D9D9`. `CategoryChip.tsx` tints the user's colour to 20 % in JS and picks the text
      colour without knowing the theme or the surface beneath. Register row F-56, owner question
      O-12. That combination is left out of the spec until it closes.
- [x] Found, out of scope: the backend answers every repeat of the category list query with a 500
      (`TypeError: Cannot read properties of undefined (reading 'toISOString')` at
      `MetricCategoryMapper.ts:51`). Register row F-57; raised on the Notion page, Part 1. The
      categories list is left out of the spec until it closes.
- [x] Found, out of scope: the metrics list reports `logCount: 0` for a metric with two logs.
      Register row F-58.
- [x] `docs/how-to/releases/a11y-release-checklist.md` and `.claude/rules/accessibility.md` name
      the new spec
- [x] Register: F-33 closed; F-56, F-57, F-58 and O-12 added

## Status

Done 2026-10-17 on `test/axe-pages-with-data`. Node 24.21.0, production build, local backend and
Mailpit.

The new spec's 7 checks pass with the canvas fix: the dashboard with a card at both widths in both
themes, and the metrics list with a row in its mobile variant (1000 px, both themes) and its
desktop table (1280 px, light). Before the fix, the four dashboard checks failed on the canvas.

The two backend faults were reproduced with `curl` against the local backend
(`http://localhost:8001/api/v1`, image built 2026-10-13; the code involved is unchanged on
backend `dev` since then):

- **Category list.** On a new account: list (200), create a category (201), list (200), list
  again with the same query (500), and again (500). The same list without `includeTotal`, or
  with another `limit`, answered 200 on its first request. Inference: the list is served from a
  cache on a repeat, and the cached rows have no `createdAt`.
- **Log count.** On a new account: create a metric, post two logs (201 each), then list metrics:
  `logCount` is `0`, on the list's first request. The detail response has no `logCount`. The
  backend's list query counts with a subquery on `metric_logs`
  (`MetricReadRepoSequelize.ts`, `LOG_COUNT_SQL`); why it returns 0 was not found.
