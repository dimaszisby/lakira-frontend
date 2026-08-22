# Lakira Frontend Unit Test Plan

This document expands on the `unit-test-plan` section inside `testing-plan.md` and prescribes the detailed process, tooling, and governance for implementing and maintaining unit tests across the Lakira Frontend codebase.

## 1. Objectives

1. Guarantee deterministic behavior of pure utilities, shared hooks, adapters, and schema transformers.
2. Provide fast feedback (<5 minutes for full suite) for developers on every PR and local iteration.
3. Maintain confidence thresholds: ≥90% statement coverage on pure helpers, ≥80% branch coverage on hooks that orchestrate third-party libraries, and zero uncovered critical branches noted during code review.

## 2. Scope

- **In scope:** Files under `src/lib`, `src/utils`, custom hooks (`src/features/**/hooks`, `src/components/**/hooks`), data mappers, React Query configuration helpers, form schemas (Zod/react-hook-form resolvers), and adapters that wrap external APIs (e.g., Chart data prep).
- **Out of scope:** DOM-heavy components (covered by component tests), full page/provider orchestration (integration tests), Cypress specs, or backend contract validation.

## 3. Roles & Responsibilities

- **Feature squads:** Write and maintain unit tests alongside implementation; ensure fixtures stay updated when data contracts change.
- **QA/Testing guild:** Review coverage reports, coach teams on best practices, and audit flaky tests.
- **Platform team:** Own Jest configuration, shared helpers (e.g., `renderHookWithProviders`), and CI integration.

## 4. Environments & Tooling

- **Runtime:** Node.js 20.x with `jsdom` test environment; deterministic timezone `UTC` enforced via Jest setup.
- **Tooling Stack:**
  - Jest + `ts-jest` for TypeScript transpilation.
  - `@testing-library/react-hooks` (or `renderHook` from `@testing-library/react`) for hook testing.
  - `msw` (node + browser) to mock network-dependent hooks.
  - `jest-canvas-mock` for helpers that interact with Chart.js.
  - Coverage reporters: `text`, `lcov` (for CI upload), and `json-summary` for dashboards.
- **Configuration Files:**
  - `jest.config.ts` referencing `tsconfig.jest.json` (if needed for path aliases).
  - `jest.setup.ts` for extending `expect`, configuring `@testing-library/jest-dom`, and setting globals.

## 5. Test Data & Fixtures

- Place reusable samples under `src/test-utils/fixtures`.
- Include builders/factories (e.g., `buildMetricCategory`, `buildMetricLog`) that default to valid objects but allow overrides.
- Store sensitive tokens or credentials as environment variables mocked inside tests; never commit secrets.

## 6. Workflow

1. **Planning:** During refinement, identify helper functions or hooks affected by a feature. Update acceptance criteria with the expected unit test coverage.
2. **Implementation:** Follow TDD or write tests alongside code. Each new helper/hook must include:
   - Success path test(s).
   - Failure/edge cases.
   - Assertion for side effects (e.g., toast, logging, cache invalidation).
3. **Local Execution:** Run `npm run test:unit` (add script alias) or `npx jest path/to/file.test.ts`. Use `--runInBand` when debugging.
4. **CI Execution:** GitHub Actions job `unit-tests` (see `.github/workflows/test.yml`) runs `npm run test:unit:ci` with coverage enabled. Failures block merge and upload the coverage artifact for reporting.
5. **Review:** Pull requests must display coverage changes (e.g., Codecov/coveralls comment) and include at least one reviewer verifying test relevance.
6. **Maintenance:** Refactor tests when APIs change; delete obsolete cases; move shared mocks to `src/test-utils`.

## 7. Test Case Guidelines

- Keep tests deterministic by mocking timers (`jest.useFakeTimers()`), random IDs (`uuid`), and network responses (MSW).
- Avoid snapshot testing for logic; prefer explicit assertions on returned values or state transitions.
- When testing hooks with asynchronous behavior (React Query), wrap actions in `await waitFor` and flush microtasks to avoid race conditions.
- Document unusual edge cases directly in the test name (e.g., `"returns fallback unit when metric lacks default"`).

## 8. Reporting & Metrics

- **Coverage Reports:** Stored as `coverage/lcov.info`, published via Codecov (`.github/workflows/test.yml` – requires `CODECOV_TOKEN` repository secret) for dashboards, and archived as CI artifacts. Minimum thresholds enforced via Jest config.
- **Folder Checklist:** Run `npm run coverage:check` after generating coverage to see a scripted checklist of per-folder goals defined in `coverage-goals.json`; update targets upward as suites grow.
- **Threshold Guardrails:** `jest.config.ts` enforces bootstrap global minimums (≥3% statements/lines/functions, ≥2% branches) so CI fails when coverage drops to zero while we grow the suite—raise these targets as coverage increases.
- **Trend Tracking:** QA guild reviews coverage weekly; dips >5% require action items.
- **Defect Logging:** Bugs rooted in unit-level regressions must include references to missing or outdated tests; add them before closing the issue.

## 9. Governance & Audits

- Quarterly audit verifies:
  - All folders listed in scope have at least one colocated `*.test.ts` file.
  - Fixtures are reused (no duplicate literal JSON across tests).
  - Deprecated APIs (e.g., legacy hooks) are either removed or covered by tests in archival directories.
- Audit findings recorded in `security-audit-log.md` when relevant to security-critical logic (auth, encryption, logging).

## 10. References

- `docs/explanation/testing-strategy.md` (master strategy)
- `docs/internal/audits/security/audit-2025-11-21/security-audit-plan.md`
- `docs/internal/audits/security/audit-2025-11-21/threat-model.md`
- Jest Docs: https://jestjs.io/docs/getting-started
- MSW Docs: https://mswjs.io/docs/

By adhering to this unit test plan, Lakira teams gain predictable, high-signal test coverage that prevents logic regressions and supports rapid iteration.
