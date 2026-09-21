# Backend stack traces reach the browser through the proxy

**Purpose:** the proxy forwards upstream error bodies verbatim, and the backend puts a full `stack`
in them.
**Owner:** hardini
**Branch:** unassigned
**Found:** 2026-09-20, while investigating the 401 message mapping under `feat/api-error-messages`.

## What was observed

Against the local backend on `:8001`:

```
POST /api/v1/auth/login   (wrong password)
401 {"status":"fail","message":"Invalid email or password",
     "stack":"Error: Invalid email or password\n    at new AppError (/app/src/utils/AppError.ts:19:11)\n
              at LoginUser.execute (/app/src/features/shared/auth/application/use-cases/LoginUser.ts:34:22)…"}
```

```
GET /api/v1/metrics   (no auth header)
401 {"status":"fail","message":"Unauthorized: No token provided",
     "stack":"… at /app/src/features/shared/auth/infrastructure/http/authMiddleware.ts:45:19 …"}
```

`src/app/api/proxy/[...path]/route.ts` builds its response from `response.body` and forwards it
unchanged. It strips `Set-Cookie` and three transport headers; it does not touch the body. So the
absolute container paths, the internal module layout and the call stack are all readable by anyone
who opens the network tab.

## What is and is not already handled

`feat/api-error-messages` (2026-09-20) closed **one** path: a 401 the proxy has decided is a dead
session now returns the proxy's own `{ error: "Session expired", code: "SESSION_EXPIRED" }`. That
was a side effect of fixing the message copy, not a security fix, and it covers one branch.

Every other error status still forwards verbatim. `handleApiError` refusing to _display_ 5xx server
text does not help here — the body is already in the browser regardless of what the UI renders.

## Open questions

- [ ] Is `stack` gated on `NODE_ENV` in `lakira-backend`? Unconfirmed. If it is, the exposure is
      dev-only and this is low priority. If it is not, it ships to production.
- [ ] Should the proxy strip unknown keys from error bodies generally, keeping `message`, `errors`,
      `error`, `issues` and `code` — the five `normalizeApiError` actually reads? That would make
      the frontend robust regardless of what the backend does.

## Why it is filed rather than fixed

It spans both repos and the right fix depends on the first question. Stripping in the proxy is
defence in depth and probably worth doing either way, but it is a security change to a shared
request path and deserves its own review rather than riding along with a copy fix.

See `docs/internal/initiatives/api-error-messages/decisions.md` § D-03.
