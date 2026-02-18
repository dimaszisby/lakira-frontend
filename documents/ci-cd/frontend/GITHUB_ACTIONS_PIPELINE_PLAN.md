# Lakira Frontend - GitHub Actions Pipeline Plan

## 1. Purpose

This document defines the implemented CI pipeline in this FE repo.

Workflow file:

- `.github/workflows/test.yml`

Workflow name:

- `frontend-ci`

## 2. Triggers

- `push` to `main`, `dev`
- `pull_request` targeting `main`, `dev`

## 3. Concurrency

- Enabled: `frontend-ci-${{ github.ref }}`
- Behavior: cancel in-progress runs on newer commits to same ref.

## 4. Jobs And Order

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

### 4.3 `build` (needs `unit`)

Goal: ensure production build is valid.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run build`
5. Upload `.next` artifact (`next-build`)

### 4.4 `e2e` (needs `build`)

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

### 4.5 `security`

Goal: lint + dependency audit gate.

Steps:

1. Checkout
2. Setup Node 20 + npm cache
3. `npm ci`
4. `npm run security:scan`

### 4.6 `secret-scan`

Goal: secret leak detection.

Steps:

1. Full-history checkout (`fetch-depth: 0`)
2. Run Gitleaks

## 5. Scripts Required

From `package.json`:

- `lint`
- `lint:css`
- `typecheck`
- `test:unit:ci`
- `build`
- `test:e2e`
- `security:scan`

## 6. Secrets Required

- `CODECOV_TOKEN`

## 7. Notes

- Production deploy URL is not finalized yet.
- Staging backend currently active: `https://lakira-backend-staging.onrender.com/api/v1`.
- Update this plan and checklist whenever job names, trigger branches, or scripts change.
