# 2026-10-02 - Todo: sync the contract for the register rate limit

**Context:** found while gating `chore/dependency-audit-split` (#64). Backend #127 (abb5831,
2026-10-01 17:50 UTC, "rate-limit registration per client IP", backend ADR-0053) added a `429`
response to `POST /auth/register`, using the existing `RateLimitError` schema. It merged after
#62's green `dev` run, so `api:spec:check` fails on `dev` and every PR until synced. Unlike #63,
Security Scan is green, so this sync can go in its own PR.

What the frontend does with a 429 on register today (read, not yet tested):

- `registerUser` (`src/services/api/auth.api.ts:38`) sends no `Idempotency-Key`, so the retry
  policy in `src/services/api/api.ts` does not retry it. That is correct here: a retry would
  spend the per-IP hourly allowance.
- `src/services/api/handleApiError.ts:31` maps 429 to "Too many attempts. Try again in a moment."

## Checklist

- [x] `npm run api:spec:sync` and `npm run api:types:generate`, in their own commit
- [x] Confirm the register form shows the 429 message: an integration test with an MSW `429`
      `RateLimitError` response, broken on purpose first
- [x] Gates, with `api:spec:check` and `security:audit` re-run right before handover
- [ ] After it merges, update `chore/dependency-audit-split` with `dev` so its API Contract
      Drift re-runs

## Status

Done 2026-10-02 on `chore/sync-register-rate-limit`, apart from updating #64.

- Sync: `/auth/register` gains a `429` returning `RateLimitError`; nothing else changed
  (33 paths). The generated types gain the matching response.
- A register 429 test already existed, with a generic message. It now uses the body backend #127
  really sends, status 429 with "Too many registration attempts, please try again later.", which
  the form shows as is, since a server message beats the status fallback. It
  also asserts the request goes out exactly once. Broken on purpose by adding an
  `Idempotency-Key` to `registerUser`: it failed with "Expected: 1, Received: 4". Its alert wait is
  4 s, so a retrying regression fails on that count rather than on a missing alert.
- Docs: `.claude/rules/data-access.md` (the register limit and why register is never retried),
  `docs/how-to/testing/run-stack-e2e.md` (repeated stack runs hit the register limit),
  `CLAUDE.md` (last synced).

Review found that the per-IP limit may not see real client IPs through the proxy: filed as
`docs/internal/todos/2026-10-02-todo-proxy-client-ip-forwarding.md`.

This file was written on `chore/dependency-audit-split` too. When #64 takes `dev`, keep `dev`'s
copy of it.
