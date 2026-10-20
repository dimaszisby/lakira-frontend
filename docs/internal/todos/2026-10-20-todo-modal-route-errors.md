# 2026-10-20 - Todo: an error in an intercepted modal route stays in its dialog

**Context:** debt register row F-47, from kit `route-error-boundaries` (checklist § Discovered). An
error thrown in an intercepted `@modal` route was caught by `src/app/(app)/error.tsx`, which
replaced the whole content area, the list under the dialog included. The modal routing incident
(`docs/internal/incidents/fix-metric-modal-routing-20251130.md`) was partly a modal's own fetch
failing, which is exactly the error that would now blank the page.

## Decision

Each `@modal` slot gets its own `error.tsx`, re-exporting one shared fallback,
`src/app/(app)/_components/ModalRouteError.tsx`. Next lets each parallel slot carry its own error UI
(`parallel-routes.md` § Loading and Error UI), and a boundary at the slot's root catches every
intercepted route under it while the layout's `{children}`, the page, stays mounted. The fallback
is `RouteErrorPanel` (fixed copy, digest, reporting, `retry`) inside `Modal` (focus trap, Escape,
focus return), titled "Unable to open this dialog" at heading level 2, and it closes the way the
feature dialogs do: `router.back()`, then `router.refresh()`.

Rejected:

- **An `error.tsx` per intercepting page.** Nine files, and a future intercept would have none. At
  the slot root, one file covers the slot, and a test holds every slot to it.
- **The panel without a dialog.** It would render where the layout places `{modal}`, under the
  page content, with no way back but the browser.

## Checklist

- [x] `src/app/(app)/_components/ModalRouteError.tsx`: the panel in a `Modal`, closing back to the
      page; top margin so the dialog's close button clears the panel.
- [x] An `error.tsx` in each of the seven `@modal` slots: `metrics`, `metrics/[metricId]`,
      `metrics/[metricId]/logs`, `metrics/[metricId]/settings`, `metric-categories`,
      `metric-categories/[categoryId]`, `metric-categories/[categoryId]/metrics`.
- [x] `src/app/__tests__/route-error-boundaries.test.tsx`: the seven in the table at level 2, so
      each shows its title and never the error's message, retries with `retry` and reports once;
      and a case that the dialog shows and its close button goes back.
- [x] `src/app/__tests__/parallel-route-interceptors.test.ts`: every `@modal` slot has an
      `error.tsx`.
- [x] Seen to fail, each restored: with the logs slot's `error.tsx` removed, the slot case fails;
      with the fallback rendering no `Modal`, the dialog case fails.
- [x] In a real browser, production build and the stack, with a temporary launcher page under
      `/metrics`, a `Link` to a temporary route, and an intercept of it that throws on its first
      render for each key (all deleted):
  - before: the group panel replaced the launcher page in 3 of 3 runs, with no dialog;
  - after: the launcher stayed and the error showed in a dialog in 3 of 3; Try again rendered the
    intercept with the page still there; Escape closed the error dialog back to the launcher in 2
    of 2, focus having started inside the dialog.
- [x] `.claude/rules/architecture.md` § Error boundaries: the slot rule and the test that holds it.
- [x] `.claude/skills/new-route/SKILL.md`: the scaffold lists `@modal/error.tsx` and gives its two
      lines, so a new slot starts with one.
- [x] Register: F-47 closed; README names the next ready row.
- [x] Gates

## Status

Done 2026-10-20 on `fix/modal-route-errors`.
