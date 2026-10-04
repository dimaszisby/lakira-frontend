---
name: sentry-error-monitoring-review
description: Scoped review of feat/sentry-error-monitoring (server-only Sentry sink); verdict and the heuristic it yields for log-sink forwarding changes
metadata:
  type: project
---

Verdict: REQUEST CHANGES, branch feat/sentry-error-monitoring (narrowed review: data egress, client-error abuse, proxy try scope, duplicate events).

**How to apply:** When a log sink starts forwarding every `error`-level entry to a vendor, the safety of the forward depends on three things that key-name redaction does not give: free-text fields (`message`, `stack`) whose content is caller- or attacker-controlled, any rate cap being per process (so it multiplies with instance count), and the set of existing `logger.error` call sites. Enumerate those call sites first. When a `try` is widened to catch a network failure, check whether work done inside it has side effects that the new early return discards (rotated refresh tokens are the case here). Also confirm SDK option defaults in node_modules rather than trusting a comment: here OTel setup was already off by default.
