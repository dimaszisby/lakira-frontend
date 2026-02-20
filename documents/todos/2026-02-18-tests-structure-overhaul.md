# Tests Structure Overhaul TODO — 2026-02-18

## Scope
- Strict-boundary-first overhaul for test-layer separation.
- Keep co-located tests as current foldering strategy.
- No mass folder migration in this phase.

## Current Snapshot (Evidence)
- Unit runner overlap exists in baseline:
  - `npx jest --runInBand --listTests | rg '\.int\.test\.tsx?$'` currently returns integration files.
- Integration runner is already explicit:
  - `npm run test:integration` uses `jest.integration.config.ts` and discovers only `*.int.test.ts(x)`.

## Target State
- Unit and integration test discovery are fully disjoint.
- Naming contract is explicit and documented:
  - `*.test.ts(x)` and `*.spec.ts(x)` -> unit/interaction.
  - `*.int.test.ts(x)` -> integration.
  - `*.cy.ts` -> E2E.
- CI job contracts stay stable while script behavior is hardened.

## Workstreams

### WS1 Naming Contract
- [x] Publish canonical naming and layer ownership in testing docs.
- [x] Align component-quality docs to reference the single-source testing strategy.

### WS2 Jest Discovery Boundaries
- [x] Add `jest.unit.config.ts` (unit-only patterns, explicit `*.int.test.ts(x)` exclusion).
- [x] Keep `jest.integration.config.ts` as integration-only discovery.

### WS3 Script and CI Alignment
- [x] Update unit scripts in `package.json` to run against `jest.unit.config.ts`.
- [x] Verify `.github/workflows/test.yml` remains valid with updated scripts.

### WS4 Documentation Sync
- [x] Update `documents/tests-plans-and-logs/TESTING_STRATEGY.md`.
- [x] Update `documents/documentation/engineering/components/component-testing-and-quality-gates.md`.
- [x] Update `documents/ci-cd/frontend/README.md`.
- [x] Update `documents/ci-cd/frontend/GITHUB_ACTIONS_PIPELINE_PLAN.md`.
- [x] Update `documents/todos/2026-02-16-todo-cicd-overview.md`.

### WS5 Migration and Guardrails
- [x] Capture validation command outcomes in this TODO.
- [ ] Keep future optional folder split (`__tests__/unit`, `__tests__/integration`) as deferred P3 topic.

## Priority Board

### P0 Boundary Enforcement
- [x] Add `jest.unit.config.ts`.
- [x] Update `test:unit`, `test:unit:watch`, `test:unit:ci` scripts.
- [x] Validate unit discovery excludes `*.int.test.ts(x)`.
- [x] Validate integration discovery includes only `*.int.test.ts(x)`.

### P1 Consistency and Conventions
- [x] Sync naming/routing contract across testing + component quality docs.

### P2 Guardrails and Coverage Backfill
- [x] Add CI-safe discovery checks in docs/runbook.
- [ ] Continue integration coverage expansion after boundary hardening (progress: added `LogForm.int.test.tsx`, `MetricForm.int.test.tsx`, `MetricSettingsForm.int.test.tsx`, `MetricsPageClient.int.test.tsx`, `DashboardContent.int.test.tsx`, and `MetricDetailComposite.int.test.tsx` baselines on 2026-02-18).

### P3 Optional Future Reorg
- [ ] Evaluate explicit unit/integration subfolders only if readability degrades.

## Acceptance Criteria
1. Unit runner no longer discovers any `.int.test.ts(x)` files.
2. Integration runner discovers only `.int.test.ts(x)` files.
3. Updated docs consistently state naming + runner contracts.
4. This TODO remains a lean tracker with concrete links and validation status.
5. CI workflow/script docs match actual `package.json` behavior.

## Validation Commands
- [x] `npx jest --runInBand --config jest.unit.config.ts --listTests | rg '\.int\.test\.tsx?$'`
  - Expected: no output.
- [x] `npx jest --runInBand --config jest.integration.config.ts --listTests`
  - Expected: only `.int.test.ts(x)` files.
- [x] `npm run test:unit`
  - Expected: unit-only suite executes.
- [x] `npm run test:integration`
  - Expected: integration-only suite executes.
- [x] `npm run typecheck`
  - Expected: passes.

Validation snapshot (2026-02-18):

- Unit discovery isolation: pass (no `*.int.test.ts(x)` listed under unit config).
- Integration discovery isolation: pass (`LoginForm.int.test.tsx`, `MetricCategoryForm.int.test.tsx`, `LogForm.int.test.tsx`, `MetricForm.int.test.tsx`, `MetricSettingsForm.int.test.tsx`, `MetricsPageClient.int.test.tsx`, `DashboardContent.int.test.tsx`, `MetricDetailComposite.int.test.tsx`).
- `npm run test:unit`: pass (43 suites, 165 tests).
- `npm run test:unit:ci`: pass (43 suites, 165 tests, coverage report generated).
- `npm run test:integration`: pass (8 suites, 23 tests).
- `npm run typecheck`: pass.

## Risks and Mitigations
- Risk: layer overlap returns silently as test count grows.
  - Mitigation: keep explicit config boundaries and periodic discovery checks.
- Risk: confusion on test suffix expectations.
  - Mitigation: publish naming contract in strategy docs and reference it from quality gates docs.
- Risk: delaying CI/CD track due to broad refactor.
  - Mitigation: strict-boundary-first scope only; defer folder migration.

## References
- `jest.config.ts`
- `jest.unit.config.ts`
- `jest.integration.config.ts`
- `package.json`
- `.github/workflows/test.yml`
- `documents/tests-plans-and-logs/TESTING_STRATEGY.md`
- `documents/tests-plans-and-logs/3-integration-tests/PLAN.md`
- `documents/documentation/engineering/components/component-testing-and-quality-gates.md`
- `documents/ci-cd/frontend/README.md`
- `documents/ci-cd/frontend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- `documents/todos/2026-02-16-todo-cicd-overview.md`
