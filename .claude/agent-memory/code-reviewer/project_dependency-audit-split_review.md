---
name: dependency-audit-split-review
description: Review of chore/dependency-audit-split (prod-only PR audit, nightly full audit, no-extraneous-dependencies lint); approve with ADR/workflow suggestions
metadata:
  type: project
---

Verdict: APPROVE, one warning and four suggestions, all applied. PR #64 (`chore/dependency-audit-split`, kit `docs/internal/initiatives/dependency-audit-split/`).

How to apply: when a PR narrows what a security gate covers, check the ADR names what the narrowed-out set can still do (build-time execution, notification lag), not just what it ships. For scheduled workflows, check default branch, cancel-in-progress, and inactivity auto-disable. Stdin-based eslint with type-aware parser gives false results; do not use it to verify rules.
