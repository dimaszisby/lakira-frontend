# Proxy error-body allowlist — Decisions

## D-01 — An error body reaches the browser only as the keys the frontend reads

> **Promoted to [ADR-0034](../../../explanation/decisions/adr-0034-the-proxy-forwards-only-the-error-keys-the-frontend-reads.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-21

**Context.** Register row F-20. The proxy forwarded every backend body unchanged, so whatever an
error envelope held reached the browser. That includes `stack`, which the backend sets only in
development, and any key it might add later. The investigation that filed this,
`2026-09-20-todo-proxy-forwards-upstream-error-bodies.md`, found no production leak. The concern
is a dependency on an upstream `NODE_ENV` check the frontend cannot enforce or test.

**Decision.** The owner chose this on 2026-10-21 (question O-06).

- **What is kept:** on a status of 400 or above, the body is rebuilt from the keys
  `normalizeApiError` reads, as strings:
  - `status`, `message`, `error` and `code`;
  - `errors`, as strings or `{ field?, message }`;
  - `issues`, as `{ message }`.

  Everything else is dropped.

- **What is dropped whole:** a body that is not a JSON object, or is over 64 KiB, is replaced
  with an empty body and logged as `proxy.error_body_dropped`, without its content.
- **Where:**
  - the filter is `src/lib/proxy-error-body.ts`;
  - the capped read is `src/lib/read-capped.ts`, moved out of `src/lib/telemetry-intake.ts`
    unchanged.

**Options considered.**

- _Strip `stack` only:_ fails open on the next new key, the omission the proxy's path rule stopped
  making.
- _Keep it verbatim and record why:_ the owner chose against it.
- _Build the body with `normalizeApiError`:_ it is in `services`, it produces the UI's shape
  rather than the wire's, and the layer rule keeps `lib` from importing it. A test compares the
  filter with it instead.

**Consequences.**

- **A new key the UI should read is added in two places:** the filter and `normalizeApiError`.
  The filter's test fails if it drops what `normalizeApiError` reads.
- **Error bodies are buffered up to 64 KiB.** Success bodies still stream.
- **The 401 that ends a session is decided before the body is read,** so its body is never read;
  that response is the proxy's own, as before (kit `api-error-messages`, D-03).
