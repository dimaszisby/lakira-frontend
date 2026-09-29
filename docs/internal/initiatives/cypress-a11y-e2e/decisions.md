# Cypress accessibility and auth-flow E2E — decisions

## D-01 — CI runs the public specs only; backend-dependent specs run locally

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** CI's `e2e` job starts the built app on `127.0.0.1:3000` and nothing else. Every signed-in
page and every token journey needs the backend, its database, Redis, RabbitMQ and Mailpit.

**Decision.** Specs that need no backend live in `cypress/e2e/public/` and run in CI through
`npm run test:e2e`, as today. Specs that need the stack live in `cypress/e2e/stack/` and run through
`npm run test:e2e:stack` against the local Docker stack. The release checklist says to run them.

**Options considered.**

- _The backend stack inside CI._ Real coverage on every PR, but it needs a token to check out a
  private repository, five services on the runner, and a backend build per run. Deferred until the
  backend's VPS work (backend ADR-0042) settles how images are published.
- _A mocked API for the signed-in pages in CI._ Rejected: the point of these specs is the real
  backend's responses and tokens; a mock would drift the way the OpenAPI snapshot once did.

**Consequences.** Signed-in pages are checked only when someone runs the stack specs. That gap is
stated in `.claude/rules/testing.md` and the release checklist rather than hidden.

## D-02 — `cypress-axe` and `axe-core` as dev dependencies

> **Promoted to [ADR-0022](../../../explanation/decisions/adr-0022-browser-accessibility-checks-with-cypress-axe.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** Cypress needs axe injected into the page under test. `cypress-axe` 1.7.0 supports
Cypress 10 to 15 and declares `axe-core` 3 or 4 as a peer, which this repo does not list directly
(it arrives only through `jest-axe` and `eslint-plugin-jsx-a11y`).

**Decision.** Add both. `axe-core` is pinned to an exact version (no `^`) and bumped deliberately in
its own change, because a new version can add rules and fail CI on a PR that changed nothing; the
same reasoning pins Lighthouse (`.claude/rules/performance.md`). Neither package has an install
script, so ADR-0019's `allowScripts` is unaffected. Amended at approval, 2026-09-29.

**Options considered.**

- _`axe-core` alone and a hand-written command._ One dependency fewer, but it re-implements
  injection and result handling that `cypress-axe` already tests, for about twenty lines saved.
- _Lighthouse's accessibility score_, already run nightly. Rejected: a score of 90 or more still
  passes with violations, and it runs on three public routes only.

**Consequences.** Two dev dependencies to keep current. `axe-core`'s version now sets which rules
the E2E layer applies, separately from `jest-axe`'s bundled copy.

## D-03 — WCAG A/AA rules, fail on any impact, contrast on

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** axe's default run includes best-practice rules outside WCAG, and many teams filter to
critical and serious impacts. ADR-0017 accepts measured contrast failures on Button colour tokens.

**Decision.** Run the `wcag2a`, `wcag2aa`, `wcag21a` and `wcag21aa` tags and fail on any violation.
Keep `color-contrast` on everywhere, excluding only the `.button` recipe for that rule, with
ADR-0017 cited beside the exclusion.

**Options considered.**

- _Critical and serious only._ Rejected: a moderate contrast failure is still a 1.4.3 failure.
- _Turn `color-contrast` off_ because of ADR-0017. Rejected: contrast is the main thing this layer
  adds over jsdom.

**Consequences.** The Phase 0 baseline may surface failures outside buttons that nobody has
measured. Each is fixed or recorded, never excluded without a reason.

## D-04 — Every page in both themes

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** `semantic.css` overrides surfaces and text separately for dark mode, so a pairing that
passes in light can fail in dark (`.claude/rules/accessibility.md`).

**Decision.** `visitInTheme(path, theme)` writes the theme to `next-themes`' storage key
(`THEME_STORAGE_KEY`) before the page loads, then asserts `data-theme` on `<html>` before checking.

**Options considered.** _Light only_, halving the run time. Rejected for the reason above.

**Consequences.** Twice the page loads. Acceptable at this page count.

## D-05 — Fresh users per run, tokens from Mailpit

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** The stack specs need signed-in users, verified addresses, invites and reset tokens.

**Decision.** Each run registers users with unique addresses (`e2e-<timestamp>-<n>@example.com`)
and reads tokens from Mailpit's HTTP API with bounded polling. One helper owns every email
subject and link pattern, so a backend template change is one edit, and its error names the email
it could not parse. Nothing is deleted afterwards. Amended at approval, 2026-09-29.

**Options considered.**

- _A seeded fixed account_ via `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`, as the old helper
  expected. Rejected: it needs a credential kept somewhere, and shared state between runs.
- _Deleting users after the run._ The API has no route for it; direct database access from a spec
  would reach past the system under test.

**Consequences.** The local database gains a few users per run. It is a development database.

## D-06 — `public/` and `stack/` spec folders

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** D-01 needs the two kinds of spec to be selectable separately.

**Decision.** Two folders, selected by `--spec` in the two scripts. `home.cy.ts` moves to `public/`.

**Options considered.** _Tags or an environment flag inside each spec._ Rejected: a spec that skips
itself when the backend is missing turns a broken setup into a green run.

**Consequences.** The folder is the contract: a spec in `public/` must not call the backend.

## D-07 — The header wordmark is excluded from `color-contrast` as a logotype

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** The Phase 0 baseline found one violation outside buttons: the `APP_NAME` link in
`src/components/layout/Header.tsx`, brand pink `#e896a3` on `#f9fafb`, 2.15:1 against the 3:1
large-text threshold, light theme only, on every page that uses the `(auth)` layout. Dark passes.

**Decision.** Exclude `header a[href="/"]` from `color-contrast` in `cypress/support/a11y.ts`,
citing WCAG 1.4.3's logotype exception: text that is part of a logo or brand name has no contrast
requirement.

**Options considered.**

- _Darken the wordmark._ Rejected: the palette and brand mapping are fixed input
  (`.claude/rules/styling.md`), and WCAG does not require it.
- _Leave it failing._ Rejected: CI would be red on a criterion WCAG itself exempts.

**Consequences.** The selector also covers any future `/` link inside a `<header>`. That is narrow
enough today, since the header has one; a second one would need its own look.

## D-08 — The active bottom-nav label uses the text colour; the icon keeps the brand accent

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** Baseline finding F-1: the active item's label in `BottomNavigationBar` (shown below
`lg`) was `text-brand-primary`, `#e896a3` on `#ebebeb`, 1.88:1 against 4.5:1 for 12px text (WCAG
1.4.3), light theme. No palette step of the brand colour reaches 4.5:1 on a light surface.

**Decision.** Chosen by the user at the Phase 0 stop. The active label renders in `text-ink`,
semibold; the icon stays `text-brand-primary`; `aria-current="page"` is unchanged.

**Options considered.**

- _Keep the pink label and record a deviation_, as ADR-0017 does for buttons. Rejected: the
  failure stays for every user below `lg`.
- _A darker brand step._ Rejected: none exists that passes, so it means a new palette value, a
  brand change.

**Consequences.** The active item is now marked by weight and icon colour rather than label colour,
which also gives it a cue that is not colour alone (WCAG 1.4.1). The icon is decorative beside its
visible label, so its own contrast is not a 1.4.11 requirement.

## D-09 — Light `--text-tertiary` maps to `gray-700`

- **Status:** Accepted
- **Date:** 2026-09-29

**Context.** Baseline finding F-2: light `--text-tertiary` is `gray-600` `#737373`, which is 3.97:1
on `--bg` (`#ebebeb`) and exactly 4.5:1 on `--surface`. It fails WCAG 1.4.3 wherever tertiary text
sits on the page background (`/metrics`, `/metric-categories` today).

**Decision.** Chosen by the user at the Phase 0 stop. Light `--text-tertiary` becomes `gray-700`
`#5c5c5c`: 5.61:1 on `--bg`, 6.34:1 on `--surface`. Dark is unchanged.

**Options considered.**

- _Keep the token and record a deviation._ Rejected: it stays below AA.
- _Move the two call sites to another token._ Rejected: the token would stay unsafe on `--bg` for
  the next caller.

**Consequences.** Light `--text-secondary` is already `gray-700`, so in the light theme tertiary and
secondary text are now the same colour and that step of the hierarchy is gone; dark keeps it. The
palette has no step between 600 and 700 that reaches 4.5:1 on `--bg`. Restoring the distinction
means a new palette value or a secondary step darker than 700, both brand-level decisions for
later.
