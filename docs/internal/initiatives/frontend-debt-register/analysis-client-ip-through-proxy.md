# F-03 — The browser's IP is not forwarded through `/api/proxy`

Register row [F-03](register.md). Read at `f67716e`. The backend's half is its row B-05, analysed
in lakira-backend
`docs/internal/initiatives/backend-debt-register/analysis-client-ip-and-trust-proxy.md`; this file
covers the frontend's half and does not restate that one.

## 1. What is wrong

Every browser call reaches the backend through `src/app/api/proxy/[...path]/route.ts`. The proxy
copies the incoming headers except three (`route.ts:23`, `route.ts:103-107`) and sets no
`X-Forwarded-For` of its own. Two consequences, both read from the code:

- The backend limits by `req.ip`. With nothing in front of the app that sets the header, the
  backend sees the app server's address for every user, so all proxied users share one budget.
- An `X-Forwarded-For` that the browser itself sends is forwarded unchanged. Whether the backend
  believes it depends on its hop count, which is the backend's half.

The backend raised it on the Notion page (Part 2, "Needs decision", 2026-10-02) and re-checked it
on 2026-10-13.

## 2. Root cause

The proxy was written to forward a request, not to describe the caller. Each service assumes the
other handles the client's address.

## 3. Options

The backend's analysis lists four; the frontend's part differs in each.

1. **The proxy overwrites `X-Forwarded-For`** with the address its own host reports, dropping
   whatever the browser sent. One block in `route.ts`. Correct only if the host in front of the
   app reports the client's address to the route handler, which depends on the host.
2. **A dedicated header with a shared secret.** The proxy sends the address in its own header and
   proves itself with a secret. One more secret to configure here and rotate in both places.
3. **Accept the shared budget.** No code. The backend's analysis rejects it for registration.
4. **Key the limiters on something else.** Backend only; nothing changes here.

Whichever is chosen, the proxy should stop forwarding a browser-sent `X-Forwarded-For`,
`X-Real-IP` and `Forwarded` as they arrive. That part is safe on any host.

## 4. Recommendation

**Option 1**, which is also the backend's recommendation, once O-01 is answered. The address has
to come from the host, and no host is chosen, so the block cannot be written correctly today.

The part that does not wait: add `x-forwarded-for`, `x-real-ip` and `forwarded` to the proxy's
blocklist when the header code is next opened, so a browser cannot supply them. That alone does
not fix the shared budget; it removes the spoofing route.

## 5. Acceptance criteria for the fix

- **AC-1** — A request through the proxy reaches the backend with an `X-Forwarded-For` whose
  client entry is the browser's address as the host reports it. _Why:_ the Notion record's own
  verification, two browsers with separate `RateLimit-Remaining` counts.
- **AC-2** — A browser that sends its own `X-Forwarded-For`, `X-Real-IP` or `Forwarded` does not
  change what the backend receives. _Why:_ otherwise the fix is a bypass.
- **AC-3** — `route.test.ts` covers both, beside its existing header-stripping cases.
  _Why:_ the header code has unit tests today and this changes it.
- **AC-4** — The stack suite still passes. _Why:_ every signed-in journey goes through this code.

## 6. Size and shape

≤½ day for the frontend's half. A small sweep at least, and **an ADR is owed**, shared with the
backend's decision: how a client is identified is a security boundary in both repositories. The
plan needs the conditional "Security and data" section. Gates: the always-on gates, integration,
`e2e (stack)`.

## 7. Depends on, unblocks

Depends on O-01 (the backend's O-04), and so on F-01. F-14's optional part touches the same
blocklist and can share the change ([D-02](decisions.md)). Unblocks the backend's B-05.

## 8. Not verified

- What address a route handler can read on any host. Nothing in `src/` reads one today.
- The backend's `req.ip` for a call through the proxy. The todo
  `2026-10-02-todo-proxy-client-ip-forwarding.md` lists that measurement and it was not run.
- That todo's first item, raising this on the Notion page, reads as open; the record has been
  there since 2026-10-02. Its line numbers for the proxy are also stale. Both are row F-19.
- No reproduction was run for this kit.
