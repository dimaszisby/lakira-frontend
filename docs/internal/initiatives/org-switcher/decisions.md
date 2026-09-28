# Organization switcher — decisions

## D-01 — The switcher lives on `/organization`, not in the Sidebar

- **Status:** Accepted
- **Date:** 2026-09-27

**Context.** The control needs a home. The Sidebar is on every authenticated page; `/organization`
is where memberships are already managed.

**Decision.** A "Your organizations" section on `/organization`, above the member list.

**Options considered.**

- _Sidebar._ Better reach. Rejected for the same two reasons theme-switching's D-01 gave:
  `Sidebar.tsx` is quarantined from the layer rule at the bottom of `eslint.config.mjs`, and
  `CLAUDE.md` says not to add to that debt; and it renders twice, as a desktop `<aside>` and a
  mobile drawer, so the control would be duplicated in the DOM.
- _A slot passed from `src/app/(app)/layout.tsx` into the shell._ Respects the layers, but it is
  new shell API for a rare action. A later change can add it without revisiting anything here.

**Consequences.** Switching is two clicks from anywhere, not one. `/organization` becomes the one
place for everything about memberships.

## D-02 — A switch ends in a full document load of `/dashboard`

> **Promoted to [ADR-0020](../../../explanation/decisions/adr-0020-changing-organization-reloads-the-document.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-09-27

**Context.** After the backend switches, the old organization's data is still in the browser: the
TanStack Query cache, Jotai atoms, and the App Router's client cache of server-rendered payloads.
The organization id itself comes from the server layout, which reads the session cookie. The URL
may also point at a resource that belongs to the old organization (`/metrics/<id>`).

**Decision.** `window.location.assign("/dashboard")` once the new session is stored.

**Options considered.**

- _`router.refresh()` in place._ Next 16's `useRouter` docs: it "clears the Client Cache for the
  current route" only. Other routes' cached payloads would survive the switch, which is the shape of
  the 2025-11-30 stale-cache incident. The current URL may also 404 or 403 in the new organization.
- _`router.push("/dashboard")` plus `queryClient.clear()` plus resetting atoms._ Correct only if
  every cache is remembered, now and in future. Each new client store would be a new way to leak a
  tenant's data across a switch.
- _Full load._ Every client cache is emptied by construction, and the server layout re-reads the
  cookie on a fresh request. Costs a reload.

**Consequences.** A second or so of reload on a rare action. Any future client-side state is safe
across a switch without anyone having to remember it. An ADR candidate at the end of the work,
because it constrains every future change of tenant.

## D-03 — Store the token through `/api/auth/session`; fall back to revive on failure

- **Status:** Accepted
- **Date:** 2026-09-27

**Context.** `POST /auth/switch-org` returns the new access token in its body and sets a new refresh
cookie, which the proxy persists. Login already stores its token with `persistSessionToken`, which
posts it to `/api/auth/session`. That function swallows errors, which is acceptable at login but
not here: if the backend has switched but the cookie write fails, the refresh cookie is the new
organization's and the access token is the old one's. The organization would flip on the next 401
refresh, about fifteen minutes later, with no user action.

**Decision.** `persistSessionToken` returns whether the write succeeded. On success, navigate to
`/dashboard`. On failure, navigate to `/api/auth/revive?returnUrl=/dashboard`. That route redeems
the new organization's refresh cookie, writes a matching session and redirects, or clears the
session and goes to `/login` if it cannot.

**Options considered.**

- _Always go through revive and ignore the body token._ One code path, but it rotates the refresh
  token a second time on every switch, for no gain on the common path.
- _Report the error and stay._ Leaves the split session in place, which is the problem.

**Consequences.** Every exit from a successful backend switch leaves the browser either fully in
the new organization or logged out, never split. Existing callers of `persistSessionToken` ignore
the new return value and are unchanged.

## D-04 — The list's key is `organizationKeys.mine(organizationId)`

- **Status:** Accepted
- **Date:** 2026-09-27

**Context.** ADR-0015 requires every key factory outside `auth` to take the organization id first,
and `src/features/__tests__/key-tenant-scoping.test.ts` enforces it. `GET /organizations` is scoped
to the user, not an organization, so the id is not needed to identify the data.

**Decision.** Key it under `organizationKeys` with the current organization id anyway.

**Options considered.**

- _An `auth` key (user-scoped)._ Semantically closer, but it puts organization data in the auth
  module, and it is an exemption someone would have to reason about later.
- _A new exemption in the scoping test._ Rejected: the rule has no exceptions today, and that is its
  value.

**Consequences.** The same list is cached once per organization the user visits. Since D-02 reloads
on every switch, only one entry ever exists, so the cost is nil.

## D-05 — Use the generated `UserOrganization` type

- **Status:** Accepted
- **Date:** 2026-09-27

**Context.** `src/features/organizations/types.ts` hand-writes `Member`. The sync-api-types skill's
stance is that generated types replace hand-written DTOs feature by feature, and that the
generated one is right when they disagree.

**Decision.** `types.ts` exports `UserOrganization` as an alias of
`components["schemas"]["UserOrganization"]`. `Member` is left alone; moving it is not this work.

**Consequences.** A backend change to the shape surfaces as a type error at the next sync, not as
a silent mismatch.

## D-06 — `session.client.ts` moves to `src/features/shared/`

- **Status:** Accepted
- **Date:** 2026-09-28

**Context.** Found in Phase 0. The switch mutation stores the new token with
`persistSessionToken`, which lived in `src/features/auth/session.client.ts`.
`.claude/rules/architecture.md` allows cross-feature imports only through `src/features/shared/`.
ESLint's boundaries rule does not catch a feature importing another feature, so lint passed; the
rule is still the rule, and nothing outside `auth` imported from `auth` before this.

**Decision.** Move the file to `src/features/shared/session.client.ts` with `git mv`. Login and
register import it from there.

**Options considered.**

- _Import it from `auth` anyway._ Rejected: it would be the first cross-feature import, and the
  next one would cite it as precedent.
- _Duplicate the fetch in `organizations`._ Rejected: two writers of the session cookie that can
  drift apart.
- _Move it to `src/lib/`._ Rejected: `lib` holds framework-free helpers, and this one calls an app
  route handler; `features/shared/` is where the rule says shared feature code goes.

**Consequences.** Two import lines change in `auth`. The function's behaviour changes only in that
it now reports success, which login and register ignore.
