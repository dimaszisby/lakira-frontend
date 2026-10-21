# Mobile sign-out — Checklist

Register rows F-48 and F-49, found in kit `unquarantine-layout-files` (checklist § Discovered).
Below 1024 px there was no way to sign out, and the closed mobile drawer kept its controls in the
tab order off screen. The owner chose the account page and the drawer's removal (O-11,
[D-01](decisions.md), promoted to ADR-0033); the controls are named by their visible text
([D-02](decisions.md)).

## Code

- [x] `src/components/layout/SignOutControl.tsx`: the "Sign out" button and its confirmation
      dialog (Cancel, Sign out, "Signing out…" while pending), with no `aria-label` (D-02).
      Feature-free; the caller passes `onSignOut` and `isSigningOut`
- [x] `src/app/(app)/_components/useSignOut.ts`: `AppShell`'s logout wiring moved verbatim
      (the mutation, the toasts, the push to `/login`)
- [x] `src/app/(app)/_components/AppShell.tsx`: uses `useSignOut`
- [x] `src/components/layout/Sidebar.tsx`: desktop only. The drawer, its scrim, its close button
      and `SidebarContentWrapper` are gone; it renders `SignOutControl`
- [x] `src/components/layout/type.tsx`: `SidebarProps` loses `isMobileOpen` and `onClose`
- [x] `src/components/layout/Layout.tsx`: no drawer state; `BottomNavigationBar` gets no
      `onLinkClick`
- [x] `src/app/(app)/account/page.tsx`: a "Session" card with `SignOutControl`, and the same
      control in the profile-error card
- [x] `src/styles/tokens/components/app-chrome.{tokens,recipe}.css`: `--chrome-scrim-bg` and
      `.chrome-scrim` removed; the drawer's scrim was their only user (review)

## Tests

- [x] `src/components/layout/__tests__/SignOutControl.test.tsx`: Cancel closes without signing
      out; confirm calls `onSignOut` once; disabled while pending; every name is its visible
      text, with no `aria-label`; axe with the dialog closed and open. The three sign-out cases
      moved here from `Sidebar.int.test.tsx`
- [x] `src/components/layout/__tests__/Sidebar.int.test.tsx`: the removed props dropped; one
      sign-out control, no mobile navigation
- [x] `src/components/layout/__tests__/Layout.int.test.tsx`: no "Mobile navigation" landmark, no
      "Mobile sidebar navigation", and one sign-out control
- [x] `src/app/(app)/_components/__tests__/AppShell.int.test.tsx`: finds the controls by
      "Sign out"
- [x] `src/app/(app)/account/__tests__/AccountPage.int.test.tsx`: `next/navigation` mocked;
      signing out from the Session card and from the profile-error card each post once to
      `/api/auth/logout` and push `/login`
- [x] `cypress/e2e/stack/sign-out.cy.ts`: the 1280 px cases select by "Sign out"; new 600 px
      cases in both themes sign out through the bottom bar's Account tab
- [x] `cypress/e2e/csp-stack/app-pages.cy.ts`: the sign-out case selects by "Sign out"

## Docs and rules

- [x] ADR-0033 and its registry row; D-01 carries the promotion banner
- [x] `.claude/rules/accessibility.md` § Structure: where signing out lives, and no off-screen
      copies of controls
- [x] `docs/reference/accessibility-baseline.md` § 7.1: the drawer sentence
- [x] Register: F-48 and F-49 closed, O-11 removed, "As of" at `7fc20e5`; the register README's
      status line
- [x] `unquarantine-layout-files` checklist: the two Found boxes ticked, pointing here
- [x] `.claude/lessons.md`: the owner's 2026-10-21 correction about "What's next"

## Discovered

- [x] Found: `AppShell.int.test.tsx` also found the controls by their old names → in scope,
      § Tests
- [x] Found: the drawer's scrim was the only user of `.chrome-scrim` and `--chrome-scrim-bg`
      (review) → in scope, § Code

## Acceptance

- [x] At 600 px, a signed-in user reaches the account page from the bottom bar and signs out;
      the session ends and `/login` shows the toast, in both themes. _Why:_ F-48. · **Cypress**,
      `stack/sign-out.cy.ts`, the two 600 px cases; seen to fail with the Session card removed,
      on a production build.
- [x] The account page still offers sign-out when the profile fails to load. _Why:_ a failing
      profile can mean a failing session, and a phone has no sidebar to fall back on.
      · **jest**, `AccountPage.int.test.tsx`; seen to fail with the error-state control removed.
- [x] No sign-out control or navigation link sits off screen in the tab order. _Why:_ F-49. ·
      **jest**, `Layout.int.test.tsx` and `Sidebar.int.test.tsx`: one sign-out control, no
      drawer landmark; seen to fail with a second control in an `lg:hidden` wrapper.
- [x] Every sign-out control's accessible name is its visible text. _Why:_ WCAG 2.5.3 Label in
      Name (D-02). · **jest**, `SignOutControl.test.tsx`; seen to fail with
      `aria-label="Logout"` restored on the trigger.
- [x] Signing out from the desktop sidebar is unchanged: the same endpoint, the push, a 500 that
      leaves the user in place. _Why:_ the `unquarantine-layout-files` AC-2 still holds. ·
      **jest**, `AppShell.int.test.tsx`; **Cypress**, `stack/sign-out.cy.ts` and
      `csp-stack/app-pages.cy.ts` at 1280 px.

## Gates

Run 2026-10-21 on Node 24.21.0, against a production build with CI's environment and the local
backend at `230aada` (backend `dev`).

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with coverage: 1085 tests; 56.41 / 46.6 / 50.96 / 55.94 %, every folder goal met
- [x] integration: 169 tests
- [x] spec drift: `api:spec:check` (33 paths) and `api:types:check` in sync; `security:audit` clean
- [x] build
- [x] e2e and e2e (csp): 18 and 7 tests
- [x] e2e (stack) and e2e (csp, stack): 60 and 8 tests
