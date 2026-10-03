---
name: register-rate-limit-sync-review
description: Review of chore/sync-register-rate-limit (backend #127 429 on /auth/register); approve, one stale-comment nit and a jest-timeout margin note
metadata:
  type: project
---

Verdict: APPROVE, suggestions only. PR #65 (`chore/sync-register-rate-limit`).

**How to apply:** When a test claims a regression "fails on count not timeout", check the repo's default jest timeout against the wait (no testTimeout configured here = 5 s) and compute the retry backoff from axios-retry's exponentialDelay rather than trusting the comment. For contract-sync PRs, grep consumers by status code and by handler precedence, not just by DTO name.
