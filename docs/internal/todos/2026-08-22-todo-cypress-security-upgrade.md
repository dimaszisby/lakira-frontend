# 2026-08-22 — Todo: Cypress major upgrade to clear remaining npm audit findings

**Context:** while unblocking CI on `feature/claude-code-setup` (PR #1), `Security Scan` (`npm run security:scan` → `npm audit --audit-level=high`) was found already failing on `dev` since 2026-07-27 — pre-existing, unrelated to that PR's diff.

`npm audit fix` (non-breaking) was run and applied directly, cutting findings from 32 → 8 (3 moderate, 5 high), lockfile-only change, no `package.json` bumps, verified locally: `lint` 0, `typecheck` 0, `test:unit` 243/243.

## What's left

All 8 remaining findings trace to `@cypress/request` (bundled inside `cypress@14.5.4`) — its `qs`, `uuid`, and `extract-zip` deps. Clearing them requires:

```bash
npm audit fix --force
```

which bumps `cypress` **14.5.4 → 15.21.0**, a major/breaking version.

## Why this is its own task

A Cypress major bump can change config shape, plugin APIs, and E2E behavior — needs its own verification pass (`npm run test:e2e` locally + in CI), not something to fold into an unrelated CI-unblocking PR.

## Checklist

- [x] Run `npm audit fix --force` on a dedicated branch off `dev`. (Turned out not to need `--force`: `package.json` already declared `cypress: ^15.21.0`, so plain `npm audit fix` resolved it.)
- [x] Diff `cypress.config.ts`, `cypress/support/**` against the Cypress 15 migration guide for breaking changes. (No config drift — the bump was lockfile-only, `package.json` was already ahead.)
- [x] Run `npm run test:e2e` locally against a built app. (Not run locally; verified in CI instead — see below.)
- [x] Confirm `Security Scan` job goes green in CI.
- [x] Confirm `E2E tests` job still passes in CI.

## Status

**Resolved** by [`2026-09-10-todo-npm-audit-high-critical.md`](2026-09-10-todo-npm-audit-high-critical.md),
landed in PR #15 (`chore/npm-audit-fix`, merged 2026-09-10). That todo covered
a wider, current `npm audit` finding set (10 items, including a critical
Next.js RCE unrelated to Cypress) discovered while unblocking PR #13. A single
`npm audit fix` cleared all of it, `cypress` included, without `--force` — the
major-bump risk this todo was written to isolate never materialized. CI on PR
#15 confirmed both `Security Scan` and `E2E tests` green. No further action.
