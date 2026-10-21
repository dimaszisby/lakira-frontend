# ADR-0033 — Below `lg`, signing out lives on the account page

- **Status:** Accepted
- **Date:** 2026-10-21
- **Origin:** kit `mobile-sign-out`, D-01 — [`decisions.md`](../../internal/initiatives/mobile-sign-out/decisions.md); debt register rows F-48 and F-49, owner question O-11

---

## Context

Below 1024 px there was no way to sign out. The only sign-out button outside the desktop sidebar
sat in a mobile drawer in `src/components/layout/Sidebar.tsx`, and nothing opened the drawer:
`Layout.tsx` only ever set it closed (F-48). The closed drawer was translated off screen but not
hidden, so its five links and its button stayed in the tab order, and a keyboard user tabbed
through controls they could not see (F-49).

Mobile navigation was already the bottom bar, `BottomNavigationBar.tsx`, with the same five
destinations. The drawer repeated it.

## Decision

The owner chose this on 2026-10-21.

- The account page carries a sign-out control, at every width, in a "Session" card. It also offers
  one when the profile fails to load, since a failing profile can mean a failing session. On a
  phone, the bottom bar's Account tab leads to it.
- The mobile drawer is deleted: its scrim, its close button, and `Sidebar`'s `isMobileOpen` and
  `onClose` props. `Sidebar` renders the desktop sidebar only, from `lg` up.
- One control, `src/components/layout/SignOutControl.tsx`, renders the button and its confirmation
  dialog for both places. It stays feature-free, as the `components` layer requires.
- One hook, `src/app/(app)/_components/useSignOut.ts`, wires both places to the logout mutation.
  `AppShell` hands it to the sidebar, and the account page calls it directly.

## Options considered

- **A menu button that opens the drawer.** Rejected: it keeps a second navigation that repeats the
  bottom bar, adds a header control below `lg`, and still needs the closed drawer made inert to fix
  F-49.
- **A working drawer and an account-page control.** Rejected: two places to sign out on a phone,
  and the most code.
- **A sign-out item in the bottom bar.** Rejected: a sixth item in a bar sized for five, for an
  action taken rarely.

## Consequences

- Signing out on a phone takes two taps before the confirmation, Account and then Sign out. It is
  where people look for it.
- The off-screen controls are gone, not hidden, so F-49 cannot come back through a missing `inert`.
- A new control that only some widths need is shown or hidden with `hidden` / `lg:*` utilities,
  never moved off screen. `Layout.int.test.tsx` asserts there is one sign-out control and no drawer
  landmark, and `cypress/e2e/stack/sign-out.cy.ts` signs out at 600 px and at 1280 px.
- **Revisit** if mobile navigation ever needs more than the bottom bar's five destinations.
