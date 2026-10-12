# F-09 — Two layout files are quarantined from the layer rule (C6)

Register row [F-09](register.md). Read at `f67716e`.

## 1. What is wrong

`boundaries/element-types` is switched off for two files, `src/components/layout/Header.tsx` and
`src/components/layout/Sidebar.tsx` (`eslint.config.mjs:414-419`). The rule lets `components`
import from `lib`, `utils`, `types`, `generics` and `constants` only (`eslint.config.mjs:281`).
Each file breaks it once:

- `Header.tsx:7` imports `userAtom` from `@/services/state/atoms`, a `services` module.
- `Sidebar.tsx:10` imports `useLogoutUserMutation` from `@/features/auth/hooks/logout.mutation`,
  a `features` module.

`FINAL-AUDIT-SUMMARY.md` § 6 counted six such files; the list has only shrunk. The audit carries
it as C6, P2.

## 2. Root cause

Both files are app-shell pieces that need application state, and they live in the layer that is
not allowed to have any. `Header` hides itself when a user is signed in; `Sidebar` owns the
sign-out flow.

## 3. Options

- **A. Inject what they need as props.** `Sidebar` takes `onLogout` and a pending flag; its only
  importer is `src/components/layout/Layout.tsx:8`, itself a `components` file, so the props have
  to come from `src/app/(app)/layout.tsx`, which may import features. `Header` takes an
  `isSignedIn` flag, or loses the check: its only importer is `src/app/(auth)/layout.tsx:4`. Both
  files stay where they are and become plain presentational components.
- **B. Move the two files up a layer**, under `src/app/` or into `src/features/auth/components/`.
  No prop changes. `Layout.tsx` imports `Sidebar`, so it would have to move too, and
  `(app)/layout.tsx` would import the shell from a new path.
- **C. Split each file**: a presentational part stays, a thin connected wrapper moves up. The
  most files, the least change to any one of them.
- **D. Widen the rule** so `components/layout` may import features. Rejected in the config's own
  comment: "Do not add to this list. New code must satisfy the boundary rule."

## 4. Recommendation

**A for `Sidebar`, and delete the check from `Header`.**

`Header` is rendered only by the `(auth)` layout, on the sign-in pages, and shows nothing when
`userAtom` holds a user (`Header.tsx:11`). If a signed-in visitor is redirected away from those
pages before render, that branch never runs and the atom import can go with it. That needs confirming first
(section 8); if it does not hold, `Header` takes a prop instead.

For `Sidebar`, the sign-out wiring moves to the `(app)` layout's client side and arrives as props.
The comment at `Sidebar.tsx:54-57` records why the feature hook is used and not an inline
mutation; that reasoning moves with the call.

## 5. Acceptance criteria for the fix

- **AC-1** — The quarantine block is gone from `eslint.config.mjs`, and `npm run lint` passes.
  _Why:_ C6; the rule then holds for every file in `src/components/`.
- **AC-2** — Signing out from the sidebar still clears the session and lands on `/login`, on
  desktop and in the mobile drawer. _Why:_ the comment at `Sidebar.tsx:54-57` describes the
  regression this once caused.
- **AC-3** — `Sidebar.int.test.tsx` and `Layout.int.test.tsx` pass with the hook supplied from
  outside. _Why:_ both suites cover this flow today.
- **AC-4** — The sign-in pages show the header to a signed-out visitor exactly as now.
  _Why:_ the header's only job.
- **AC-5** — `CLAUDE.md` § Known state and `.claude/rules/architecture.md` no longer describe a
  quarantine. _Why:_ both state it as current fact.

## 6. Size and shape

≤½ day. A small sweep. It changes two components' props, which is this repo's re-size trigger, so
the checklist should say so; no ADR, because the layer rule is already recorded and this only
satisfies it. Gates: the always-on gates, integration, `e2e (stack)` (the app layout changes) and
`e2e` (the header is on public pages).

## 7. Depends on, unblocks

Depends on nothing. Closes C6 at the next dated run, and removes the "two files are exempt"
paragraph from the list of things a reader must know.

## 8. Not verified

- That a signed-in visitor can never render an `(auth)` page. `src/proxy.ts` was only skimmed
  for this file: it redirects an unauthenticated request to `/login`, and whether it also turns a
  signed-in one away from `/login` was not established. The recommendation for `Header` depends
  on it.
- Whether `userAtom` is set early enough for `Header`'s check to have any effect today.
- That `Sidebar.int.test.tsx` mocks nothing that the prop change would make unreachable.
- No reproduction was run for this kit.
