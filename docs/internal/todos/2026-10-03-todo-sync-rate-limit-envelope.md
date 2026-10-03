# 2026-10-03 - Todo: sync the contract for the rate-limit error envelope

**Context:** found while gating `docs/braces-dev-advisory`. Backend #131 (582c1b5, 2026-10-03
15:02 UTC, "answer rate limits with the error envelope") changed the body of every 429 from
`{"status": 429, "message": "..."}` to `{"status": "fail", "message": "..."}`. The HTTP status,
the message text and the `RateLimit-*` headers are unchanged. It merged after #64's green `dev`
run, so `api:spec:check` fails on `dev` and every PR until synced. Security Scan is green, so the
sync goes in its own PR, as #65 did.

What the frontend does with that field (read on 2026-10-03):

- Nothing reads the body's `status` on an error. `normalizeApiError` takes the HTTP status from the
  response and the text from `message`, so a 429 displays the same before and after.
- No hand-written DTO or runtime file references `RateLimitError`; only the generated types do.
- Two integration tests sent the old body: `RegisterForm.int.test.tsx` and
  `LoginForm.int.test.tsx`.

## Checklist

- [x] `npm run api:spec:sync` and `npm run api:types:generate`, in their own commit
- [x] Both 429 fixtures send the envelope body the backend now sends
- [x] `CLAUDE.md`: last synced date
- [x] Gates, with `api:spec:check` and `security:audit` re-run right before handover
- [ ] After it merges, hand over `docs/braces-dev-advisory`

## Status

Done 2026-10-03 on `chore/sync-rate-limit-envelope`, apart from handing over the docs branch.

- Sync: `status` in the `RateLimitError` schema and the `TooManyRequestsError` response is a
  string with example `fail`, where it was a number with example 429. Nothing else changed
  (33 paths). The generated types gain the matching two changes; typecheck passes with no edits.
- Tests: the register and login 429 fixtures now send the envelope body. Both passed unchanged
  before the edit and pass after it, because no code reads that field. They are fixtures kept
  true to the backend, not regression tests for this change.
- Docs: `CLAUDE.md` (last synced).
