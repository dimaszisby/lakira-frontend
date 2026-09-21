# API error messages — decisions

## D-01 — Friendly copy becomes a fallback, except where it must not be

- **Status:** Accepted
- **Date:** 2026-09-20

**Context.** `handleApiError` computed the sanitized server messages and then discarded them
whenever a status-keyed sentence existed. Every 401 therefore rendered "Your session expired. Please
log in again." Verified against the running backend: a wrong password returns
`{"message":"Invalid email or password"}` with 401, and the user was told to log in on the login
page they were already on. Five auth forms share this path.

**Decision.** Invert the precedence, with two carve-outs:

1. a `serverCode` the server chose wins outright;
2. 5xx and "no response at all" keep the override;
3. otherwise a real server message wins;
4. status-keyed copy is the fallback when the server said nothing;
5. sanitized messages last.

**Options considered.**

- _Prefer the server message unconditionally._ The obvious fix, and wrong. The proxy answers a
  session failure with `{"error":"Unauthorized"}` and the backend with
  `"Unauthorized: Invalid token"` — both jargon, both worse than the generic sentence. It trades one
  bad message for two.
- _Detect Axios boilerplate by matching "Request failed with status code"._ Fragile, locale- and
  version-dependent, and it would silently start passing boilerplate through the day Axios reworded
  it.
- _Special-case the login endpoint._ Would fix the reported symptom and leave the same defect on
  register, password reset, forgot-password and email verification.

**Consequences.**

- **Backend wording now surfaces where our copy used to.** 403, 404 and 429 responses that carry a
  message will show the backend's sentence, not ours. Two existing tests asserted our 429 copy and
  were updated: `LoginForm.int.test.tsx` and `RegisterForm.int.test.tsx` now expect "Too many
  requests, please try again later." This is the intended behaviour, not a regression — but it does
  mean backend copy is now user-facing copy, and nobody is reviewing it as such.
- `NormalizedApiError` gains two fields. Additive, so no call site breaks.

## D-02 — `hasServerMessage` rather than inspecting the message text

- **Status:** Accepted
- **Date:** 2026-09-20

**Context.** `normalizeApiError` falls back to Axios's `e.message` when the envelope carries nothing,
so `messages` is **never empty** for an Axios error. Emptiness cannot answer "did the server actually
say something?", and that is precisely what the new precedence needs to know.

**Decision.** `normalizeApiError` records `hasServerMessage: boolean`, set from whether
`extractMessages(data)` returned non-null. The distinction is only available at normalization time
and is unrecoverable afterwards.

**Options considered.**

- _Return `messages: []` when the envelope is empty._ Cleaner in principle, but it changes an
  existing contract that callers already depend on, and `withApiErrorHandling` would start throwing
  errors with no message.
- _Pattern-match the boilerplate downstream._ See D-01.

**Consequences.** One extra boolean on a type that several modules read. `serverCode` is kept
separate from the existing Axios `code` for the same reason — merging them would make `ERR_CANCELED`
and `SESSION_EXPIRED` indistinguishable.

## D-03 — The proxy answers session failures in its own words

- **Status:** Accepted
- **Date:** 2026-09-20

**Context.** The proxy issues a 401 for a missing cookie, and separately detects a 401 that token
refresh could not rescue — at which point it clears both cookies and then forwarded the upstream body
anyway. In both cases it knows something the backend does not: the session is over.

**Decision.** Both sites return `{ error: "Session expired", code: "SESSION_EXPIRED" }`. The
cleared-session path stops forwarding the upstream response entirely.

**Options considered.**

- _Leave the body, add only a header._ A header survives less well through the axios/normalize chain
  and would need its own extraction path; the envelope already has a `code` slot.
- _Have the UI infer it from the path._ Puts backend routing knowledge in a display function and
  breaks the moment a route moves.

**Consequences.**

- **Security, which is why this is written down.** A small sweep owes no plan and therefore has no
  _Security and data_ section; this entry is where that reasoning lives instead. The change is a net
  reduction in what the browser sees: the backend puts a full `stack` in its error bodies, and the
  proxy previously forwarded 401 bodies verbatim. This closes that on the cleared-session path.
  **It does not close it generally** — every other upstream error body is still forwarded as-is,
  stack included. Filed separately; it is the more serious finding and it is not this sweep's to fix.
- The 5xx override in `handleApiError` is load-bearing for the same reason: `sanitizeErrorMessage`
  truncates and strips control characters and angle brackets, but it does not redact.
- A caller that relied on reading the backend's 401 body through the proxy would now get the proxy's.
  Nothing does today.
