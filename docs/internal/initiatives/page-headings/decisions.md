# Page headings — Decisions

## D-01 — A dialog that is the whole page titles itself with an `h1`

> **Promoted to [ADR-0032](../../../explanation/decisions/adr-0032-a-dialog-that-is-the-page-titles-it-with-an-h1.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-20

**Context.** Register row F-63: twelve pages had no `h1`, against `.claude/rules/accessibility.md`
§ Structure. Four of them are routes that render only a dialog when opened directly:
`metrics/new`, `metric-categories/new`, `metric-categories/[categoryId]/edit` and
`metric-categories/[categoryId]/metrics/[metricId]`. `Modal` titles every dialog with
`<DialogHeading render={<CardTitle />}>`, an `h2`. Each of those routes is also opened as an
intercepted dialog over a list whose page has its own `h1`, and the intercept was a one-line
re-export of the same page, so the component could not tell which it was.
**Decision.** `Modal` takes `titleAs?: "h1" | "h2"`, default `"h2"`, and renders its heading as
`<CardTitle as={titleAs} />`. `MetricForm`, `MetricCategoryForm` and their dialog wrappers pass it
through with the same default. The four full-page routes pass `"h1"`; their intercepts render the
same component with `"h2"` instead of re-exporting it. The level is decided where the route is
known: by the file that is the route.
**Options considered.** Sniffing the document for an `h1` when the dialog renders: rejected, it is
impure and depends on what has mounted first. An `sr-only` `h1` behind the dialog: rejected, the
modal makes the page under it inert, so assistive technology cannot reach it while the dialog is
open. Showing the list behind a directly opened dialog: rejected, a change of what the page shows,
beyond the row. Leaving the four as an accepted deviation: rejected by the owner, who chose this.
**Consequences.** A `Modal` prop and two feature components' props change, so this is recorded as
an ADR. A new full-page dialog route has to pass `"h1"`; the browser guard in
`app-pages.a11y.cy.ts` catches one that does not, for the routes it visits.
