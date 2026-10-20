# ADR-0032 — A dialog that is the whole page titles it with an `h1`

- **Status:** Accepted
- **Date:** 2026-10-20
- **Origin:** kit `page-headings`, D-01 — [`decisions.md`](../../internal/initiatives/page-headings/decisions.md); debt register row F-63

---

## Context

`.claude/rules/accessibility.md` § Structure: a page has one `<h1>`. Four routes render nothing but
a dialog when they are opened directly: `metrics/new`, `metric-categories/new`,
`metric-categories/[categoryId]/edit` and `metric-categories/[categoryId]/metrics/[metricId]`.
`Modal` (`src/components/ui/Modal.tsx`) titled every dialog with an `h2`, so those four pages had
no `h1`.

The same dialogs also open as intercepted routes, over a list whose page already has its `h1`.
There an `h1` in the dialog would be the page's second. Each intercept was a one-line re-export of
the route it intercepts, so one component rendered both, and nothing it received said which.

## Decision

The level is chosen by the route file, the one place that knows whether the dialog is the page.

- `Modal` takes `titleAs?: "h1" | "h2"` (type `ModalTitleLevel`), default `"h2"`, and renders its
  title as `<CardTitle as={titleAs} />`.
- `MetricForm`, `MetricCategoryForm`, `MetricFormDialog` and `MetricCategoryFormDialog` pass it
  through, with the same default.
- The four routes pass `"h1"`. Their intercepts render the same component with `"h2"` instead of
  re-exporting the route. The two that fetch share an async component in
  `src/app/(app)/metric-categories/_components/`, since a page file may export nothing but its
  page.

## Options considered

- **Look for an `h1` in the document when the dialog renders.** Rejected: impure, and the answer
  depends on what has mounted first.
- **An `sr-only` `h1` behind the dialog.** Rejected: a modal dialog makes the page under it inert,
  so assistive technology cannot reach that heading while the dialog is open.
- **Render the list behind a directly opened dialog.** Rejected: it changes what the page shows,
  beyond what the rule asks.
- **Record the four as an accepted deviation.** Rejected by the owner.

## Consequences

- A new route that is only a dialog passes `titleAs="h1"`, and its intercept `"h2"`.
  `cypress/e2e/stack/page-headings.cy.ts` checks the two routes that need no record; the others
  are held only by review.
- An intercept is a small component rather than a re-export, so it can differ from its route.
- **Revisit** if a dialog route is ever opened over a page without an `h1`.

## References

- `src/components/ui/Modal.tsx`
- `cypress/e2e/public/auth-pages.a11y.cy.ts`, `cypress/e2e/stack/app-pages.a11y.cy.ts`: one `h1`
  on every page they visit
- [ADR-0016](./adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md): the UI
  primitives built on Ariakit
