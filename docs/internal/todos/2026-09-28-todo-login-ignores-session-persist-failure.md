# Login and register ignore a failed session write

**Purpose:** act on audit finding "[P1] Session-persistence failures are swallowed", which no todo
tracked.
**Owner:** hardini
**Branch:** unassigned
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

- [ ] `login.mutation.ts` and `register.mutation.ts`: when the write fails, treat the login as
      failed and show an error, rather than navigating into the app with no cookie.
- [ ] Integration test in `LoginForm.int.test.tsx` and `RegisterForm.int.test.tsx`: a 400 from
      `/api/auth/session` shows an error and does not navigate.
