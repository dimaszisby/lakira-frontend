# Form shows latest error — Checklist

## Phase 0 — Show the latest action's error

- [x] `LogForm.tsx`, `MetricForm.tsx`, `MetricCategoryForm.tsx`, `MetricSettingsForm.tsx`:
      `actionError` in state, cleared at the start of submit and delete, set in their `catch`; the
      hooks' `error` destructures removed (D-01)
- [x] `MetricsPageClient.tsx`: the same for delete and dummy create; its two `console.error`
      calls removed
- [x] Integration cases, one per site with more than one action, each seen to fail on the
      unchanged component with the older message on screen
- [x] `MetricCategoryForm.test.tsx`: the banner case rejects the mocked call instead of setting
      the mocked hook's `error`

## Discovered

None.

## Acceptance

- [x] AC-1 — In `LogForm`, `MetricForm` and `MetricCategoryForm`, a refused Save followed by a
      refused Delete shows the Delete error and not the Save one. Machine: "shows the delete error
      when a refused delete follows a refused save" in each form's `.int.test.tsx`. Before the
      fix each showed the Save message. _Why:_ F-29.
- [x] AC-2 — On the metrics page, a refused dummy create followed by a refused delete shows the
      delete error. Machine: `MetricsPageClient.dummy.int.test.tsx`, which turns the dummy flag on
      in a file of its own. Before the fix it showed the dummy message. _Why:_ F-29; the page stays
      open after an action, so a stale error there lasts.
- [x] AC-3 — A later action that succeeds leaves no error from an earlier one. Machine:
      `LogForm.int.test.tsx`, "clears an earlier error when a later action succeeds" (a refused
      Delete, then a Save that succeeds). Before the fix the Delete message stayed. _Why:_ the
      banner must describe the latest action.
- [x] AC-4 — Every existing case for the five sites passes, axe included. Machine: the
      integration and unit suites.

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — plus `coverage:check`
- [x] integration
- [x] spec drift — `api:spec:check`
- [x] build
- [x] e2e (stack) — 29 of 29
- [ ] e2e, e2e (csp), e2e (csp, stack) — skipped: no public page, policy or layout changed

## Evidence

A one-off Cypress spec against the local stack, deleted after the run: in the category edit form,
renaming to a taken name was refused by the real backend (409, "Metric Category name already
exists"), and that message showed. A Delete refused by an intercept (403) then replaced it with
its own message.
