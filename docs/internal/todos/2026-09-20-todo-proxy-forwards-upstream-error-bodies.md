# The proxy forwards upstream error bodies verbatim

**Purpose:** decide whether `/api/proxy/[...path]` should filter error bodies to the keys the
frontend actually reads, as defence in depth.
**Owner:** hardini
**Branch:** unassigned
**Found:** 2026-09-20 while investigating the 401 message mapping under `feat/api-error-messages`.
**Priority:** low. This is hardening, not a live exposure — see "Not a production leak" below.

## What the proxy does

`src/app/api/proxy/[...path]/route.ts` builds its response from `response.body` and forwards it
unchanged. It strips `Set-Cookie` and three transport headers; it never inspects the body. So
whatever shape the backend puts in an error envelope reaches the browser exactly as sent.

`feat/api-error-messages` closed one branch of this — a 401 the proxy has decided is a dead session
now returns the proxy's own `{ error: "Session expired", code: "SESSION_EXPIRED" }`. That was a side
effect of fixing message copy, not a security change, and it covers one path.

## Not a production leak

**This was originally filed as "backend stack traces reach the browser" and called the most serious
finding of that investigation. That was wrong, and the correction matters more than the ticket.**

The claim rested on a local response containing a full `stack`:

```
401 {"status":"fail","message":"Invalid email or password",
     "stack":"Error: … at LoginUser.execute (/app/src/features/shared/auth/…/LoginUser.ts:34:22)…"}
```

Checked against the backend source on 2026-09-21, that is gated:

```ts
// lakira-backend/src/shared/middleware/error.ts
stack: env.NODE_ENV === "development" ? appError.stack : undefined,
```

`sendError` passes the options straight to `res.json()`, which omits `undefined`, so the key is
absent outside development. The same handler masks 5xx messages in production behind
`MASKED_SERVER_ERROR_MESSAGE`. The alarming local response was the development path working as
designed.

Lesson for the next investigation: a response observed against a local dev container says nothing
about production until the gate is read. Running the request is good evidence; it is not evidence of
what ships.

## The question that remains

Should the proxy filter error bodies to the five keys `normalizeApiError` actually reads —
`message`, `errors`, `error`, `issues`, `code` — and drop everything else?

Arguments for: the frontend stops depending on an upstream `NODE_ENV` check it cannot enforce or
test, and a future backend field is inert here by default rather than by omission. It is the same
shape of reasoning as the proxy's deny-by-default path handling, which exists because the inverse
was a denylist by omission.

Arguments against: it is a change to a shared request path for no observed defect, and a filter that
silently drops a field the frontend later needs is its own failure mode.

- [ ] Decide. If yes, it needs its own branch and review — not a ride-along.
- [ ] If yes, cover it in `src/app/api/proxy/[...path]/__tests__/route.test.ts` alongside the
      existing header-stripping assertions.

See `docs/internal/initiatives/api-error-messages/decisions.md` § D-03.
