---
name: server-set-session-cookie-review
description: Narrow security review of fix/server-set-session-cookie (proxy strips the access token and sets the session cookie); no critical findings, gaps were test coverage and stale docs
metadata:
  type: project
---

Verdict: approve with warnings. PR #73 (branch fix/server-set-session-cookie, ADR-0025).

**How to apply:** When a change moves a secret from "browser relays it" to "server swallows it", check the strip against the backend's real response shape (read the controller, not just the OpenAPI schema) before judging whether a strip-one-key filter is enough. Then look for tests that combine two cookie writers on one response (refresh retry plus a freshly issued token); last-writer-wins ordering comments are usually asserted by no test, because each writer is tested alone. When a client module or route is deleted, grep `.claude/rules/` and `docs/reference/` as well as `src/`: rule files describing the old flow go stale first, and they are what the next session reads as truth.
