# CI/CD TODO Overview — 2026-02-16

## Scope
- FE CI implementation.
- FE/BE handshake dependencies.
- Test program roll-up (Layers 1–5).

## Current Snapshot
Frontend CI has been expanded to a gated chain in `.github/workflows/test.yml` (`checks -> unit -> integration -> build -> e2e`) plus `security` and `secret-scan`. Performance checks are now wired in `.github/workflows/performance.yml` as scheduled/manual jobs (`perf:bundle-size`, `perf:lighthouse`, `perf:web-vitals`). Staging backend is active at `https://lakira-backend-staging.onrender.com/api/v1`, while production URL/domain remain TBD. As of February 18, 2026, P0 gate blockers are cleared and the full local gate commands run successfully.

## CI Test Program Roll-up (from tests-plans-and-logs)
| Layer | Source Docs | Current CI Status | Readiness | Blocking Gaps | Next Action |
| --- | --- | --- | --- | --- | --- |
| Layer 1 Static Checks | `documents/tests-plans-and-logs/TESTING_STRATEGY.md`, `documents/tests-plans-and-logs/1-static-checks/CHECKLIST.md` | `Gated` | Medium-High | Checklist restored; warning cleanup stream is still open for long-term quality. | Keep static-check execution log current after each CI/pipeline policy change. |
| Layer 2 Unit | `documents/tests-plans-and-logs/2-unit-tests/PLAN.md`, `documents/tests-plans-and-logs/2-unit-tests/CHECKLIST.md` | `Gated` | Medium-High | Boundary hardened via dedicated unit runner (`jest.unit.config.ts`); checklist/run-log refresh still needed for latest evidence. | Keep unit coverage progression and refresh evidence logs after each batch. |
| Layer 3 Integration | `documents/tests-plans-and-logs/3-integration-tests/PLAN.md`, `documents/tests-plans-and-logs/3-integration-tests/CHECKLIST.md`, `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md` | `Gated` | Medium-High | Boundary hardened via dedicated integration runner (`jest.integration.config.ts`); baseline covers auth login + metric-category form flows, but breadth is still limited. | Expand `.int.test.tsx` coverage to dashboard/metrics/logs/settings and add integration-level a11y assertions. |
| Layer 4 E2E | `documents/tests-plans-and-logs/4-end-to-end-tests/PLAN.md`, `documents/tests-plans-and-logs/4-end-to-end-tests/CHECKLIST.md`, `documents/tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md` | `Partial` | Medium-High | Base URL and auth/token helper scaffolding are implemented; broader authenticated flows and reset hooks remain pending. | Expand from smoke to authenticated metric/category/log/settings coverage. |
| Layer 5 Performance / Web Vitals | `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/lighthouse-plan.md`, `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/web-vitals-plan.md`, `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/bundle-size-checklist.md` | `Partial` | Medium | Scripts/config and scheduled CI are wired, but real-user Web Vitals instrumentation is still pending. | Keep scheduled audits stable and implement RUM Web Vitals collection path. |
| Cross-cutting A11y (Integration + E2E) | `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md`, `documents/tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md`, `documents/documentation/accessibility-guidelines.md` | `Planned` | Low | A11y checklists exist but are not enforced by dedicated CI a11y jobs yet. | Decide minimum automated a11y gate and wire to integration/E2E layers. |

## Priority Board

### P0 — Unblock Current Gates
- [x] Fix type/build blocker in `src/app/(app)/metrics/[metricId]/settings/edit/page.tsx:4` (resolved by wiring `useMetricDetail` context into `MetricSettingsFormDialog` props).
- [x] Fix Jest mock/module path blocker in `src/features/metric-categories/components/__tests__/MetricCategoryMobileCard.test.tsx:15` (removed stale mock for deleted `@/ui/OverlineLabel` module).
- [x] Fix Jest mock/module path blocker in `src/components/ui/__tests__/DataLabel.test.tsx:5` (removed stale mock for deleted `@/components/ui/OverlineLabel` module and aligned assertions to current component output).
- [x] Stabilize test typing consistency in test files so `npm run typecheck` is green with current include scope (isolated Cypress typing via `cypress/tsconfig.json`, excluded Cypress files from root `tsconfig.json`, and fixed strict typing in affected tests).
- [x] Rerun full local gate: `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run test:unit:ci`, `npm run build`, `npm run test:e2e` (passed on February 18, 2026; local `test:e2e` stabilized by unsetting `ELECTRON_RUN_AS_NODE` in script).

### P1 — Lay Out Planned Test Foundations
- [x] Layer 1: define/restore static-checks checklist artifact in `documents/tests-plans-and-logs/1-static-checks/CHECKLIST.md`.
- [x] Layer 3: finalize `renderWithProviders` path/signature decision.
- [x] Layer 3: finalize MSW handler location decision.
- [x] Layer 3: finalize naming conventions and routing mock strategy.
- [x] Layer 3: implement helper/MSW scaffolding (`src/test-utils/renderWithProviders.tsx`, `src/test-utils/msw/server.ts`, `src/test-utils/msw/handlers.ts`).
- [x] Layer 4: finalize stable base URL decision.
- [x] Layer 4: finalize auth helper decision.
- [x] Layer 4: finalize data reset strategy decision.
- [x] Layer 4: finalize token-expiry simulation path decision.
- [x] Layer 4: implement Cypress auth/token helpers (`cypress/support/commands.ts`) and wire Cypress support file in config.
- [x] Layer 5: define executable scripts/config for Lighthouse, Web Vitals collection, and bundle-size checks.

### P2 — Wire Additional CI Tracks
- [x] Keep current PR-gated chain: `checks`, `unit`, `integration`, `build`, `e2e` smoke, `security`, `secret-scan`.
- [x] Add integration tests as PR-required gate (implemented via `test:integration` with `jest.integration.config.ts` and active `.int.test.tsx` coverage).
- [x] Add performance/web-vitals tests as scheduled/nightly gate (`.github/workflows/performance.yml`).
- [x] Record the gating decision in CI/CD docs.

### P3 — Documentation Hygiene
- [x] Track typo/path cleanup for `documents/tests-plans-and-logs/3-integration-tests/CHEKLIST.md` naming consistency (canonical `CHECKLIST.md` added; legacy filename kept as compatibility pointer).
- [ ] Keep overview lean and link out to detail docs (single-source principle from `documents/documentation/dev-documentation-guidelines.md`).
- [ ] Ensure each TODO item references a concrete doc/code/workflow path.

## Known Blockers
- No active P0 gate blockers.
- `npm run lint` currently reports non-blocking warnings (import order/class order/react-refresh/sonar/react-hooks guidance); warning cleanup remains a quality backlog item.
- Real-user Web Vitals telemetry path is not implemented yet (current Web Vitals checks are lab-derived from Lighthouse reports).

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
- `.github/workflows/performance.yml`
- `documents/tests-plans-and-logs/TESTING_STRATEGY.md`
- `documents/tests-plans-and-logs/2-unit-tests/PLAN.md`
- `documents/tests-plans-and-logs/2-unit-tests/CHECKLIST.md`
- `documents/tests-plans-and-logs/3-integration-tests/PLAN.md`
- `documents/tests-plans-and-logs/3-integration-tests/CHECKLIST.md`
- `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md`
- `documents/tests-plans-and-logs/4-end-to-end-tests/PLAN.md`
- `documents/tests-plans-and-logs/4-end-to-end-tests/CHECKLIST.md`
- `documents/tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/lighthouse-plan.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/web-vitals-plan.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/bundle-size-checklist.md`
