# 2026-10-19 - Todo: an h1 on the dashboard and the metric detail page

**Context:** debt register row F-44, found in kit `route-error-boundaries` (checklist § Discovered).
`.claude/rules/accessibility.md` § Structure: "A page has one `<h1>`." The dashboard rendered no
heading at all, and the metric detail page showed the metric's name as a `DataLabel` value, a
`<span>`. The owner chose a visible "Dashboard" title, styled like Account and Organization, and
to file the other pages without an `h1` rather than widen this change.

## Checklist

- [x] `src/app/(app)/dashboard/layout.tsx` renders `<h1>Dashboard</h1>` above its children, with
      the classes `organization/page.tsx` gives its `h1`, so the title also shows over
      `loading.tsx` and above `error.tsx`.
- [x] `src/app/(app)/dashboard/error.tsx` passes `headingLevel={2}`, as the metric detail boundary
      already did.
- [x] `MetricHeaderSection.tsx`: the metric's name is an `h1`, passed through `DataLabel`'s
      `renderValue`. `data-label-text` keeps the label's size and weight, and `font-sans` the body
      font over the base `h1` rule's. It sits in `metrics/[metricId]/layout.tsx`, so every page
      under that segment has the `h1`.
- [x] Tests:
  - `src/app/(app)/dashboard/__tests__/layout.test.tsx`: one `h1`, "Dashboard", and the children;
  - `MetricDetailComposite.int.test.tsx`: one `h1`, named by the metric;
  - `src/app/__tests__/route-error-boundaries.test.tsx`: each boundary's title asserted at its
    heading level, 1 for the two group boundaries, 2 for the dashboard and metric detail.
- [x] Seen to fail, each restored: the name as a `<span>` fails the composite case; the layout
      reverted fails the layout test; `headingLevel={2}` dropped fails the boundary table.
- [x] Register: F-44 closed, F-63 filed; D-01 to D-04 marked `Accepted`, all four being merged.
- [x] Found: twelve pages have no `h1` → out of scope, register row F-63, closed in #123 (kit
      `page-headings`):
  - `(auth)`: `forgot-password`, `invites/accept`, `login`, `register`, `reset-password`,
    `verify-email`, each titled by a `CardTitle`, which renders an `h2` unless given `as="h1"`;
  - `metric-categories`: the list, `new`, `[categoryId]`, `[categoryId]/edit` and
    `[categoryId]/metrics/[metricId]` (the list's title is a `CardTitle` too);
  - `metrics/new`.
- [x] Gates

## Status

Done 2026-10-19 on `fix/dashboard-metric-detail-h1`. Before this change 4 of 23 pages had an `h1`
(home, metrics, account, organization). After it 11 do: the dashboard, and the seven pages under
`metrics/[metricId]`, through its layout. The other twelve are F-63, left open above so that the
register check (D-04) holds the row to this file.
