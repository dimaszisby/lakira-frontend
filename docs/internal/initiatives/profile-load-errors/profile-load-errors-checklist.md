# Profile load errors — Checklist

## Phase 0 — Let the error reach the page

- [x] `src/services/api/auth.api.ts`: `fetchUserProfile` is
      `withApiErrorHandling(() => api.get(...).then(unwrap), "fetchUserProfile")` and returns
      `UserAtom`; its doc comment says why (D-01)
- [x] `src/features/auth/hooks/profile.query.ts`: `shouldRetryProfile`, no retry on a 4xx other
      than 429 and at most two otherwise, the rule the metrics list queries use
- [x] `src/app/(app)/account/page.tsx`: the "Unable to load your profile." fallback removed, since
      a query error always carries `error`
- [x] `.claude/rules/data-access.md`: the line that called the `null` deliberate now says it
      rethrows and why
- [x] Tests: `AccountPage.int.test.tsx` asserts the message for a 401 and a 403;
      `profile.query.test.ts` covers the retry rule

## Discovered

- [x] Found: `.claude/rules/data-access.md` and the doc comment in `auth.api.ts` said
      `withApiErrorHandling` "logs and reports". It logs outside production only;
      `handleApiError` reports only to a `telemetry` option no caller passes → in scope, both
      corrected, since D-01's consequence depends on it.

## Acceptance

- [x] AC-1 — A failed profile request shows a message naming the failure, not only the generic
      sentence. Machine: `AccountPage.int.test.tsx`, 401 shows "Your session expired. Please log
      in again." and 403 shows the server's message. Both cases were seen to fail against the
      previous `fetchUserProfile`. Also seen in a browser against the local stack, with the
      request intercepted. _Why:_ F-27; an expired session and an outage looked the same.
- [x] AC-2 — The error card does not wait for a query retry on a 4xx. Machine:
      `profile.query.test.ts`. In the browser run, a refused request was sent once and its message
      showed 377 ms after the visit began. _Why:_ the card showed at once before this change.
- [x] AC-3 — A successful profile renders as before, with the theme switcher, and axe finds no
      violations. Machine: the unchanged integration cases; `app-pages.a11y.cy.ts` on `/account`
      signed in. _Why:_ the happy path must not move.
- [x] AC-4 — Nothing else reads the profile as `null` on failure. Checked by grep: the account
      page is the only caller; `userAtom` is set on success only and read nowhere. Typecheck
      passes with the return type narrowed to `UserAtom`. _Why:_ D-01 reverses a documented
      contract.

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — 992 pass, 9 new; `coverage:check` passes
- [x] integration — 137 pass
- [x] spec drift — `api:spec:check` in sync
- [x] build
- [x] e2e (stack) — 29 of 29
- [ ] e2e, e2e (csp), e2e (csp, stack) — skipped: no public page, policy or layout changed
