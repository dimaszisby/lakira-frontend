# Mobile sign-out — Decisions

## D-01 — Below `lg`, signing out lives on the account page, and the mobile drawer is removed

> **Promoted to [ADR-0033](../../../explanation/decisions/adr-0033-sign-out-lives-on-the-account-page-below-lg.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-21

**Context.** Register rows F-48 and F-49, found in kit `unquarantine-layout-files` (checklist
§ Discovered).

- **F-48:** below 1024 px there was no visible way to sign out. The only button was in the mobile
  drawer in `src/components/layout/Sidebar.tsx`, and nothing opened that drawer: `Layout.tsx` only
  ever called `setMobileSidebarOpen(false)`.
- **F-49:** the closed drawer was translated off screen but not hidden, so its five links and its
  button stayed in the tab order. A keyboard user tabbed through controls they could not see.

Mobile navigation was already the bottom bar, `BottomNavigationBar.tsx`, with the same five
destinations. The drawer duplicated it.

**Decision.** The owner chose this on 2026-10-21 (register question O-11):

- the account page carries a sign-out control, at every width;
- the mobile drawer is deleted, with its scrim and the `isMobileOpen` and `onClose` props of
  `Sidebar`;
- the confirmation dialog is shared: one `SignOutControl` in `src/components/layout`, used by the
  desktop sidebar and the account page;
- one `useSignOut` hook in `src/app/(app)/_components` wires both to the logout mutation, so
  there is one way to sign out.

The bottom bar's Account tab is how a phone user reaches it.

**Options considered.**

- _A menu button that opens the drawer:_ keeps a second navigation that repeats the bottom bar,
  and adds a header control below `lg`. It also needs the closed drawer made inert to fix F-49.
- _Both, a working drawer and an account-page control:_ two places to sign out on a phone, and
  the most code.
- _A sign-out item in the bottom bar:_ a sixth item in a bar sized for five, for an action taken
  rarely.

**Consequences.**

- Signing out on a phone takes one more tap than a drawer would (Account, then Sign out), and it
  is where people look for it.
- The off-screen controls are gone rather than hidden, so F-49 cannot come back by a missing
  `inert`.
- `Sidebar` and `Layout` lose props, and `AppShell` delegates to `useSignOut`.

## D-02 — The sign-out control's visible text is its accessible name

- **Status:** Accepted
- **Date:** 2026-10-21

**Context.** The sidebar's button showed "Sign Out" but carried `aria-label="Logout"`. The dialog's
"Log Out" button was named "Confirm logout", and its "Cancel" button "Cancel logout". None of these
names contained the visible text, which fails WCAG 2.5.3 Label in Name; a speech user saying
"click Sign Out" had no match. `.claude/rules/accessibility.md` says not to override a visible label
with a different `aria-label`. The code is being moved into `SignOutControl` anyway (D-01).

**Decision.** No `aria-label` on any of them; the visible text is the name, in one vocabulary,
"sign out":

| Element                  | Visible text and accessible name              |
| ------------------------ | --------------------------------------------- |
| the button               | Sign out                                      |
| the dialog's title       | Sign out                                      |
| the dialog's description | Are you sure you want to sign out?            |
| the dialog's buttons     | Cancel, Sign out (Signing out… while pending) |

**Options considered.** Keeping the labels and changing the visible text to "Logout": the rest of
the app and the toast ("Logged out successfully") mix both words, but "Sign out" is what the
sidebar already showed. The toast is left as it is, since its text is not a control's name.

**Consequences.** Tests and specs that found the controls by "Logout" find them by "Sign out".
Two buttons on the account page's dialog path share the name "Sign out", the trigger and the
confirm, but never at once in the accessibility tree: the open dialog is modal and the page under
it is inert.
