# Lakira Frontend - GitHub Actions Pipeline Plan

## 1. Purpose

This document defines the implemented GitHub Actions pipelines in this FE repo.

Workflow files:

- `.github/workflows/test.yml`
- `.github/workflows/performance.yml`

Workflow name:

- `frontend-ci`
- `frontend-performance`

## 2. Triggers

- `push` to `main`, `dev`
- `pull_request` targeting `main`, `dev`
- `schedule` (performance workflow)
- `workflow_dispatch` (performance workflow)

## 3. Concurrency

- Enabled: `frontend-ci-${{ github.ref }}`
- Behavior: cancel in-progress runs on newer commits to same ref.

## 4. Main CI Jobs And Order (`test.yml`)

### 4.1 `checks`

Goal: fail fast on lint/type regressions.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run lint`
5. `npm run lint:css`
6. `npm run typecheck`

Lint behavior note:

- `npm run lint` currently fails on ESLint errors (warnings are reported but non-blocking).

Typing scope note:

- Root `tsconfig.json` excludes Cypress files to keep Jest/unit matcher typing stable.
- Cypress TypeScript context is maintained in `cypress/tsconfig.json`.

### 4.2 `unit` (needs `checks`)

Goal: run Jest unit tests with coverage.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run test:unit:ci`
5. Upload `coverage/lcov.info` to Codecov
6. Upload `coverage/` artifact

Current note:

- `test:unit:ci` runs Jest with `jest.unit.config.ts`.
- Unit discovery includes `*.test.ts(x)` / `*.spec.ts(x)` and excludes `*.int.test.ts(x)`.

### 4.3 `integration` (needs `unit`)

Goal: run real integration tests as a PR-required gate.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run test:integration`

Current note:

- `test:integration` runs Jest with `jest.integration.config.ts` and discovers `*.int.test.ts(x)` files.
- Global MSW lifecycle wiring is enabled in `jest.integration.setup.ts`.
- Implemented integration baseline coverage:
  - `src/features/auth/components/__tests__/LoginForm.int.test.tsx`
  - `src/features/metric-categories/components/__tests__/MetricCategoryForm.int.test.tsx`
  - `src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`
  - `src/features/metrics/components/__tests__/MetricForm.int.test.tsx`
  - `src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
  - `src/app/(app)/metrics/_components/__tests__/MetricsPageClient.int.test.tsx`

### 4.4 `build` (needs `integration`)

Goal: ensure production build is valid.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run build`
5. Upload `.next` artifact (`next-build`)

### 4.5 `e2e` (needs `build`)

Goal: run headless Cypress smoke tests against running app.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. Download `next-build` artifact to `.next`
5. Start app (`next start`)
6. Wait for `http://127.0.0.1:3000`
7. `npm run test:e2e`
8. Upload Cypress videos/screenshots artifacts

Script behavior note:

- `test:e2e` unsets `ELECTRON_RUN_AS_NODE` before Cypress run to avoid shell-level Electron launch conflicts in local environments.

### 4.6 `security`

Goal: lint + dependency audit gate.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run security:scan`

### 4.7 `secret-scan`

Goal: secret leak detection.

Steps:

1. Full-history checkout (`fetch-depth: 0`)
2. Run Gitleaks

## 5. Performance Workflow (`performance.yml`)

Job: `performance` (`Lighthouse and Bundle Metrics`)

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run build`
5. `npm run perf:bundle-size`
6. Start app (`next start` on `127.0.0.1:3000`)
7. `npm run perf:lighthouse`
8. `npm run perf:web-vitals`
9. Upload `reports/performance` artifact

Decision:

- Performance checks are **scheduled/nightly** and manually triggerable.
- Performance checks are **not PR-required gates** at this stage.

## 6. Scripts Required

From `package.json`:

- `lint`
- `lint:css`
- `typecheck`
- `test:unit:ci`
- `test:integration`
- `build`
- `test:e2e`
- `security:scan`
- `perf:bundle-size`
- `perf:lighthouse`
- `perf:web-vitals`

Naming contract:

- Unit/interaction: `*.test.ts(x)` and `*.spec.ts(x)` -> unit runner.
- Integration: `*.int.test.ts(x)` -> integration runner.
- E2E: `*.cy.ts`.

## 7. Secrets Required

- `CODECOV_TOKEN`

## 8. Notes

- Production deploy URL is not finalized yet.
- Staging backend currently active: `https://lakira-backend-staging.onrender.com/api/v1`.
- Update this plan and checklist whenever job names, trigger branches, or scripts change.
