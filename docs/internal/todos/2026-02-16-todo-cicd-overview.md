# CI/CD TODO Overview — 2026-02-16

## Scope

- FE CI implementation.
- FE/BE handshake dependencies.
- Test program roll-up (Layers 1–5).

## Current Snapshot

This file no longer describes the pipeline; it links to where that is kept, and tracks only what
no other document does: the FE/BE handshake checkpoints below.

- The pipeline, job by job: `docs/reference/ci-pipeline/workflows.md`.
- The test layers and what each covers: `docs/explanation/testing-strategy.md`.
- Backend URLs per environment, and the staging backend, down since 2026-08-22:
  `docs/reference/environments.md`.

## CI Test Program Roll-up

The February roll-up, with per-layer readiness and gaps, is in git history at `d8aadc0`. Open work
is ranked in `docs/internal/initiatives/frontend-debt-register/register.md`.

| Layer           | testing-strategy § | In CI                                                                        | Open work                                  |
| --------------- | ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------ |
| 1 Static checks | 3.1                | `checks` job, every PR                                                       | none                                       |
| 2 Unit          | 3.2                | `unit` job, every PR, with coverage thresholds                               | F-41 (folder split, deferred)              |
| 3 Integration   | 3.3                | `integration` job, every PR                                                  | F-41 (folder split, deferred)              |
| 4 E2E           | 3.4                | `e2e` job, every PR: public and CSP specs; the signed-in specs do not run    | F-06                                       |
| 5 Performance   | 3.5                | `frontend-performance`, daily and on dispatch; not a PR gate                 | F-12 (field data), F-38 (signed-in routes) |
| Accessibility   | 4.1                | `jest-axe` in `unit` and `integration`; axe on public pages in the `e2e` job | F-06 (signed-in pages)                     |

## Priority Board

### P0 — Unblock Current Gates

- [x] Fix type/build blocker in `src/app/(app)/metrics/[metricId]/settings/edit/page.tsx:4` (resolved by wiring `useMetricDetail` context into `MetricSettingsFormDialog` props).
- [x] Fix Jest mock/module path blocker in `src/features/metric-categories/components/__tests__/MetricCategoryMobileCard.test.tsx:15` (removed stale mock for deleted `@/ui/OverlineLabel` module).
- [x] Fix Jest mock/module path blocker in `src/components/ui/__tests__/DataLabel.test.tsx:5` (removed stale mock for deleted `@/components/ui/OverlineLabel` module and aligned assertions to current component output).
- [x] Stabilize test typing consistency in test files so `npm run typecheck` is green with current include scope (isolated Cypress typing via `cypress/tsconfig.json`, excluded Cypress files from root `tsconfig.json`, and fixed strict typing in affected tests).
- [x] Rerun full local gate: `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run test:unit:ci`, `npm run build`, `npm run test:e2e` (passed on February 18, 2026; local `test:e2e` stabilized by unsetting `ELECTRON_RUN_AS_NODE` in script).

### P1 — Lay Out Planned Test Foundations

- [x] Layer 1: define/restore static-checks checklist artifact in `docs/internal/initiatives/tests-overhaul/1-static-checks/CHECKLIST.md`.
- [x] Layer 3: finalize `renderWithProviders` path/signature decision.
- [x] Layer 3: finalize MSW handler location decision.
- [x] Layer 3: finalize naming conventions and routing mock strategy.
- [x] Layer 3: implement helper/MSW scaffolding (`src/test-utils/renderWithProviders.tsx`, `src/test-utils/msw/server.ts`, `src/test-utils/msw/handlers.ts`).
- [x] Layer 4: finalize stable base URL decision.
- [x] Layer 4: finalize auth helper decision.
- [x] Layer 4: finalize data reset strategy decision.
- [x] Layer 4: finalize token-expiry simulation path decision.
- [x] Layer 4: implement Cypress auth/token helpers (`cypress/support/commands.ts`) and wire Cypress support file in config. That file was deleted on 2026-09-29 (`611bc17`); signing in is now in `cypress/support/stack.ts`.
- [x] Layer 5: define executable scripts/config for Lighthouse, Web Vitals collection, and bundle-size checks.

### P2 — Wire Additional CI Tracks

- [x] Keep current PR-gated chain: `checks`, `unit`, `integration`, `build`, `e2e` smoke, `security`, `secret-scan`.
- [x] Add integration tests as PR-required gate (implemented via `test:integration` with `jest.integration.config.ts` and active `.int.test.tsx` coverage).
- [x] Add performance/web-vitals tests as scheduled/nightly gate (`.github/workflows/performance.yml`).
- [x] Record the gating decision in CI/CD docs.

### P3 — Documentation Hygiene

- [x] Track typo/path cleanup for the `3-integration-tests` checklist naming consistency (canonical `CHECKLIST.md` added; the legacy `CHEKLIST.md` compatibility pointer was removed in the 2026-08-22 Diátaxis overhaul).
- [x] Keep overview lean and link out to detail docs (single-source principle from `docs/explanation/documentation-standards.md`). Done 2026-10-19 (register row F-42): the snapshot and the roll-up now link to `docs/reference/ci-pipeline/workflows.md` and `docs/explanation/testing-strategy.md` instead of restating them, and this file tracks only the handshake checkpoints.
- [x] Ensure each TODO item references a concrete doc/code/workflow path. Done 2026-10-19 (F-42): every open item below names its register row and the file that holds it.

## Known Blockers

- No active P0 gate blockers.
- ~~`npm run lint` currently reports non-blocking warnings~~ — cleared to zero and made blocking (`--max-warnings=0`) on 2026-09-24; see `docs/internal/todos/2026-09-24-todo-zero-warning-lint-gate.md`.
- Field Web Vitals are logged, and nothing aggregates them or compares them with the budget; the CI checks are lab figures from Lighthouse. Register row F-12, `docs/internal/initiatives/frontend-debt-register/analysis-field-vitals.md`.

## FE/BE Handshake Checkpoints

What each open item waits on: `docs/internal/initiatives/frontend-debt-register/analysis-decisions-owed-between-repos.md`.

- [x] Staging backend confirmed active: `https://lakira-backend-staging.onrender.com/api/v1`.
      Down since 2026-08-22; see `docs/reference/environments.md`.
- [ ] Production backend URL finalized and documented. Register row F-11;
      `docs/reference/environments.md`.
- [ ] FE production domain finalized and documented. Register row F-02, waiting on O-01.
- [ ] FE env alignment applied in all environments (`API_URL` equals `NEXT_PUBLIC_API_BASE_URL` per environment).
      Register row F-11; `docs/reference/environments.md`.
- [ ] Backend CORS coverage confirmed for FE local/preview/prod origins. Register row F-02.
- [x] Backend smoke check sequence confirmed for pre-production promotion: lakira-backend #171
      wrote it on 2026-10-16, and `docs/how-to/releases/release-checklist.md` links it.

## Done Criteria

- P0 blockers resolved and local full gate passes (or remaining failures are documented as out-of-scope/pre-existing with owners).
- CI pipeline is green on default branch with required jobs.
- Layers 1–4 are gated in CI, or each gap has a register row (see the roll-up above).
- Layer 5 has executable scripts/config and a documented CI mode.
- FE/BE handshake checkpoints are complete except explicitly accepted `TBD` items.

## Update Cadence

- The pipeline is recorded in `docs/reference/ci-pipeline/workflows.md`, which a workflow change
  updates in the same PR (its § Changing a workflow). This file is not a second record of it.
- Update this file when a handshake checkpoint moves, or when a roll-up row's register row closes.

## References

- `docs/explanation/documentation-standards.md`
- `docs/internal/initiatives/cicd/README.md`
- `docs/reference/ci-pipeline/workflows.md` (the pipeline today; supersedes the plan below as reference)
- `docs/internal/initiatives/cicd/pipeline-plan.md`
- `docs/reference/environments.md`
- `docs/reference/ci-pipeline/backend-handoff.md`
- `.github/workflows/test.yml`
- `.github/workflows/performance.yml`
- `docs/explanation/testing-strategy.md`
- `docs/internal/initiatives/tests-overhaul/2-unit-tests/PLAN.md`
- `docs/internal/initiatives/tests-overhaul/2-unit-tests/CHECKLIST.md`
- `docs/internal/initiatives/tests-overhaul/3-integration-tests/PLAN.md`
- `docs/internal/initiatives/tests-overhaul/3-integration-tests/CHECKLIST.md`
- `docs/internal/initiatives/tests-overhaul/3-integration-tests/a11y-testing-checklist.md`
- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/PLAN.md`
- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/CHECKLIST.md`
- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/a11y-e2e-checklist.md`
- `docs/internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/lighthouse-plan.md`
- `docs/internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/web-vitals-plan.md`
- `docs/internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/bundle-size-checklist.md`

## Status

**Issues:** #161 (F-02), #166 (F-11). The open boxes below are tracked there since 2026-10-25; this file is the dated record.
