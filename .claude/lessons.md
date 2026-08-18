# Claude Lessons — Lakira Frontend

Persistent record of corrections and patterns learned on this project.
Updated after any correction per `.claude/rules/workflow.md`.

<!-- Entries added below as lessons are learned. Format:
## [YYYY-MM-DD] <short title>
**Mistake**: what went wrong
**Rule**: the pattern to follow instead
**Why**: reason / context
-->

## [2026-08-17] The components layer boundary was never enforced

**Mistake**: `CLAUDE.md` documented `components → lib, utils, types, generics` as lint-enforced, and that claim went unchecked for months. `eslint.config.mjs` declares the rule under `boundaries/element-types` but never maps `src/components/**` in `settings["boundaries/elements"]`, so the rule matched nothing.

**Rule**: when a doc claims a rule is mechanically enforced, verify the mechanism before trusting it. For `eslint-plugin-boundaries` specifically, a `from: <type>` rule is inert unless `<type>` appears in `boundaries/elements`.

**Why**: an unenforced rule that is documented as enforced is worse than no rule — it stops anyone from checking by hand. Turning it on surfaced 126 violations: 108 were the *declared table* being wrong (`app` and `features` legitimately consume `components`), and 18 were genuine inversions in six files. Both had been invisible for months.

## [2026-08-17] The OpenAPI snapshot drifted 12 paths behind the backend

**Mistake**: `documents/openapi/lakira-backend-openapi.json` was a manual copy with no drift gate. It sat at 18 paths while the backend shipped 30 — the entire multi-tenancy surface (`/organizations/*`, `/invites/accept`, `/memberships/{id}`) and most of the auth lifecycle (`/auth/refresh`, `/auth/verify-email`, `/auth/reset-password`, `/auth/switch-org`) were invisible to the frontend.

**Rule**: a copied artifact needs a check that fails in CI, not a convention that says to update it. Run `npm run api:spec:check` before trusting anything in `src/types/dtos/**`.

**Why**: manual sync always drifts; the only question is how long before someone notices.
