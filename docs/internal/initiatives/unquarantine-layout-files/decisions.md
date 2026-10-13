# Unquarantine layout files — Decisions Log

`D-NN` entries scoped to this kit. `F-NN` is a row of
[`frontend-debt-register/register.md`](../frontend-debt-register/register.md).

---

## D-01 — `Header` loses its signed-in check and takes no prop in its place

- **Status:** Proposed
- **Date:** 2026-10-13

**Context.** `src/components/layout/Header.tsx` imported `userAtom` from `services` to render
nothing when a user is signed in, which is one of the two imports F-09 exists to remove. The
register's analysis recommended deleting the check on the premise that a signed-in visitor is
redirected away from every `(auth)` page, and marked that premise unverified. Checked before any
code was written, it is false: `src/proxy.ts` gates only protected paths, and only
`login/page.tsx` and `register/page.tsx` redirect a usable session. `forgot-password`,
`reset-password`, `verify-email` and `invites/accept` render for a signed-in visitor. What makes
the check ineffective is something else. Nothing under `(auth)` fills `userAtom` on load: its
writers are the login and register mutations and `profile.query.ts`, and that query is called
only by `OrganizationProvider` in the `(app)` layout and by the account page. On a hard load of
any `(auth)` page the atom is `null` and the header shows, signed in or not. The branch runs in
one case only, between a successful sign-in or registration and the `router.push` that follows,
where the header disappears for a moment.
**Decision.** Delete the check. `Header` reads no state, so it needs no hook and stops being a
Client Component.
**Options considered.** An `isSignedIn` prop computed from the session cookie in
`(auth)/layout.tsx`: rejected, it would hide the header on the four pages where a signed-in
visitor sees it today, a behaviour change nobody asked for, made under a refactor. Keeping the
atom and moving `Header` under `src/app/`: rejected, it keeps a check whose only effect is a
flash.
**Consequences.** One visible change: after a successful sign-in or registration the header stays
until the navigation completes. A signed-in visitor on a password, verification or invite page
still sees "Login" and "Register" links, as before; whether that is wanted is a product question
this kit does not answer. Review added one case that was not checked in a browser: after signing
in, the Back button returns to `/login` by a client navigation with the atom still set, where the
old header would have been hidden and the new one shows; the page's own redirect for a usable
session runs in both versions.

## D-02 — `Sidebar` is handed its sign-out handler; a client wrapper in the `app` layer owns it

- **Status:** Proposed
- **Date:** 2026-10-13

**Context.** `src/components/layout/Sidebar.tsx` imported `useLogoutUserMutation` from `features`,
the second import F-09 removes. Its only importer is `Layout.tsx`, also a `components` file, and
`Layout`'s only importer is `src/app/(app)/layout.tsx`, a Server Component. Props that cross from
a Server Component to a Client Component must be serializable
(`node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`), so
the layout cannot pass a function down.
**Decision.** `Sidebar` takes `onLogout` and `isLoggingOut`, and `Layout` takes the same two and
passes them through. A new Client Component, `src/app/(app)/_components/AppShell.tsx`, calls
`useLogoutUserMutation` with the toast and the push to `/login`, and renders `Layout`. The
confirmation dialog stays in `Sidebar`: asking "are you sure" is presentation, and what happens
on yes is not.
**Options considered.** Moving `Sidebar` and `Layout` under `src/app/` (the analysis's option B):
rejected, more files move and `components/layout` is where the shell's landmarks are owned
(`.claude/rules/accessibility.md` § Structure). A presentational file plus a connected wrapper for
each (option C): rejected, the most files for the same result. Letting `components/layout` import
features (option D): rejected by the config's own comment, and it is the exemption being removed.
**Consequences.** `Layout` and `Sidebar` each gain two required props, so a caller that forgets
them fails typecheck. The sign-out wiring is now route code and is tested there
(`AppShell.int.test.tsx`); `Sidebar`'s own suite no longer reaches the network.
