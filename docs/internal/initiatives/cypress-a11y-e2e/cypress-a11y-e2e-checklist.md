# Cypress accessibility and auth-flow E2E — Checklist

## Phase 0 — Wiring and baseline

- [x] `package.json` / `package-lock.json` — `axe-core` `4.13.0` (exact) and `cypress-axe`
      `^1.7.0` in `devDependencies`, installed with Node 24.21.0's npm 11.19. Neither has a
      `preinstall`, `install` or `postinstall` script (read from each installed `package.json`
      rather than a fresh `npm ci`, which would have replaced `node_modules` under a running dev
      server), so `allowScripts` is unchanged (ADR-0019)
- [x] `cypress/support/e2e.ts` — imports `cypress-axe` and `./a11y`
- [x] `cypress/support/a11y.ts` — `checkPageA11y(label)` (WCAG 2.0/2.1 A and AA tags, two passes so
      `color-contrast` can carry its own exclusions, violations printed with axe's failure summary)
      and `visitInTheme(path, theme, options)`
- [x] `cypress/support/index.d.ts` — types for both commands
- [x] AC-9 proof, 2026-09-29: a throwaway spec loaded `/`, waited for hydration, and appended an
      unlabelled `<input>` in one test and `#dddddd`-on-white text in the other. Both failed, each
      reporting exactly its planted violation (`label [critical] … at #ac9-unlabelled`;
      `color-contrast [serious] … at #ac9-low-contrast`). Spec and screenshots deleted. Appending
      before hydration finished threw React error #418 instead, which is why the proof waits.
- [x] Baseline: every AC-2 page in both themes, below

### Baseline findings

Measured 2026-09-29 on a production build (`next start`), Cypress's default 1000x660 viewport,
axe-core 4.13.0.

**Public pages (AC-2), 8 pages x 2 themes.** Dark: none. Light, one finding:

- **Header wordmark** on every `(auth)` page: `header a[href="/"]`, `#e896a3` on `#f9fafb`, 2.15:1
  against 3:1 for large text. **Excluded as a logotype** (WCAG 1.4.3 exception), D-07.

Without the `.button` exclusion, 7 of the 16 checks also fail on buttons (white on `#a8c18a`,
1.96:1), as ADR-0017 records. The exclusion stays.

**Signed-in pages (AC-5), 5 pages x 2 themes, local stack.** Dark: none. Light: three defects, none
of them buttons.

- **F-1** — the active label in `BottomNavigationBar` (12px, `text-brand-primary`), all five pages:
  `#e896a3` on `#ebebeb`, 1.88:1 against 4.5:1 (1.4.3). **Fixed**: label in `text-ink`, semibold;
  icon keeps the brand colour (D-08, chosen by the user).
- **F-2** — `.text-ink-tertiary` (14px) on `--bg`, on `/metrics` and `/metric-categories`:
  `#737373` on `#ebebeb`, 3.97:1 against 4.5:1 (1.4.3). **Fixed**: light `--text-tertiary` maps to
  `gray-700`, 5.61:1 (D-09, chosen by the user; it now equals `--text-secondary` in light).
- **F-3** — not an axe rule; found when the invite spec could not click "Send invitation". `<main>`
  in `src/components/layout/Layout.tsx` had bottom padding only at `lg`, while
  `BottomNavigationBar` is `fixed` below `lg`, so the last control on every signed-in page sat
  under the bar. **Fixed**: `pb-20` below `lg`.

After the fixes, all 10 signed-in checks and all 16 public checks pass.

## Phase 1 — Public specs in CI

- [x] `cypress/e2e/public/home.cy.ts` — moved from `cypress/e2e/home.cy.ts` with `git mv`, unchanged
- [x] `cypress/e2e/public/auth-pages.a11y.cy.ts` — AC-2, 16 tests
- [x] `cypress/e2e/public/login-keyboard.cy.ts` — AC-4. Logs the whole Tab order; fields are
      identified by `name` (the login email field is `type="text"`), and by attribute rather than
      `instanceof`, since elements belong to the app's window, not the spec's
- [x] `package.json` — `test:e2e` runs `public/`, `test:e2e:stack` runs `stack/`;
      `.github/workflows/test.yml` unchanged
- [x] `package.json` — `typecheck` also runs `tsc -p cypress/tsconfig.json --noEmit`. Shown to fail
      on a planted type error in `cypress/support/`

## Phase 2 — Stack specs

- [x] `cypress/support/stack.ts` — local-host guard, preflight, `newUser()`, `registerUser()`,
      `signIn()`, `signInSession()`, `tokenFor()`
- [x] `cypress/support/mailpit.ts` — every email subject and link pattern, Node-side polling
      (15 s), errors that name the email; used through tasks in `cypress.config.ts`
- [x] `cypress.config.ts` — `allowCypressEnv: false`; URLs through `expose`, read with
      `Cypress.expose()`, as Cypress 15's deprecation of `Cypress.env()` asks
- [x] `cypress/support/commands.ts` removed with `git rm`, and both commands' types; no callers
      remained
- [x] `cypress/e2e/stack/app-pages.a11y.cy.ts` — AC-5, plus the verify-email success state
- [x] `cypress/e2e/stack/invite-and-switch.cy.ts` — AC-6, plus axe on the accepted-invite state and
      on `/organization` with two memberships
- [x] `cypress/e2e/stack/reset-password.cy.ts` — AC-6, plus axe on the success state

## Phase 3 — Docs

- [x] `.claude/rules/testing.md` § E2E rewritten
- [x] `.claude/rules/accessibility.md` § Current tooling gaps, and the coverage paragraph after it
- [x] `.claude/rules/workflow.md` — `e2e (stack)` row (AC-10), and the "every gate runs in CI"
      paragraph corrected to name the exception
- [x] `.claude/rules/environment.md` and `docs/reference/environments.md` — `E2E_MAILPIT_URL` and
      `E2E_BACKEND_URL`; the dead `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` row removed
- [x] `.claude/rules/styling.md` — the Button defect notes the Cypress exclusion and what it hides
- [x] `.claude/skills/pre-push/SKILL.md` — when to run the stack suite
- [x] `docs/reference/commands.md` — `typecheck`, `test:e2e`, `test:e2e:stack`
- [x] `docs/reference/ci-pipeline/workflows.md` — what `e2e` and `checks` cover
- [x] `docs/how-to/testing/run-stack-e2e.md`, linked from `docs/README.md` and
      `run-the-test-suites.md`
- [x] `docs/how-to/releases/a11y-release-checklist.md` — both suites in the preconditions; E2E
      section describes what exists
- [x] Pointers at the top of the three `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/`
      documents, which stay as written
- [x] `docs/internal/todos/2026-08-24-todo-saas-readiness.md` — the Cypress item closed
- [x] D-02 promoted to ADR-0022, registry row, `CLAUDE.md` says 22 ADRs

## Discovered

- [x] Found: `cy.loginAsTestUser()` posts to `/api/auth/login`, which does not exist → in scope,
      Phase 2 (AC-8)
- [x] Found: `tsconfig.json` excludes `cypress/`, so no gate typechecks the specs or support files
      → in scope, Phase 1
- [x] Found: `cypress/screenshots/` was not gitignored, unlike `cypress/videos/` → in scope,
      added to `.gitignore`
- [x] Found: `promise/catch-or-return` and `promise/no-nesting` misread Cypress chainables, and
      warnings fail lint → in scope, turned off for `cypress/**` in `eslint.config.mjs` with the
      reason beside them
- [x] Found: F-1, F-2, F-3 → in scope, fixed (above)
- [x] Found: the auth forms' email and password fields have no `autocomplete` token, a WCAG 1.3.5
      gap axe cannot detect → out of scope, filed as
      `docs/internal/todos/2026-09-29-todo-auth-fields-missing-autocomplete.md`
- [x] Found: a dev server started before a dependency change keeps serving the old code; the stack
      suite failed on verify-email against it and passed on a fresh build → no code change, noted
      in the how-to

## Acceptance

- [x] AC-1 — a machine checks it · `cypress/support/a11y.ts`, exercised by every spec
- [x] AC-2 — a machine checks it · `public/auth-pages.a11y.cy.ts`, 16 of 16 locally
- [x] AC-3 — a machine checks it, and I recorded the baseline · above; two exclusions, each cited
- [x] AC-4 — a machine checks it · `public/login-keyboard.cy.ts`; shown to fail with focus
      outlines stripped
- [x] AC-5 — a machine checks it, locally only · `stack/app-pages.a11y.cy.ts`, 11 of 11
- [x] AC-6 — a machine checks it, locally only · both journey specs pass
- [x] AC-7 — the PR's CI run, #60 (run 36594435300): `E2E tests` green, running exactly
      `auth-pages.a11y.cy.ts`, `home.cy.ts` and `login-keyboard.cy.ts`, 18 of 18
- [x] AC-8 — I checked it · a non-local `E2E_MAILPIT_URL` is refused before any request; a local but
      stopped Mailpit stops the run with the start instructions
- [x] AC-9 — I checked it · evidence under Phase 0
- [x] AC-10 — review · the gate-table row and the corrected paragraph

## Gates

Node 24.21.0, 2026-09-29.

- [x] lint — pass
- [x] css lint — pass
- [x] typecheck — pass, both projects
- [x] format — pass
- [x] unit tests — 81 suites, 686 tests, pass; `coverage:check` pass
- [x] integration — 22 suites, 127 tests, pass
- [x] spec drift — not in play, skipped
- [x] build — pass, in a scratch worktree
- [x] e2e — `test:e2e` 18 of 18 and `test:e2e:stack` 13 of 13, against that build; `npm audit`
      0 vulnerabilities
