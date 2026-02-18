# CI/CD TODO Overview — 2026-02-16

## Scope
- FE CI implementation.
- FE/BE handshake dependencies.
- Test program roll-up (Layers 1–5).

## Current Snapshot
Frontend CI has been expanded to a gated chain in `.github/workflows/test.yml` (`checks -> unit -> build -> e2e`) plus `security` and `secret-scan`. Staging backend is active at `https://lakira-backend-staging.onrender.com/api/v1`, while production URL/domain remain TBD. As of February 18, 2026, the P0 type/build and Jest-path blockers are resolved, but the full local gate is still blocked by lint/stylelint and local Cypress runtime issues.

## CI Test Program Roll-up (from tests-plans-and-logs)
| Layer | Source Docs | Current CI Status | Readiness | Blocking Gaps | Next Action |
| --- | --- | --- | --- | --- | --- |
| Layer 1 Static Checks | `documents/tests-plans-and-logs/TESTING_STRATEGY.md`, `documents/tests-plans-and-logs/1-static-checks/` | `Gated` | Medium | Layer folder exists but checklist artifact is missing in `1-static-checks/`. | Define/restore static-checks checklist artifact and map it to current CI checks. |
| Layer 2 Unit | `documents/tests-plans-and-logs/2-unit-tests/PLAN.md`, `documents/tests-plans-and-logs/2-unit-tests/CHECKLIST.md` | `Gated` | Medium | Existing unit blockers prevent stable green state; log/checklist needs fresh run entries. | Fix blockers, rerun unit gate, update execution log with latest run evidence. |
| Layer 3 Integration | `documents/tests-plans-and-logs/3-integration-tests/PLAN.md`, `documents/tests-plans-and-logs/3-integration-tests/CHEKLIST.md`, `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md` | `Planned` | Low | Placeholder decisions still open (`renderWithProviders`, MSW paths, naming convention, router-mock strategy). | Finalize integration harness decisions and create implementation checklist updates. |
| Layer 4 E2E | `documents/tests-plans-and-logs/4-end-to-end-tests/PLAN.md`, `documents/tests-plans-and-logs/4-end-to-end-tests/CHECKLIST.md`, `documents/tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md` | `Partial` | Medium-Low | E2E job exists, but environment foundations are not fully laid out (stable base URL strategy, auth helper, data reset, token-expiry simulation). | Finalize foundational E2E decisions and expand beyond smoke-level coverage. |
| Layer 5 Performance / Web Vitals | `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/lighthouse-plan.md`, `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/web-vitals-plan.md`, `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/bundle-size-checklist.md` | `Not Wired` | Low | No executable scripts/config and no CI wiring for Lighthouse/Web Vitals/bundle checks. | Define runnable scripts/config and decide CI mode (PR gate vs scheduled). |
| Cross-cutting A11y (Integration + E2E) | `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md`, `documents/tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md`, `documents/documentation/accessibility-guidelines.md` | `Planned` | Low | A11y checklists exist but are not enforced by dedicated CI a11y jobs yet. | Decide minimum automated a11y gate and wire to integration/E2E layers. |

## Priority Board

### P0 — Unblock Current Gates
- [x] Fix type/build blocker in `src/app/(app)/metrics/[metricId]/settings/edit/page.tsx:4` (resolved by wiring `useMetricDetail` context into `MetricSettingsFormDialog` props).
- [x] Fix Jest mock/module path blocker in `src/features/metric-categories/components/__tests__/MetricCategoryMobileCard.test.tsx:15` (removed stale mock for deleted `@/ui/OverlineLabel` module).
- [x] Fix Jest mock/module path blocker in `src/components/ui/__tests__/DataLabel.test.tsx:5` (removed stale mock for deleted `@/components/ui/OverlineLabel` module and aligned assertions to current component output).
- [x] Stabilize test typing consistency in test files so `npm run typecheck` is green with current include scope (isolated Cypress typing via `cypress/tsconfig.json`, excluded Cypress files from root `tsconfig.json`, and fixed strict typing in affected tests).
- [ ] Rerun full local gate: `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run test:unit:ci`, `npm run build`, `npm run test:e2e` (partial complete: `typecheck`, `test:unit:ci`, `build` passed on February 18, 2026).

### P1 — Lay Out Planned Test Foundations
- [ ] Layer 1: define/restore static-checks checklist artifact in `documents/tests-plans-and-logs/1-static-checks/`.
- [ ] Layer 3: finalize `renderWithProviders` path/signature decision.
- [ ] Layer 3: finalize MSW handler location decision.
- [ ] Layer 3: finalize naming conventions and routing mock strategy.
- [ ] Layer 4: finalize stable base URL decision.
- [ ] Layer 4: finalize auth helper decision.
- [ ] Layer 4: finalize data reset strategy decision.
- [ ] Layer 4: finalize token-expiry simulation path decision.
- [ ] Layer 5: define executable scripts/config for Lighthouse, Web Vitals collection, and bundle-size checks.

### P2 — Wire Additional CI Tracks
- [ ] Keep current PR-gated chain: `checks`, `unit`, `build`, `e2e` smoke, `security`, `secret-scan`.
- [ ] Add integration tests as either PR-required or scheduled/nightly gate.
- [ ] Add performance/web-vitals tests as either PR-required or scheduled/nightly gate.
- [ ] Record the gating decision in CI/CD docs once chosen.

### P3 — Documentation Hygiene
- [ ] Track typo/path cleanup for `documents/tests-plans-and-logs/3-integration-tests/CHEKLIST.md` naming consistency.
- [ ] Keep overview lean and link out to detail docs (single-source principle from `documents/documentation/dev-documentation-guidelines.md`).
- [ ] Ensure each TODO item references a concrete doc/code/workflow path.

## Known Blockers
- Local `npm run lint` still fails on existing repo-wide lint errors unrelated to this P0 test-typing patch (for example `src/app/(app)/metrics/[metricId]/logs/_components/MetricLogsClient.tsx:52` and `src/types/dtos/user.dto.ts:3`).
- Local `npm run lint:css` fails because `stylelint-config-prettier` is missing from dev dependencies.
- Local `npm run test:e2e` currently fails to launch Cypress binary in this workstation environment (`Cypress.app ... bad option: --no-sandbox --smoke-test --ping`); CI execution behavior should be validated on GitHub Actions runners.

## FE/BE Handshake Checkpoints
- [x] Staging backend confirmed active: `https://lakira-backend-staging.onrender.com/api/v1`.
- [ ] Production backend URL finalized and documented.
- [ ] FE production domain finalized and documented.
- [ ] FE env alignment applied in all environments (`API_URL` equals `NEXT_PUBLIC_API_BASE_URL` per environment).
- [ ] Backend CORS coverage confirmed for FE local/preview/prod origins.
- [ ] Backend smoke check sequence confirmed for pre-production promotion.

## Done Criteria
- P0 blockers resolved and local full gate passes (or remaining failures are documented as out-of-scope/pre-existing with owners).
- CI pipeline is green on default branch with required jobs.
- CI Test Program Roll-up has no `Low` readiness items for foundational Layer 1–4 needs.
- Layer 5 has executable scripts/config and a documented CI mode.
- FE/BE handshake checkpoints are complete except explicitly accepted `TBD` items.

## Update Cadence
- Update after every CI-related merge.
- Review weekly for stale blockers and scope drift.
- Reclassify statuses (`Gated`, `Partial`, `Planned`, `Not Wired`) when conditions change.

## References
- `documents/documentation/dev-documentation-guidelines.md`
- `documents/ci-cd/frontend/README.md`
- `documents/ci-cd/frontend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- `documents/ci-cd/frontend/ENVIRONMENTS_MATRIX.md`
- `documents/ci-cd/frontend/BACKEND_HANDOFF_FOR_FE_CICD.md`
- `.github/workflows/test.yml`
- `documents/tests-plans-and-logs/TESTING_STRATEGY.md`
- `documents/tests-plans-and-logs/2-unit-tests/PLAN.md`
- `documents/tests-plans-and-logs/2-unit-tests/CHECKLIST.md`
- `documents/tests-plans-and-logs/3-integration-tests/PLAN.md`
- `documents/tests-plans-and-logs/3-integration-tests/CHEKLIST.md`
- `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md`
- `documents/tests-plans-and-logs/4-end-to-end-tests/PLAN.md`
- `documents/tests-plans-and-logs/4-end-to-end-tests/CHECKLIST.md`
- `documents/tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/lighthouse-plan.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/web-vitals-plan.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/bundle-size-checklist.md`
