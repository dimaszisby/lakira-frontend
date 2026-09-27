# Organization switcher — Checklist

## Phase 0 — Data access

- [x] `src/features/organizations/types.ts` — `UserOrganization` aliased from the generated schema
      (D-05); the first import of the generated types anywhere in `src/`
- [x] `src/features/organizations/api.ts` — `listMyOrganizations()` and
      `switchOrganization(organizationId)`, `withApiErrorHandling` + `unwrap`
- [x] `src/features/organizations/keys.ts` — `organizationKeys.mine(organizationId)` (D-04)
- [x] `src/features/organizations/hooks/my-organizations.query.ts`
- [x] `src/features/organizations/hooks/switch-organization.mutation.ts` — switch, persist, then
      `/dashboard` or the revive fallback (D-02, D-03)
- [x] `persistSessionToken` returns `boolean`, and moved to `src/features/shared/session.client.ts`
      (D-06); login and register unchanged apart from the import path
- [x] `src/lib/routes.ts` — `authRoutes.revive(returnUrl)`, `returnUrl`-safe like its neighbours
- [x] `src/lib/hard-navigate.ts` — `window.location.assign`, in its own module so tests can mock it

## Phase 1 — UI

- [x] `src/features/organizations/components/OrganizationSwitcher.tsx` — list (`role="list"`, per
      `accessibility.md`), current marker in text, "Switch to {name}" buttons, loading / error with
      retry / one-organization / in-flight states, errors via `ErrorMessage` (`role="alert"`)
- [x] `src/app/(app)/organization/page.tsx` — renders it above `MemberList` (D-01)

## Phase 2 — Tests

- [x] `OrganizationSwitcher.int.test.tsx` — 16 tests, MSW per test, covering AC-1 to AC-10
- [x] `src/features/shared/__tests__/session.client.test.ts` — the new return contract, 4 tests.
      This replaced the planned unit test of the mutation's sequencing: the integration suite
      already asserts the order through real requests (switch body, session body, navigation), and
      the contract that changed is `persistSessionToken`'s
- [x] `auth/switch-org` not in `PUBLIC_API_PATHS` — already asserted by
      `src/lib/__tests__/auth-paths.test.ts`; no new test needed
- [x] `key-tenant-scoping.test.ts` — `organizations.all`, `.members` and `.mine` added, plus the
      layout row; 92 tests pass
- [x] Each regression test watched failing against a deliberately broken implementation:
  - no revive fallback → the AC-6 test fails
  - buttons re-enabled on success → the AC-8 test fails
  - `persistSessionToken` ignoring `response.ok` (its old behaviour) → the AC-6 integration test
    and the unit test's rejection case fail

## Phase 3 — Live check and docs

- [ ] AC-11 against a local backend — **blocked**: the running backend container (`node_app`,
      port 8001) was built 2026-09-13, before lakira-backend #114, and answers `GET /organizations`
      with 404. Needs the container rebuilt from backend `dev`; not done here because it restarts
      shared local infrastructure. Expected against that old backend, from the tests rather than a
      browser: the 404 is a list error, so the switcher shows its error state with "Try again".
- [x] `docs/reference/routes-and-proxy.md` — "Switching organization" section
- [x] `src/features/organizations/context.tsx` — the comment points at ADR-0020
- [x] `.claude/rules/data-access.md` — tenant changes reload the document, ADR-0020
- [x] `docs/internal/todos/2026-08-24-todo-saas-readiness.md` — Phase 6 item: built, not verified
      live
- [x] D-02 promoted to ADR-0020; its entry here carries the banner. Registry row added;
      `CLAUDE.md` says 20 ADRs

## Discovered

- [x] Found: a cross-feature import (`organizations` → `auth`) that lint does not catch but
      `architecture.md` forbids → in scope, D-06
- [x] Found: `organizationKeys` was never in `key-tenant-scoping.test.ts`, including the existing
      `members` key → in scope, added
- [x] Found: `axios-retry` retries GETs on 5xx with backoff, so a 500 holds the list in its loading
      state for seconds before the error shows → not a defect; the list-error tests use a 403 and
      say why
- [x] Found: audit finding "[P1] Session-persistence failures are swallowed" (login and register)
      was tracked nowhere → out of scope, filed as
      `docs/internal/todos/2026-09-28-todo-login-ignores-session-persist-failure.md`

## Acceptance

- [x] AC-1 — integration test · `OrganizationSwitcher.int.test.tsx`
- [x] AC-2 — integration test (text, not class) · same file
- [x] AC-3 — integration test, queried by accessible name · same file
- [x] AC-4 — integration test: request body, `/api/auth/session` body, `hardNavigate("/dashboard")`
- [ ] AC-5 — **nobody can check it live yet**: needs a second membership (see plan, Out of scope).
      Covered by AC-4's test up to the navigation; the layout reading the new claim is existing,
      tested behaviour.
- [x] AC-6 — integration test: session write rejected, navigation goes to the revive route
- [x] AC-7 — integration test: 403 and network failure, `role="alert"`, no navigation, no session
      write
- [x] AC-8 — integration test: every button disabled while pending and after success
- [x] AC-9 — integration test: loading, error with a retry that recovers, one organization
- [x] AC-10 — jest-axe in five states · same file
- [ ] AC-11 — blocked, see Phase 3

## Gates

- [x] lint — pass (`--max-warnings=0`)
- [x] css lint — pass; no styles changed
- [x] typecheck — pass
- [x] format — pass
- [x] unit tests — 81 suites, 683 tests, pass; `coverage:check` pass (global 32.85 % statements)
- [x] integration — 20 suites, 115 tests, pass
- [x] spec drift — `api:spec:check` and `api:types:check` pass
- [x] build — pass, in a scratch worktree (a dev server owns this checkout's `.next`)
- [ ] e2e — skipped: no Cypress coverage of this flow exists; see Out of scope
