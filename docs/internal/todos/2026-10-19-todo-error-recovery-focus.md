# 2026-10-19 - Todo: keep focus in the page after an error boundary recovers

**Context:** debt register row F-45, found in kit `route-error-boundaries` (checklist § Discovered;
§ Acceptance calls it the known gap after recovery). After a successful "Try again",
`RouteErrorPanel` unmounted with focus on its button and focus fell to the document body, so a
keyboard or screen-reader user started again from the top of the page with nothing announced.

## Decision

Focus goes to the `<main>` that holds the panel, when the panel unmounts, if focus has been in the
panel and is lost now. The panel cannot tell a successful retry from any other reason it goes away,
so its unmount is the signal, and the two conditions keep it from moving focus the user put
somewhere else.

Rejected:

- **The recovered page's `h1`.** Twelve pages have none yet (F-63), and the boundary does not know
  what renders after it.
- **Moving focus whenever focus is lost, with no check that it was in the panel.** `next dev` runs
  with Strict Mode, which cleans up and remounts every effect once, so the panel moved focus to
  `main` the moment an error appeared. A unit case renders under Strict Mode to hold this.
- **Also clearing the flag when focus leaves the panel.** It only changes a case where focus left
  the panel and is lost by the same unmount; moving it to `main` there is harmless.

**Accepted deviation.** Both `<main>` elements carry `tabIndex={-1}` and `focus:outline-none`.
`.claude/rules/accessibility.md` says not to remove outlines without replacing them; a `main` is not
an operable control, so WCAG 2.4.7 asks for no indicator on it, and a ring around the whole content
area would say nothing. The skip link's target (`#main`) is now focusable as a side effect.

**Known limit.** If a retry fails again, Next may mount a fresh panel, and focus lands on `main`
rather than on its new button; `role="alert"` announces the error again.

## Checklist

- [x] `src/components/ui/RouteErrorPanel.tsx`: on mount, records the `main` above the panel and
      listens for `focusin`; on unmount, focuses that `main` if focus has been in the panel and is
      on the body or detached.
- [x] `src/components/layout/Layout.tsx` and `src/app/(auth)/layout.tsx`: `main` takes
      `tabIndex={-1}` and `focus:outline-none`.
- [x] Tests:
  - `RouteErrorPanel.test.tsx`, four cases: focus moves from "Try again" to `main`; focus the user
    put on another control stays there; a panel focus never entered moves nothing under Strict
    Mode; with no `main` above it, nothing happens;
  - `Layout.int.test.tsx` and `src/app/(auth)/__tests__/layout.test.tsx`: `main` has
    `tabindex="-1"`.
- [x] Seen to fail, each restored: without the focus move, the first case fails; without the
      lost-focus check, the second; without the been-in-the-panel check, the Strict Mode case.
- [x] In a real browser, production build, a temporary public page whose first render for each key
      throws, and a throwaway spec (both deleted):
  - with the change, focus is on `main` after recovery in 9 of 9 runs, and a panel left alone
    moves nothing (3 of 3);
  - with the focus move disabled, focus is on the body in 3 of 3: the defect as the row describes
    it.
  - An earlier probe that failed on odd renders gave mixed results; its counter also counted
    renders the spec did not drive, so a visit sometimes did not throw. The keyed probe replaced
    it. Keyboard activation was not driven in the browser, since Cypress cannot press Enter on a
    button without a plugin; the unit suite covers it, and Enter on a focused button fires the
    same click.
- [x] Register: F-45 closed; README names the next ready row.
- [x] Gates

## Status

Done 2026-10-19 on `fix/error-recovery-focus`. Every gate ran on the final tree, the stack suite
against the backend image rebuilt that day.
