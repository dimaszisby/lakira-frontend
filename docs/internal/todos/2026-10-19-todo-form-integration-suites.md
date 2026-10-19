# 2026-10-19 - Todo: integration suites for the four forms that had none

**Context:** debt register row F-41, "integration coverage is still being widened", from
`2026-02-18-tests-structure-overhaul.md`. Its source item named no end. This gives it one:
**every component that calls a query or mutation hook has an integration suite.** A grep for
`use…Query(` and `use…Mutation(` across `src/app` and `src/features`, against
`__tests__/<Name>.int.test.tsx`, found four without one. Two of them hold the account-recovery path,
whose only other check was a stack spec CI does not run.

## Checklist

- [x] `src/features/auth/components/__tests__/ForgotPasswordForm.int.test.tsx`, 4 cases:
  - sends `{ email }` and shows "Check your email";
  - an invalid address sends nothing;
  - a refusal shows the server's sentence;
  - pending disables the button.
- [x] `ResetPasswordForm.int.test.tsx` (same folder), 5 cases:
  - no token shows "This link is not valid" and no form;
  - mismatched passwords send nothing;
  - success sends `{ token, password, passwordConfirmation }`, and "Go to login" pushes `/login`;
  - a rejected token shows the server's sentence;
  - pending.
- [x] `EmailVerificationNotice.int.test.tsx` (same folder), 4 cases:
  - verified renders nothing;
  - resend shows "Sent." and removes the button;
  - a 429 shows the server's sentence;
  - pending.
- [x] `src/features/organizations/components/__tests__/InviteMemberForm.int.test.tsx`, 5 cases:
  - posts `{ email, role: "member" }` to the active organization's invites, shows "Invitation
    sent." and clears the field;
  - the chosen role is sent;
  - an invalid address sends nothing;
  - a 409 shows the server's sentence and keeps the address;
  - pending.
- [x] Every suite: requests declared per test (an undeclared one fails it), queries by role and
      label, axe in each state that renders differently.
- [x] Seen to fail. The forms already work, so one mutation each, restored and checked with
      `git diff`. Each failed exactly the matching case:
  - the server-error line removed from `ForgotPasswordForm`;
  - the token blanked in `ResetPasswordForm`'s request;
  - the verified early return removed from `EmailVerificationNotice`;
  - `reset()` removed from `InviteMemberForm`'s success.
- [x] Found and fixed, with the owner's go-ahead: coverage counted test files as source.
  - With the four suites added, the unit gate failed at 40.93 % lines against 41 %, though no
    source changed: the unit run counted integration test files, which it never executes, as
    uncovered source, and its own test files as covered.
  - `collectCoverageFrom` in `jest.config.ts` now excludes `__tests__/`, `*.test.*` and
    `src/test-utils/`.
  - Measured on source only: 55.61 / 46.14 / 49.74 / 55.13 (statements, branches, functions,
    lines). Thresholds ratcheted from 42 / 43 / 37 / 41 to 54 / 45 / 48 / 54 by the documented
    rule. `CLAUDE.md` and `.claude/rules/testing.md` say so.
  - The per-folder goals all pass and are unchanged.
- [x] Gates

## Status

Done 2026-10-19 on `test/form-integration-suites`, in two commits: the suites, then the coverage
measurement. Integration 160 (from 142), unit 1030.

Coverage before this branch was 43.29 / 45.57 / 37.66 / 42.24 on the old basis. The suites do not
change the unit figure on the new basis, since the unit run does not execute them.

F-41 keeps only its deferred folder split.
