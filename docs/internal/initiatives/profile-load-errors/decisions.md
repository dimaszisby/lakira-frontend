# Profile load errors — Decisions Log

`D-NN` entries scoped to this kit. `F-NN` is a row of
[`frontend-debt-register/register.md`](../frontend-debt-register/register.md).

---

## D-01 — The profile fetch throws on failure instead of returning `null`

- **Status:** Accepted
- **Date:** 2026-10-16

**Context.** F-27: `fetchUserProfile` (`src/services/api/auth.api.ts`) caught every error, logged
it outside production only, and returned `null`. Its doc comment and
`.claude/rules/data-access.md` called that deliberate: callers "treat 'no profile' and 'could not
load it' alike", and an unauthenticated read was routine. Read on `dev` at `8596d43`, neither
reason holds any more.

- The only caller is the account page, through `useAuthProfileQuery`. It already renders
  `isError` and `error` through `handleApiError`, so the swallowed error was the only thing
  keeping that branch from running.
- An unauthenticated read no longer reaches this function. `src/proxy.ts` gates `/account`, and
  the proxy clears the session on a 401 that refresh cannot rescue.
- `userAtom` is set only on success, and no component reads it.

So a 401, a 403, a 404 and an outage all showed "We were unable to load your profile
information." with no reason.

**Decision.** `fetchUserProfile` takes the shape of `loginUser` and `registerUser` beside it:
`withApiErrorHandling(() => api.get(...).then(unwrap), "fetchUserProfile")`. It returns the user
or rethrows the original Axios error, so the one `handleApiError` call at the page reads the
status. `useAuthProfileQuery` gains the retry rule the metrics list queries use: no retry on a 4xx
other than 429, at most two otherwise.

**Options considered.**

- Keep `null` and read the status some other way, for example a second field. Rejected: it
  rebuilds by hand what a query error already carries, for one caller.
- Throw without a retry rule. Rejected: TanStack retries three times with backoff by default, so
  a 401 or 403 would show "Loading your account..." for several seconds, where it was immediate
  before.

**Consequences.**

- A failed profile now goes through `withApiErrorHandling`, like every other API failure. That
  logs outside production only and reports nowhere: `handleApiError` calls telemetry only when a
  caller passes one. Production still records nothing of a failed profile load; the user now sees
  why, which is what F-27 asked.
- A future caller that wants "no profile" on failure must handle the query's error itself. The
  rule in `.claude/rules/data-access.md` now says so.
