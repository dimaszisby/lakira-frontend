# Unquarantine layout files — Checklist

This sweep changes the props of `Sidebar` and `Layout`. A changed public prop is the re-size
trigger in `.claude/rules/workflow.md` § Task flow. It was named when the work was sized and the
size was kept: the prop change is the whole of the planned work, each component has one caller,
and the layer rule it satisfies is already recorded. The kit carries two decisions where a small
sweep owes one, because the two files needed different answers.

## Phase 0 — the two files and the rule

- [x] `src/components/layout/Header.tsx` — no `userAtom`, no `jotai`, no `"use client"`; renders
      unconditionally (D-01)
- [x] `src/components/layout/type.tsx` — `SidebarProps` has `onLogout` and `isLoggingOut`
- [x] `src/components/layout/Sidebar.tsx` — no import from `features`; the confirm button calls
      `onLogout` and is disabled while `isLoggingOut` (D-02)
- [x] `src/components/layout/Layout.tsx` — takes the same two props and passes them to `Sidebar`
- [x] `src/app/(app)/_components/AppShell.tsx` — new Client Component; owns
      `useLogoutUserMutation`, the toast and the push to `/login`; renders `Layout`
- [x] `src/app/(app)/layout.tsx` — renders `AppShell`
- [x] `eslint.config.mjs` — the quarantine block is deleted; a four-line comment says no file is
      exempt

## Phase 1 — tests

- [x] `src/app/(app)/_components/__tests__/AppShell.int.test.tsx` — sign-out posts to
      `/api/auth/logout` and pushes `/login`; a 500 leaves the user in place; axe. The two
      sign-out cases moved here from the sidebar's suite
- [x] `src/components/layout/__tests__/Sidebar.int.test.tsx` — confirm calls `onLogout` once;
      cancel does not; `isLoggingOut` disables the button
- [x] `src/components/layout/__tests__/Layout.int.test.tsx` — props supplied
- [x] `src/components/layout/__tests__/Header.test.tsx` — new; wordmark, both links, the banner
      landmark, axe

## Phase 2 — docs, after review

- [x] `CLAUDE.md` § Known state of the repo
- [x] `.claude/rules/architecture.md` § Layer boundaries
- [x] `docs/explanation/architecture/layers-and-boundaries.md` § The quarantine, now empty
- [x] `docs/how-to/development/add-a-feature-module.md` — said six files; was already stale
- [x] `CONTRIBUTING.md` — said six files; found by review
- [x] `SAAS-BASE-CHECKLIST.md` — C6 reads "Fixed, pending a dated run", as F-08's row does
- [x] `docs/internal/initiatives/frontend-debt-register/register.md` — F-09 to Closed; rows
      F-48 to F-50 and question O-11; the kit README's status line
- [x] `docs/internal/initiatives/frontend-debt-register/analysis-c6-quarantined-layout-files.md`
      — a pointer to this kit under its heading; the body is left as written

## Discovered

- [x] Found: the analysis's premise for `Header` is false. A signed-in visitor can render four
      of the six `(auth)` pages: only `login` and `register` redirect a usable session → in
      scope, D-01
- [x] Found: `docs/explanation/architecture/app-router-and-modal-routing.md` said `(app)` renders
      "the sidebar and header" and `(auth)` "a bare centred card"; the header is in `(auth)`
      (review) → in scope, one sentence corrected
- [ ] Found: nothing sets the mobile drawer open (`Layout.tsx` only ever calls
      `setMobileSidebarOpen(false)`), so below 1024 px there is no visible way to sign out. Seen
      in a browser at 1000 px: the one displayed "Logout" button sits at x -263 to -25. Not a
      regression; `dev` is the same → out of scope, register row F-48, question O-11
- [ ] Found: that off-screen button has `tabIndex` 0 and no `inert` or `aria-hidden` ancestor, so
      the closed drawer's controls are in the tab order. Same browser run → out of scope,
      register row F-49
- [ ] Found: no Cypress spec signs out, public or stack → out of scope, register row F-50
- [x] Noted, not checked: after signing in, the browser's Back button returns to `/login` by a
      client navigation with the user atom still set. The old header would have been hidden
      there and now shows; the page's own redirect for a usable session runs either way (review)
      → recorded under D-01's consequences

## Acceptance

- [x] AC-1 — the quarantine block is gone from `eslint.config.mjs` and `npm run lint` passes.
      _Why:_ audit finding C6; the rule then holds for every file in `src/components/`.
      · **lint**, and a grep: no file under `src/components/` outside `__tests__` imports
      `features`, `services` or `app`
- [x] AC-2 — signing out from the sidebar clears the session and lands on `/login`. _Why:_ the
      comment that moves with the call records the regression this once caused.
      · **jest**, `AppShell.int.test.tsx`: the POST to `/api/auth/logout` and the push; it failed
      first against a wrapper that did not call the mutation. **Browser**, production build,
      local stack, 1280 px, temporary spec: both cookies gone after confirming, and `/dashboard`
      then redirects to `/login`. The mobile drawer was not exercised: nothing opens it (F-48)
- [x] AC-3 — `Sidebar.int.test.tsx` and `Layout.int.test.tsx` pass with the handler supplied
      from outside. _Why:_ both suites cover this flow today. · **jest**
- [x] AC-4 — the sign-in pages show the header to a signed-out visitor as before. _Why:_ the
      header's only job. · **jest**, `Header.test.tsx`; **Cypress**, the public axe specs load
      `/login` and `/register` in both themes and pass
- [x] AC-5 — `CLAUDE.md` and `.claude/rules/architecture.md` no longer describe a quarantine.
      _Why:_ both state it as current fact. · **I checked it**: a grep for "quarantin" over the
      live docs; what remains is history, or a record left as written
- [x] AC-6 — the header stays on the page after a successful sign-in until the navigation
      completes. _Why:_ D-01's one behaviour change, stated so it is not found by surprise.
      · **reasoned from code, not observed**: `Header` reads no state, which `Header.test.tsx`
      shows by rendering it with no provider. The moment itself is too short to assert on
- [x] The temporary spec is deleted; `git status` does not show it

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — 981, with coverage; `coverage:check` passes
- [x] integration — 136
- [x] spec drift — `api:spec:check`, before handover
- [x] build — no warnings
- [x] e2e — 18; e2e (csp) — 7; e2e (stack) — 28, on the final build
- [x] e2e (csp, stack) — run although its trigger did not apply, because `Header` became a
      Server Component under the policy
