# Lakira Frontend - CI/CD Overview

## 1. Purpose

This folder documents the current CI/CD setup for the Lakira Frontend repository.

- Workflow file: `.github/workflows/test.yml`
- Deploy platform: Vercel (outside GitHub Actions deploy job)

Related documents:

- `documents/ci-cd/frontend/ENVIRONMENTS_MATRIX.md`
- `documents/ci-cd/frontend/GITHUB_ACTIONS_PIPELINE_PLAN.md`
- `documents/ci-cd/frontend/GITHUB_ACTIONS_PIPELINE_CHECKLIST.md`
- `documents/ci-cd/frontend/BACKEND_HANDOFF_FOR_FE_CICD.md`

## 2. Provenance And Sync

- This FE CI/CD documentation started from backend-side handoff material and is synchronized for this FE repo.
- **Backend repo docs remain authoritative** for backend deployment policy, backend release sequencing, and backend contract/staging truth.
- Last FE sync audit: **February 18, 2026**.

## 3. Environment Status (Confirmed)

- Staging backend is active and running: `https://lakira-backend-staging.onrender.com/api/v1`.
- Production backend web-service URL is **not available yet**.
- FE production domain is **not finalized yet**.

## 4. GitHub Actions Workflow

Workflow: `.github/workflows/test.yml` (name: `frontend-ci`)

Triggers:

- `push` to `main`, `dev`
- `pull_request` targeting `main`, `dev`

Concurrency:

- Enabled with branch-level cancellation (`frontend-ci-${{ github.ref }}`).

Jobs:

1. `checks`
- `npm ci`
- `npm run lint`
- `npm run lint:css`
- `npm run typecheck`

2. `unit` (needs `checks`)
- `npm ci`
- `npm run test:unit:ci`
- Uploads coverage to Codecov (`CODECOV_TOKEN`)
- Uploads coverage artifact

3. `integration` (needs `unit`)
- `npm ci`
- `npm run test:integration` (`--passWithNoTests` until integration specs are added)

4. `build` (needs `integration`)
- `npm ci`
- `npm run build`
- Uploads `.next` artifact

5. `e2e` (needs `build`)
- Downloads `.next` artifact
- Starts Next.js (`next start`)
- Runs `npm run test:e2e` (Cypress headless)
- Uploads Cypress videos/screenshots

6. `security`
- `npm ci`
- `npm run security:scan`

7. `secret-scan`
- Full-history checkout
- Gitleaks scan

## 5. Script Alignment (`package.json`)

CI-gated scripts now include:

- `lint`
- `lint:css`
- `typecheck`
- `test:unit:ci`
- `test:integration`
- `build`
- `test:e2e`
- `security:scan`

Also available:

- `test`, `test:unit`, `start`, `coverage:check`, `format`

TypeScript project split used by tooling:

- Root `tsconfig.json` is used by `npm run typecheck` for app + Jest/unit test code.
- Cypress TypeScript context is isolated in `cypress/tsconfig.json` to prevent Cypress Chai globals from leaking into Jest matcher typing.

Current local validation snapshot (February 18, 2026):

- Passed: `npm run lint`, `npm run lint:css`, `npm run typecheck`, `npm run test:unit:ci`, `npm run test:integration`, `npm run build`, `npm run test:e2e`.
- Note: `lint` currently fails on ESLint errors only; warning cleanup is tracked separately.
- Note: `test:e2e` unsets `ELECTRON_RUN_AS_NODE` in script to avoid local Electron/Cypress launch conflicts.
- Note: integration helpers/MSW scaffolding exists in `src/test-utils/`; global MSW Jest setup will be enabled when integration specs start using network handlers.

## 6. Secrets And Env Vars

GitHub Actions secret currently required:

- `CODECOV_TOKEN`

Runtime env vars used by FE code:

- `API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VERCEL_URL`
- `VERCEL_URL`
- `HOST`, `PORT`

## 7. Recommendation For Local FE/BE URL Strategy

To avoid local drift between auth/proxy routes and browser runtime:

1. Set both `API_URL` and `NEXT_PUBLIC_API_BASE_URL` explicitly in `.env.local`.
2. Keep both pointed to the same backend base URL (recommended local default: `http://localhost:4000/api/v1`).
3. Do not rely on proxy fallback behavior as your primary local config path.

## 8. Backend Dependency Boundary

The FE workflow currently gates code quality and tests, but does not yet run backend staging smoke checks directly.

Before enabling automatic FE production deployment, keep backend-authoritative verification for:

- staging/prod backend URL ownership
- health/smoke checks
- FE/BE coordinated rollout for breaking API changes
