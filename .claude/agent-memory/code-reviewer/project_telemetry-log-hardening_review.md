---
name: telemetry-log-hardening-review
description: Verdict and heuristic from reviewing branch fix/telemetry-log-hardening (logger-wide scrubText, capped intake, fixed-window budgets on three unauthenticated routes)
metadata:
  type: project
---

Approve with warnings. PR #75 (branch fix/telemetry-log-hardening, ADR-0027); the warnings were fixed before the merge.

**How to apply:** When a change moves a regex or other per-string work into a hot, shared path (a logger, a sink), do not stop at the routes the change targets. Enumerate every call site of the shared function and ask which of them take attacker-length input without the new bound; measure the regex on a worst-case string rather than reasoning about it. When a change adds a budget, check whether the budget's clock can go backwards (a wall clock can; use a monotonic one), and that its scope (per process, per route, shared by all users) is named where a reader will find it. A "bounded body" claim also needs the framework's own buffering ruled out (here the proxy matcher excluding `/api` does that), so read the matcher before accepting it.
