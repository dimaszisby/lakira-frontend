# Login and register ignore a failed session write

**Purpose:** act on audit finding "[P1] Session-persistence failures are swallowed", which no todo
tracked.
**Owner:** hardini
**Branch:** `fix/login-session-persist-failure` off `dev`
**Priority:** P1 in the audit; low urgency in practice, since `/api/auth/session` rejects only a
token the backend itself just issued as bad.
**Found:** 2026-09-28, while building the org switcher.

## What is wrong

`docs/internal/audits/saas-readiness/audit-2026-08-24.md` § 4.5: the call to `/api/auth/session`
was fire-and-forget, so a failed write left the user apparently signed in with no session cookie.

## What changed already

The org-switcher work moved `persistSessionToken` to `src/features/shared/session.client.ts` and
made it resolve `true` or `false` (org-switcher kit, D-03 and D-06), with a unit test. Login and
register still ignore the result.

## The fix

- [x] `login.mutation.ts` and `register.mutation.ts`: the session is stored inside the mutation
      through `establishSession`, so a failed write fails the sign-in: the form shows its error and
      nothing navigates. Moving it out of `onSuccess` is what makes the failure reach the form.
- [x] A missing token fails too. Both `LoginResponse` bodies in the OpenAPI contract require
      `token`, so its absence is a broken response, not a valid state; the old code wrote `null`,
      which cleared the cookie and still navigated.
- [x] `src/features/shared/session.client.ts`: `establishSession(token)`, shared by both.
- [x] Integration tests in `LoginForm.int.test.tsx` and `RegisterForm.int.test.tsx`: a 400 from
      `/api/auth/session`, and a response with no token, each show an error and do not navigate.
      Unit tests for `establishSession` in `src/features/shared/__tests__/session.client.test.ts`.
- [x] The 4 new integration cases watched failing against `dev`'s mutations, then passing with the
      fix.
- [x] `.claude/rules/security.md` § Auth and session: the rule, with the date it became true.

## Decision

**The user sees the generic connection message.** A thrown `Error` has no HTTP status, so
`handleApiError` renders "We couldn't reach the server. Check your connection and try again."
Accepted: a failed write means our own server was unreachable or refused, and trying again is the
right action. A dedicated message would need a client-error code threaded through
`normalizeApiError`, which is more plumbing than a rare failure warrants. Decided 2026-09-29.

## Verification

| Gate        | Result                                            |
| ----------- | ------------------------------------------------- |
| lint        | pass (`--max-warnings=0`)                         |
| css lint    | pass                                              |
| typecheck   | pass                                              |
| format      | pass                                              |
| unit        | 81 suites, 686 tests, pass; `coverage:check` pass |
| integration | 20 suites, 119 tests, pass                        |
| spec drift  | `api:spec:check`, `api:types:check` pass          |
| build       | pass, in a scratch worktree                       |
| e2e         | skipped: no Cypress coverage of login             |

## Status

**Complete.** Closes the 2026-08-24 audit's "[P1] Session-persistence failures are swallowed". The
audit is a dated record and is left as written. Not promoted to an ADR: a bugfix that restores the
obvious contract, recorded as a rule in `.claude/rules/security.md`.
