# The server sets the session cookie — Checklist

## Phase 0 — Kit

- [x] `README.md`, `server-set-session-cookie-plan.md`, this file
- [x] `decisions.md` — D-01, D-02, D-03
- [x] `docs/explanation/decisions/adr-0025-the-proxy-sets-the-session-cookie.md`, `Proposed`

## Phase 1 — Proxy

- [x] `src/lib/auth-paths.ts` — `TOKEN_ISSUING_API_PATHS`, `isTokenIssuingApiPath`
- [x] `src/app/api/proxy/[...path]/__tests__/route.test.ts` — AC-1 to AC-7, watched failing first
- [x] `src/app/api/proxy/[...path]/route.ts` — session cookie set, token removed, 502 on an
      unusable token

## Phase 2 — Client

- [x] `src/features/auth/hooks/login.mutation.ts`, `register.mutation.ts` — no `establishSession`
- [x] `src/features/organizations/hooks/switch-organization.mutation.ts` — switch, then
      `hardNavigate`; no revive fallback
- [x] `src/features/organizations/api.ts` — `switchOrganization` returns no token
- [x] `src/types/dtos/user.dto.ts` — `AuthResponseDTO` without `token`
- [x] Deleted: `src/app/api/auth/session/route.ts`, `src/features/shared/session.client.ts`,
      `src/features/shared/__tests__/session.client.test.ts`
- [x] `LoginForm.int.test.tsx`, `RegisterForm.int.test.tsx`, `OrganizationSwitcher.int.test.tsx` —
      no `/api/auth/session` handler
- [x] `cypress/support/stack.ts` — `signIn` is one request

## Phase 3 — Guard

- [x] `src/lib/__tests__/auth-paths.test.ts` — the contract walk, watched failing with a path
      removed from the list

## Phase 4 — Docs, after review

- [x] ADR-0025 `Accepted`; row in `docs/explanation/decisions/README.md`; banner on D-01
- [x] `.claude/rules/security.md` § Auth and session
- [x] `docs/reference/routes-and-proxy.md` § Switching organization
- [x] `docs/explanation/architecture/c4-context.md`, `docs/explanation/product-requirements.md` —
      the `/api/auth/session` mentions
- [x] `SECURITY.md` — N3 removed from the known items
- [x] `SAAS-BASE-CHECKLIST.md` — N1, N2, N3 marked fixed, pending a dated run
- [x] `docs/internal/todos/2026-10-04-todo-token-reaches-browser-javascript.md` — boxes and Status
- [x] `README.md` in this kit — status

## Discovered

- [x] Found: stripping `data.token` forwards any other copy of the token in the body (review) → in
      scope, D-04; `takeIssuedToken` refuses such a body
- [x] Found: no test combined a 401, a refresh and a token-issuing success, so the cookie ordering
      was unpinned (review) → in scope, two tests added to `route.test.ts`
- [x] Found: `docs/tutorials/getting-started.md` and
      `docs/reference/ci-pipeline/backend-handoff.md` also described the removed route → in scope,
      added to Phase 4
- [x] Found: `authRoutes.revive` in `src/lib/routes.ts` has no caller left outside its own test →
      out of scope, left in place; `src/proxy.ts` builds the same URL by hand and the two could be
      joined in a later change
- [x] Found: `POST /api/proxy/auth/refresh` goes round the refresh coalescer in
      `src/lib/auth-refresh.ts` (review). No client code calls it and it behaved this way before →
      out of scope, noted here only
- [x] Found: `CLAUDE.md` says "22 ADRs"; there are 25 → out of scope, not edited

## Acceptance

- [x] AC-1 — unit · `route.test.ts`
- [x] AC-2 — unit · `route.test.ts`
- [x] AC-3 — unit · `route.test.ts`
- [x] AC-4 — unit · `route.test.ts`
- [x] AC-5 — unit · `route.test.ts`
- [x] AC-6 — unit · `route.test.ts`
- [x] AC-7 — unit · `route.test.ts`
- [x] AC-8 — **live request** for the 404 · `grep` for the token read, result recorded below
- [x] AC-9 — unit · `auth-paths.test.ts`, mutation recorded below
- [x] AC-10 — **live**, production build · `curl` for the login body, `npm run test:e2e:stack` for
      the flows

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — with `coverage:check`
- [x] integration
- [x] spec drift — `api:types:check`; `api:spec:check` immediately before handover
- [x] `security:audit` — immediately before handover
- [x] build
- [x] e2e
- [x] e2e (stack)

## Evidence

Node 24.21.0. Production build, backend on `:8001`, Mailpit on `:8025`, 2026-10-05.

- **AC-1 to AC-7** — `route.test.ts`. Ten of the first thirteen new tests failed against the unfixed
  handler; the other three pin behaviour that must not change (an error on a token-issuing path, a
  token on another path, a `GET`).
- **AC-8** — `POST /api/auth/session` and `DELETE /api/auth/session` both answer 404.
  `grep -rn "\.token" src` outside tests matches three kinds of line: the proxy handler and
  `src/lib/auth-refresh.ts`; the server-side `/api/auth/revive` route; and the three pages that
  read an emailed link's `?token=` from the URL, which is not an access token. No client code
  reads a token from a response.
- **AC-9** — with `auth/refresh` removed from `TOKEN_ISSUING_API_PATHS`, "lists every operation
  whose success response carries a token" fails.
- **AC-10** — `curl` against the build: register 201, login 200 and refresh 200 each return a body
  with no `token` key and no JWT, and set `lakira_token` and `lakira_refresh` with
  `Secure; HttpOnly`. A wrong password still returns the backend's own 401 body.
  `npm run test:e2e:stack`: 13 of 13, including verify email, invite and switch, and reset
  password; its `signIn` helper asserts on every login that the body has no token.
- **Mutations, each caught:** a path removed from the list (4 tests fail), the token left in the
  body (6), the usability check dropped (4), no cookie set (4), an unusable token forwarded
  instead of the 502 (6), any method treated as issuing (1), error responses treated as issuing
  (2), the issued token written before the refreshed session (1), the repeated-token check
  removed (4).
- **Review** — `code-reviewer` agent, narrow brief. No path found by which a token still reaches
  the browser, and no half-written session. Its findings are the first three Discovered items.
