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

- [ ] Run `npm audit fix --force` on a dedicated branch off `dev`.
- [ ] Diff `cypress.config.ts`, `cypress/support/**` against the Cypress 15 migration guide for breaking changes.
- [ ] Run `npm run test:e2e` locally against a built app.
- [ ] Confirm `Security Scan` job goes green in CI.
- [ ] Confirm `E2E tests` job still passes in CI.

## Status

Not started.
