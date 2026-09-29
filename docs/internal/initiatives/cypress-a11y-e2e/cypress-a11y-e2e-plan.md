# Cypress accessibility and auth-flow E2E — Plan

- **Status:** Done
- **Appetite:** 3.5 days — past that, cut scope rather than extend
- **Date:** 2026-09-29

## Context and goals

Automated accessibility coverage today is lint plus `jest-axe`. `jest-axe` runs in jsdom, which has
no layout and evaluates no colour contrast, so ADR-0017's measured button contrast failures pass
every suite. `.claude/rules/accessibility.md` § Current tooling gaps names the missing layer: "There
is no `cypress-axe`, so E2E accessibility is not covered."

Cypress itself is barely used. `cypress/e2e/` holds one spec, `home.cy.ts`. The only auth helper,
`cy.loginAsTestUser()` in `cypress/support/commands.ts`, posts to `/api/auth/login`, a route that no
longer exists (`src/app/api/auth/` has `logout`, `revive` and `session`), so it could not work.
`docs/internal/todos/2026-08-24-todo-saas-readiness.md:356` parks "Expand Cypress past its single
spec" with Phase 5b's auth flows, which needed emailed tokens. Backend #115 (Mailpit) delivered
those, and the flows were verified by hand on 2026-09-29 (#58, #59).

When this lands:

- every public page is checked by axe in a real browser, in both themes, on every CI run;
- the authenticated pages and the token journeys (verify email, invite and switch, reset password)
  are checked the same way against the local Docker stack, by one command;
- a failure names the rule, the element and the fix, and cannot pass silently.

## Acceptance criteria

- **AC-1** — `cy.checkPageA11y()` runs axe on the whole rendered page with the WCAG 2.0 and 2.1 A
  and AA rule tags, fails on any violation, and prints each one (rule id, impact, help URL,
  selectors) in the run output. The rule set and every exclusion live in that one file, and each
  exclusion cites an ADR or a WCAG criterion. _Why:_ a red run has to say what to fix, and scoping to WCAG A/AA
  matches the baseline in `docs/reference/accessibility-baseline.md`.
- **AC-2** — The public pages pass AC-1's check in **light and dark**: `/`, `/login`, `/register`,
  `/forgot-password`, the no-token states of `/reset-password`, `/verify-email` and
  `/invites/accept`, and the 404 page. _Why:_ `.claude/rules/accessibility.md` requires contrast
  against the semantic tokens in both themes, and nothing checks dark mode today.
- **AC-3** — Colour contrast (`color-contrast`, WCAG 1.4.3) is checked, not disabled. The only
  exclusion is ADR-0017's accepted button deviations, scoped to the `.button` recipe for that one
  rule, with the ADR cited next to it. Any other violation found is fixed in this work or recorded
  as a deviation with its WCAG criterion and a reason. _Why:_ ADR-0017 and the rule in
  `.claude/rules/accessibility.md` that deviations are recorded, never left implicit.
- **AC-4** — On `/login`, Tab from the top of the page reaches the email field, the password field,
  the show-password button and the submit button in that order, and each shows a visible focus
  indicator. _Why:_ WCAG 2.4.3 and 2.4.7; keyboard order is what jsdom cannot show.
- **AC-5** — Against the local stack, a spec registers a fresh user, verifies the address with the
  token read from Mailpit, signs in, and checks `/dashboard`, `/metrics`, `/metric-categories`,
  `/organization` and `/account` with AC-1, in both themes. _Why:_ these are the pages users spend
  their time on, and none has a browser check.
- **AC-6** — Against the local stack, specs run the invite-accept-switch journey and the
  reset-password journey end to end, reading every token from Mailpit, and ending on the success
  state each page shows. _Why:_ turns the manual checks of 2026-09-29 (org-switcher AC-5, the
  token-panels fix) into repeatable ones.
- **AC-7** — CI's `e2e` job runs the public specs and nothing else, and stays green. The stack specs
  run with `npm run test:e2e:stack` and never in CI. _Why:_ CI has no backend (D-01).
- **AC-8** — `cy.loginAsTestUser()` is replaced by helpers that sign in the way the app does
  (`/api/proxy/auth/login`, then `/api/auth/session`). No credential is committed; each run creates
  its users with unique addresses. The stack helpers refuse to run unless both the app and Mailpit
  are on a local host, and stop before the first spec with a message naming what is down and how to
  start it when the backend or Mailpit is unreachable. _Why:_ `.claude/rules/security.md` §
  Secrets; a spec that creates accounts must not be pointable at staging by a stray environment
  variable; and a half-started stack should fail once, clearly, not five times confusingly.
- **AC-10** — `.claude/rules/workflow.md`'s gate table names `test:e2e:stack` as the gate for any
  change to a signed-in page or an auth flow, reported by name like every other gate. _Why:_ the
  stack specs are not in CI (D-01); a named gate is what keeps them from going stale.
- **AC-9** — AC-1's check is shown to fail: a page with a deliberate violation (an unlabelled
  input, and a low-contrast text element) fails the run with both reported. _Why:_ a check that
  cannot fail proves nothing (`.claude/lessons.md`, 2026-09-15).

## Open questions

None open. The forks are listed under Decisions expected, each with a recommendation; approving this
plan accepts them.

## Out of scope

- **Running the stack specs in CI.** It needs the backend, Postgres, Redis, RabbitMQ and Mailpit in
  the runner, and a way to fetch a private repository. Worth its own decision once the backend's
  VPS work (backend ADR-0042) settles how images are published.
- Visual regression, cross-browser runs (Electron only, as today), and performance checks, which
  have their own nightly workflow.
- Fixing ADR-0017's button contrast. That is a brand decision the ADR already declined.
- Rewriting the 2026 tests-overhaul e2e documents. They are a finished record; they get a pointer.

## Decisions expected

Recorded in [`decisions.md`](decisions.md) as `Proposed`; approving this plan accepts them.

- **D-01** — CI runs the public specs only; the backend-dependent specs live in
  `cypress/e2e/stack/` and run locally against the Docker stack.
- **D-02** — Add `cypress-axe` and `axe-core` as dev dependencies, `axe-core` pinned to an exact
  version and bumped deliberately. Candidate for an ADR at the end: two new dependencies.
- **D-03** — The rule set is WCAG 2.0/2.1 A and AA, failing on any impact, with contrast on and one
  scoped exclusion for ADR-0017.
- **D-04** — Every page is checked in both themes, set through `next-themes`' storage key before
  the page loads.
- **D-05** — Stack specs create fresh users per run and read tokens from Mailpit's HTTP API through
  one helper that owns every email subject and link pattern; nothing is cleaned up afterwards.
- **D-06** — Specs split into `cypress/e2e/public/` and `cypress/e2e/stack/`; `home.cy.ts` moves to
  `public/`.

## Phases

### Phase 0 — Wiring and baseline

- `package.json`: `cypress-axe` and `axe-core` in `devDependencies` (D-02). Neither has an install
  script; confirm in `npm ci` output that `allowScripts` needs no change (ADR-0019).
- `cypress/support/e2e.ts`: import `cypress-axe`. `cypress/support/a11y.ts`: `checkPageA11y()`
  (AC-1) and `visitInTheme(path, theme)` (D-04), typed in `cypress/support/index.d.ts`.
- AC-9 first: a throwaway fixture page proves the check fails and reports.
- Run the check over the AC-2 pages in both themes and record every violation in the checklist
  before fixing anything. Each gets one outcome: fixed here, the ADR-0017 exclusion, or a recorded
  deviation. If the list is long enough to threaten the appetite, stop and re-plan.

### Phase 1 — Public specs in CI

- `cypress/e2e/public/`: `home.cy.ts` (moved), `auth-pages.a11y.cy.ts` (AC-2), `login-keyboard.cy.ts`
  (AC-4, using Cypress's built-in `cy.press`).
- `cypress.config.ts` and `package.json`: `test:e2e` runs `public/` only; `test:e2e:stack` runs
  `stack/` (AC-7). The CI job's command does not change.
- `package.json`: `typecheck` also runs `tsc -p cypress/tsconfig.json --noEmit`. The root
  `tsconfig.json` excludes `cypress/`, so today no gate typechecks a spec.

### Phase 2 — Stack specs

- `cypress/support/stack.ts`: the local-host guard, the preflight (a `before` that checks the
  backend and Mailpit once), `registerUser()`, `signIn()`, and `tokenFromMailpit()` with polling.
  It takes the address and a kind (`verify`, `invite` or `reset`); the subjects and link patterns
  live only here, and a failed parse names the email it could not read (AC-8, D-05).
  `cy.loginAsTestUser()` and its type are removed.
- `cypress/e2e/stack/`: `app-pages.a11y.cy.ts` (AC-5), `invite-and-switch.cy.ts` and
  `reset-password.cy.ts` (AC-6).

### Phase 3 — Docs

After review:

- `.claude/rules/testing.md` § E2E and `.claude/rules/accessibility.md` § Current tooling gaps.
- `.claude/rules/workflow.md` gate table: the `test:e2e:stack` row (AC-10).
- `docs/reference/commands.md`: `test:e2e:stack`. `docs/reference/ci-pipeline/workflows.md`: what
  the `e2e` job now covers.
- A how-to for running the stack specs, placed per `.claude/rules/documentation.md`.
- Pointers from `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/`.
- `docs/internal/todos/2026-08-24-todo-saas-readiness.md:356`.
- D-02 promoted to an ADR if it holds.

## Risks and trade-offs

- **The baseline may be long.** Real contrast has never been measured outside buttons. Phase 0
  records it before fixing, and the appetite decides what is fixed here and what is recorded.
- **Stack specs rot outside CI.** Nothing forces them to run. Four things hold them up: CI still
  typechecks and lints them, so a renamed helper fails a PR; the gate table names them for any
  change to a signed-in page (AC-10); the preflight makes a run one command; and the release
  checklist (`docs/how-to/releases/a11y-release-checklist.md`) runs them. The suite stays at three
  specs.
- **axe-core updates.** A new version can add rules and turn CI red with no change of ours. Pinned
  exactly (D-02) and bumped in its own change, as Lighthouse is (`.claude/rules/performance.md`).
- **Backend email templates.** Not covered by the API contract check. Every subject and link
  pattern sits in one helper, so a template change is one edit and a clear error.
- **Mailpit timing.** Mail arrives after the API responds; the helper polls with a bounded timeout
  rather than reading once.
- **CI time.** About eight pages in two themes adds roughly a minute to a 30-minute budget.

## Rollback

Revert the PR. The only runtime changes are whatever Phase 0 fixes, and each is a normal commit in
the same PR.

## Security and data

- No credentials in the repository. Stack specs create throwaway users with unique addresses on the
  local stack only, enforced by the AC-8 guard.
- Mailpit exists only in development; the backend refuses it in production (backend ADR-0048).

## Accessibility

This work is itself accessibility tooling. It adds automated checks for WCAG 1.4.3 Contrast
(Minimum), 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value and the rest of axe's A/AA set in a
real browser, and a keyboard check for 2.4.3 Focus Order and 2.4.7 Focus Visible on `/login`.

Known deviation carried forward: ADR-0017 (1.4.3 and 1.4.11 on Button colour tokens). axe checks
1.4.11 only partially, so the exclusion is for `color-contrast` alone.

## References

- `.claude/rules/accessibility.md`, `.claude/rules/testing.md`
- ADR-0017, ADR-0019
- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/a11y-e2e-checklist.md` — the 2026
  intent this delivers part of
- lakira-backend `docs/how-to/development/read-outbound-email.md`
