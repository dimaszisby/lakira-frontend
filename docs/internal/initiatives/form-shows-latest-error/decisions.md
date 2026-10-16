# Form shows latest error — Decisions Log

`D-NN` entries scoped to this kit. `F-NN` is a row of
[`frontend-debt-register/register.md`](../frontend-debt-register/register.md).

---

## D-01 — Each component keeps its latest action's error in state

- **Status:** Accepted
- **Date:** 2026-10-16

**Context.** F-29: five components chose the error to show with a fixed order over their mutation
hooks' `error` values, such as `createError ?? updateError ?? deleteError`. TanStack keeps each
mutation's `error` until that same mutation runs again. So in edit mode, a refused Save followed by
a refused Delete still showed the Save error. On the metrics page, a refused dummy create stayed on
screen through every later delete, successful ones included. The five sites, on `dev` at
`6250227`: `MetricForm.tsx`, `MetricCategoryForm.tsx`, `LogForm.tsx`, `MetricSettingsForm.tsx` and
`MetricsPageClient.tsx`.

**Decision.** Each component holds `actionError` in `useState`. Every action handler clears it
before it starts and sets it from its `catch`. The banner renders
`handleApiError(actionError)`. Nothing in these components reads a hook's `error` any more; the
hooks are unchanged.

**Options considered.**

- Expose `reset` from the mutation hooks and reset the others before each action. It changes the
  return shape of nine hooks to fix five components, and every new action has to remember to
  reset every other mutation.
- Expose `submittedAt` from the hooks and show the error of the newest. The same hook changes,
  plus a comparison in each component.
- A shared hook wrapping the state. Three lines per component do not justify a new module, and
  `src/hooks` is not a layer the boundary rule knows.

**Consequences.**

- The error shown is always the latest action's. A new action hides the previous error while it
  runs, and a successful one leaves none.
- `MetricsPageClient`'s two `console.error` calls go: the error is now shown, and
  `withApiErrorHandling` already logs outside production.
- `MetricSettingsForm` gets the change although its stale case is rare: create and update are
  chosen by `initialSettings`, so only settings arriving after a failed create could show it.
  Changing it leaves no copy of the old pattern to be copied.
- A unit test that fed an error through a mocked hook's `error`
  (`MetricCategoryForm.test.tsx`) now rejects the mocked call instead. Same assertion.
