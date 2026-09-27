# Organization switcher — Plan

- **Status:** Approved
- **Appetite:** 2 days — past that, cut scope rather than extend
- **Date:** 2026-09-27

## Context and goals

A user can belong to several organizations, and every piece of data the app shows is scoped to one
of them: the `organizationId` claim on the session token, read server-side in
`src/app/(app)/layout.tsx` and handed to `OrganizationProvider`. Until now the frontend had no way
to list a user's organizations, so it could not offer a switch. lakira-backend #114 added
`GET /organizations`, and #54 synced it into the generated types. `POST /auth/switch-org` has
existed since before this work: it checks the membership, issues a new access token carrying the
new claim in its body, and sets a fresh refresh cookie.

When this lands, a user on `/organization` sees every organization they belong to, which one they
are acting in, and can switch to another. After a switch, nothing from the previous organization is
on screen or in memory.

That last property is the point of the design. ADR-0015 made every cache key carry the
organization id so that two tenants' data can never share a key. A switch is the one moment the
active id changes within a browser session, so it is where that guarantee is tested.

## Acceptance criteria

- **AC-1** — `/organization` lists every organization returned by `GET /organizations`, each with
  its name and the user's role in it. _Why:_ a user in several organizations has to be able to see
  where they have access before choosing.
- **AC-2** — The organization the session is scoped to is marked as current in text, not by colour
  alone, and has no switch control. _Why:_ acting in the wrong tenant is the failure this feature
  exists to prevent; WCAG 1.4.1 forbids colour as the only signal.
- **AC-3** — Every other organization has a button whose accessible name includes the organization
  name ("Switch to Acme"). _Why:_ several identical "Switch" buttons are indistinguishable to a
  screen reader; WCAG 2.4.6 and 2.5.3.
- **AC-4** — Choosing one calls `POST /auth/switch-org` with its `organizationId`, stores the
  returned token as the session, and loads `/dashboard` as a full document navigation. _Why:_ D-02,
  a full load is what empties every client cache.
- **AC-5** — After the switch, the layout's organization claim is the target organization's.
  _Why:_ this is the success condition; everything else is mechanism.
- **AC-6** — If writing the session cookie fails after the backend switched, the app recovers
  through `/api/auth/revive?returnUrl=/dashboard` and still lands in the target organization.
  _Why:_ D-03, the backend has already rotated the refresh cookie to the new organization, so the
  session must follow it rather than keep the old token.
- **AC-7** — A failed switch (403: membership removed since the list loaded; 401; network) shows an
  error announced to assistive technology, stays on the page, and leaves the session unchanged.
  _Why:_ memberships can be revoked between loading the list and clicking; WCAG 4.1.3.
- **AC-8** — While a switch is in flight, every switch button is disabled. _Why:_ two concurrent
  switches would rotate the refresh token twice and race the cookie writes.
- **AC-9** — The list has a loading state, an error state with a retry, and a one-organization
  state that shows the organization as current with no buttons. _Why:_ most users today are in one
  organization; that must read as normal, not broken.
- **AC-10** — The new component has no `jest-axe` violations in any of the states above. _Why:_ the
  repo's integration-test baseline, `.claude/rules/accessibility.md`.
- **AC-11** — Against a local backend, a real one-organization user sees their organization listed
  as current. _Why:_ the only live path that can be verified today; see Out of scope.

## Open questions

None open. The forks visible now are listed under Decisions expected, each with a recommendation,
and approving this plan accepts them.

## Out of scope

- **A live two-organization switch.** A second membership needs an accepted invite, and an invite
  needs a token that is only delivered by email. That is the open backend request "A way to read
  emailed tokens outside production". AC-4 to AC-8 are verified with MSW until then; the live check
  moves to that request's follow-up.
- A switcher in the Sidebar or any shell-level control (D-01).
- Creating, renaming or leaving an organization. The API has no route for any of them.
- Cypress end-to-end coverage. That is the separate Cypress initiative, and it hits the same email
  blocker.

## Decisions expected

Recorded in [`decisions.md`](decisions.md) as `Proposed`; approving this plan accepts them.

- **D-01** — The switcher lives on `/organization`, not in the Sidebar.
- **D-02** — A successful switch ends in a full document load of `/dashboard`, not a client-side
  `router.push` or `router.refresh`. Candidate for an ADR at the end: it constrains how any future
  tenant change must behave.
- **D-03** — The token from the response is stored through the existing `/api/auth/session` path;
  if that write fails, fall back to the revive route.
- **D-04** — The list's cache key stays under `organizationKeys`, scoped by the current
  organization id, although the response is user-scoped.
- **D-05** — The list uses the generated `UserOrganization` type, not a new hand-written DTO.

## Phases

### Phase 0 — Data access

- `src/features/organizations/api.ts`: `listMyOrganizations()` (`GET /organizations`) and
  `switchOrganization(organizationId)` (`POST /auth/switch-org`), in the module's existing
  `withApiErrorHandling` + `unwrap` shape.
- `src/features/organizations/types.ts`: `UserOrganization`, aliased from the generated
  `components["schemas"]["UserOrganization"]` (D-05).
- `src/features/organizations/keys.ts`: `organizationKeys.mine(organizationId)` (D-04).
- `src/features/organizations/hooks/`: `my-organizations.query.ts` and
  `switch-organization.mutation.ts`, per the `<operation>.<kind>.ts` convention.
- `src/features/auth/session.client.ts`: `persistSessionToken` returns whether the write succeeded,
  so the switch can detect a failure (D-03). Existing callers ignore the return value, so login and
  register do not change.

### Phase 1 — UI

- `src/features/organizations/components/OrganizationSwitcher.tsx`: the list, the current marker,
  the switch buttons, and the loading, error, one-organization and in-flight states. Built from the
  existing `src/components/ui` primitives and tokens (`.claude/rules/styling.md`).
- `src/app/(app)/organization/page.tsx`: render it above `MemberList`.

### Phase 2 — Tests

- Integration (`*.int.test.tsx`, MSW per test): AC-1 to AC-10, including the 403 path, the
  cookie-write failure falling back to revive, and `jest-axe` in each state. Navigation is asserted
  on the `window.location` call, not on `router.push`.
- Unit: the mutation's sequencing (switch, persist, navigate or fall back).
- `src/features/__tests__/key-tenant-scoping.test.ts` must still pass with the new key.
- Each regression test is shown to fail against the unfixed code before it counts
  (`.claude/lessons.md`, 2026-09-15).

### Phase 3 — Live check and docs

- AC-11 against a local backend.
- Docs, after review: the switch flow in `docs/reference/routes-and-proxy.md` (the proxy already
  persists the rotated refresh cookie on any response, so nothing changes there, but the flow is
  worth one paragraph); a pointer from `OrganizationProvider`'s comment to D-02; the
  saas-readiness todo's Phase 6 item.

## Risks and trade-offs

- **The full reload costs a second or so of blank page.** Accepted for a rare action: correctness
  across tenants beats a smooth transition. D-02 has the alternatives.
- **The cookie write can fail after the backend has switched.** Then the refresh cookie belongs to
  the new organization and the access token to the old one. Left alone, the next 401 refresh would
  flip the organization about fifteen minutes later, with no user action. D-03's fallback closes
  that gap immediately.
- **The live two-organization path stays unverified** until the email request lands. It is stated
  here and in the PR, not implied by green tests.

## Rollback

Revert the PR. No data, schema or cookie format changes. A user who switched keeps a valid session
in the organization they switched to, because that is a backend fact.

## Security and data

The change crosses the auth boundary, so it is stated:

- `POST /auth/switch-org` and `GET /organizations` are both secured upstream. Neither is in
  `PUBLIC_API_PATHS` (`src/lib/auth-paths.ts`), so the proxy requires a session for both with no
  change. A test asserts that `auth/switch-org` stays out of that list.
- The target organization id comes from the backend's own list, and the backend re-checks the
  membership on the switch (a 403 otherwise). The frontend never decides membership.
- The new token is stored only through `/api/auth/session`, which checks that it is well-formed and
  unexpired and that the backend accepts it before writing the cookie.
- The refresh cookie rotation is handled by the proxy, as for every other response
  (`captureRefreshCookie`).

## Observability

The proxy already logs `proxy.refreshed` and `proxy.session.cleared`, and the revive route logs
`auth.revive.succeeded` and `auth.revive.failed`, so the D-03 fallback shows up in the logs. No new
client event: a switch is a user action whose outcome is visible on screen.

## Accessibility

User-facing, so stated: a semantic list; the current organization marked in text (1.4.1); each
button named with its organization (2.4.6, 2.5.3); errors in a live region (4.1.3); disabled state
during the switch, which is visible and exposed (4.1.2); keyboard order following the list. No known
deviations.

## References

- ADR-0015 — cache keys are organization-scoped
- `docs/internal/incidents/fix-metric-detail-cache-stale-20251130.md` — the RSC client cache
  surviving navigation
- `docs/internal/incidents/fix-searchParams-and-cookies-20251130.md` — server prefetches and the
  session cookie
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` —
  `router.refresh()` clears the client cache for the current route only
- Backend: lakira-backend #114 (`GET /organizations`); Notion "FE message to BE"
