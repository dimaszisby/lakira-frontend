# ADR-0034 — The proxy forwards only the error keys the frontend reads

- **Status:** Accepted
- **Date:** 2026-10-21
- **Origin:** kit `proxy-error-body-allowlist`, D-01 — [`decisions.md`](../../internal/initiatives/proxy-error-body-allowlist/decisions.md); debt register row F-20, owner question O-06

---

## Context

`src/app/api/proxy/[...path]/route.ts` forwarded every backend response body to the browser
unchanged. Nothing leaked as a result. lakira-backend's error handler
(`src/shared/middleware/error.ts`) sets `stack` only when `NODE_ENV` is `development`, and it masks
5xx messages outside development and test. `handleApiError` never shows a 5xx's text either.

Two things were still wrong:

- The frontend's safety rested on an upstream check it can neither enforce nor test.
- Any key the backend added to an error body reached the browser by default.

The second is the same failure the proxy's path rule was changed to prevent: an allowlist of
protected paths was a denylist by omission (`.claude/rules/security.md` § The proxy denies by
default).

The backend writes one error envelope, `{ status, message, errors?: [{ field, message }], stack? }`
(`src/shared/utils/error-envelope.ts`). The frontend reads error bodies in one place,
`normalizeApiError` (`src/services/api/normalizeApiError.ts`). It reads:

- `message`, `error` and `code`;
- `errors[]`, as strings or as `{ message }`;
- `issues[].message`.

## Decision

The owner chose an allowlist on 2026-10-21.

For a response with a status of **400 or above**, the proxy reads the body and rebuilds it with
`filterErrorBody` (`src/lib/proxy-error-body.ts`):

- **Kept, strings only:**
  - `status`, `message`, `error` and `code`;
  - `errors`: each item a string, or `{ field?, message }`; an item with no string message is
    dropped;
  - `issues`: each item reduced to `{ message }`.

  Everything else is dropped, `stack` included. A body with nothing to keep becomes `{}`.

- **A body that is not a JSON object, or is over 64 KiB, is replaced with an empty body**, and its
  `content-type` goes with it. Examples are a gateway's HTML, plain text, and an array. The UI then
  shows its status copy.
  - **What is logged:** one `proxy.error_body_dropped` line at `info`, with the path, the status
    and a reason of `not_json` or `too_large`.
  - **What is not logged:** the body, ever. An empty body is not logged.
  - **How it is read:** with `readCapped` (`src/lib/read-capped.ts`), shared with the telemetry
    intake, so an oversized body is not buffered.
- **Untouched:**
  - bodies of a status below 400;
  - the proxy's own bodies, `SESSION_EXPIRED` and its 502s;
  - every header, `x-request-id` included.

## Options considered

- **Strip `stack` only.** Rejected: it fails open on the next key the backend adds, which is
  exactly the omission the path rule stopped making.
- **Keep the body verbatim and record the decision.** Rejected by the owner. It leaves the
  frontend relying on the backend's `NODE_ENV` check.
- **Reuse `normalizeApiError` to build the body.** Rejected: it sits in `services` and the proxy in
  `app` and `lib`, and its output is the UI's shape, not the wire's. A test compares the two
  instead.

## Consequences

- **A new error key the UI should read needs two edits:** one in `src/lib/proxy-error-body.ts`,
  the other in `normalizeApiError`.
  `src/lib/__tests__/proxy-error-body.test.ts` fails if the filter drops something
  `normalizeApiError` reads, for each envelope shape it knows.
- **Error bodies are now buffered,** up to 64 KiB, where they used to stream. Success bodies still
  stream.
- **A gateway's HTML error page no longer reaches the browser.** The user sees the same status copy
  as before, because `normalizeApiError` already ignored a non-JSON body.
- **Revisit** if the frontend ever needs an error body it does not render, for example to forward
  it for telemetry. That needs a key here, not a bypass.
