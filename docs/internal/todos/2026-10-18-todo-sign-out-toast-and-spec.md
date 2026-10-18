# 2026-10-18 - Todo: the sign-out toasts show, and a spec signs out

**Context:** debt register rows F-53 and F-50.

- **F-53** (`2026-10-14-todo-inline-style-stays.md` § Discovered). Nothing mounted a `<Toaster>`,
  so the two `toast()` calls in `src/app/(app)/_components/AppShell.tsx` ("Logged out
  successfully", and "Logout failed. Please try again.") showed nothing.
- **F-50** (kit `unquarantine-layout-files`, checklist § Discovered). No Cypress spec signed out.

## Checklist

- [x] `src/app/providers.tsx` mounts the one `<Toaster>`. It sits at the root, not in the `(app)`
      shell: the success toast is raised as the app navigates to `/login`, which unmounts that
      shell.
- [x] Its look is semantic tokens only (`--surface`, `--text`, `--border`), passed as
      `toastOptions.style`. The library's default is a white card with `#363636` text in both
      themes, and its styles are injected unlayered, so a recipe in `@layer components` would
      lose to them.
- [x] `src/app/__tests__/providers.test.tsx`: a raised toast renders as a `status`. It failed
      before the change.
- [x] `cypress/e2e/stack/sign-out.cy.ts`, at 1280 px, in both themes. It signs out from the
      sidebar and the dialog, expects `/login` and the toast, and runs axe while the toast is
      on the page, checking afterwards that it still was. It then visits `/dashboard` and lands
      on `/login`, so the session ended, not just the page.
- [x] Seen to fail: on a build without the `<Toaster>` (the file restored afterwards), both cases
      failed on the toast, after reaching `/login`.
- [x] `cypress/e2e/csp-stack/app-pages.cy.ts`: signing out with the policy enforced shows the
      toast and reports no violation. The library injects a `<style>` element, which
      `style-src 'unsafe-inline'` allows (ADR-0030). The spec's violation listener, copied into
      each case, became one helper, `collectViolations`, once a third copy tripped
      `sonarjs/no-duplicate-string`.
- [x] `docs/how-to/testing/run-stack-e2e.md` names signing out.
- [x] Gates

## Status

Done 2026-10-18 on `fix/sign-out-toast`. Node 24.21.0, production build, backend on `:8001`.

Unit 1025, integration 142. Every e2e suite on the real build:

| Suite      | Result   |
| ---------- | -------- |
| stack      | 50 of 50 |
| csp, stack | 8 of 8   |
| public     | 2 of 2   |
| a11y       | 16 of 16 |
| csp        | 7 of 7   |

Not covered: signing out below 1024 px, where no control is visible (F-48, owner question O-11),
and the failure toast, which needs the backend to refuse a sign-out.
