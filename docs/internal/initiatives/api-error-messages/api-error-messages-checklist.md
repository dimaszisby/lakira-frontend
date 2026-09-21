# API error messages — Checklist

## Phase 0 — the discriminator

- [x] `src/services/api/normalizeApiError.ts` — adds `serverCode?: string` and
      `hasServerMessage: boolean`. `messages` is never empty for an Axios error, so emptiness cannot
      answer "did the server say anything?" (`D-02`).
- [x] `src/app/api/proxy/[...path]/route.ts` — both self-issued 401s return
      `{ error: "Session expired", code: "SESSION_EXPIRED" }`, and the cleared-session path stops
      forwarding the upstream body (`D-03`).

## Phase 1 — the precedence

- [x] `src/services/api/handleApiError.ts` — `friendlyMessageFor` becomes `overrideMessageFor`
      (5xx and no-response only); a new `FRIENDLY_CODE_MESSAGES` handles `SESSION_EXPIRED`; the
      status map becomes a fallback reached only when `hasServerMessage` is false (`D-01`).

## Phase 2 — tests

- [x] `src/services/api/__tests__/handleApiError.test.ts` — **new file**; this module had no tests.
- [x] `src/services/api/__tests__/normalizeApiError.test.ts` — the two new fields, plus the existing
      strict-shape test updated for the additive field.
- [x] `src/app/api/proxy/[...path]/__tests__/route.test.ts` — both halves of AC-5.
- [x] `src/features/auth/components/__tests__/LoginForm.int.test.tsx` — the 401 test tightened from
      "is not the connection copy" to an exact assertion.

## Discovered

- [x] Found: `LoginForm.int.test.tsx` already carried a comment saying the 401 copy was wrong for a
      login form and "logged as a separate finding", and deliberately asserted around it → in scope;
      that test is now the AC-6 assertion and the comment is gone.
- [x] Found: preferring server messages changes 429 copy on two existing tests, because the backend
      sends its own rate-limit sentence → in scope, both updated; consequence recorded in `D-01`.
- [ ] Found: the backend puts a full `stack` in its error bodies and the proxy forwards upstream
      error bodies verbatim, so backend stack traces reach the browser on every error path this
      change does not touch → **out of scope**, filed as
      `docs/internal/todos/2026-09-20-todo-upstream-error-bodies-reach-the-browser.md`.

## Acceptance

Method as well as artifact.

- [x] AC-1 — interaction · `handleApiError.test.ts`; **proven failing first** against unchanged
      `dev`, which returned "Your session expired. Please log in again."
- [x] AC-2 — interaction · `handleApiError.test.ts`. This one passes both before and after, because
      before the change every 401 produced the session copy anyway. **Proven to discriminate** by
      disabling the `serverCode` step: it then returns "Unauthorized", which is exactly the
      regression the naive fix would have shipped.
- [x] AC-3 — interaction · `handleApiError.test.ts`, asserting a 5xx body containing a connection
      string never reaches the user.
- [x] AC-4 — interaction · `handleApiError.test.ts`, covering the Axios-boilerplate fallback.
- [x] AC-5 — interaction · `route.test.ts`, both the no-cookie and cleared-session paths, including
      that the no-cookie path never calls `fetch`.
- [x] AC-6 — interaction · `LoginForm.int.test.tsx`; **proven failing first**.

## Gates

- [x] lint
- [x] css lint — **not triggered**, no CSS changed; run and reported anyway
- [x] typecheck
- [x] format
- [x] unit tests — 80 suites / 669 tests, up from 79 / 655
- [x] integration — triggered, data access changed; 19 suites / 96 tests
- [x] spec drift — **not triggered**, no backend contract or `src/types/dtos/**` in play; run anyway
- [x] build
- [ ] e2e — **skipped, not run**; **not triggered**
