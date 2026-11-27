---
name: confirm-email-change-public-path-review
description: Review of branch chore/234-sync-api-spec-backend-354 (spec sync plus ADR-0053 adding a public proxy path); approve with warnings
metadata:
  type: project
---

Verdict: approve with warnings, branch chore/234-sync-api-spec-backend-354 (issue #234).

**How to apply:** When a change moves a number or a list that a rules file states ("the eight entry points"), grep the whole of `.claude/` and `docs/` for the old word-number ("seven", "7") and not just the file the diff already touches. Rule files often repeat a fact in two places (`security.md` and `data-access.md` here), and the author fixes the one they remember. For an ADR that rejects options, check each rejected option against the code's actual mechanism: two "alternatives" can be the same code change under different names, and a claim of "not possible with the lists as they are" is worth testing against the default path through `isPublicApiPath`. For a proxy allowlist change, the contract-walk test already covers token-issuing and secured-method-on-same-path; the residual questions are signed-in callers (proxy attaches the Bearer anyway) and what the backend does to existing sessions.
