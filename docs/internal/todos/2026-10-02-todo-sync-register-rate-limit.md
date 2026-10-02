# 2026-10-02 - Todo: sync the contract for the register rate limit

**Context:** found while gating `chore/dependency-audit-split`. Backend #127 (abb5831,
2026-10-01 17:50 UTC, "rate-limit registration per client IP") added a `429` response to
`POST /auth/register`, using the existing `RateLimitError` schema. It merged after #62's green
`dev` run, so `api:spec:check` fails on `dev` and every PR until synced. Unlike #63, Security
Scan is green, so this sync can go in its own PR.

What the frontend does with a 429 on register today (read, not yet tested):

- `registerUser` (`src/services/api/auth.api.ts:38`) sends no `Idempotency-Key`, so the retry
  policy in `src/services/api/api.ts` does not retry it. That is correct here: a retry would
  spend the per-IP hourly allowance.
- `src/services/api/handleApiError.ts:31` maps 429 to "Too many attempts. Try again in a moment."

## Checklist

- [ ] `npm run api:spec:sync` and `npm run api:types:generate`, in their own commit
- [ ] Confirm the register form shows the 429 message: an integration test with an MSW `429`
      `RateLimitError` response, broken on purpose first
- [ ] Gates, with `api:spec:check` and `security:audit` re-run right before handover
- [ ] After it merges, update `chore/dependency-audit-split` with `dev` so its API Contract
      Drift re-runs

## Status
