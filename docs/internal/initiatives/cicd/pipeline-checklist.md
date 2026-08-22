# Lakira Frontend - GitHub Actions Checklist

Use this checklist when updating `.github/workflows/test.yml` or `.github/workflows/performance.yml`.

## 1. Workflow Baseline

- [ ] Workflow exists at `.github/workflows/test.yml`.
- [ ] Workflow name is `frontend-ci` (or intentional rename documented).
- [ ] `push` branches include `main`, `dev`.
- [ ] `pull_request` branches include `main`, `dev`.
- [ ] Concurrency cancel-in-progress is enabled.
- [ ] Performance workflow exists at `.github/workflows/performance.yml`.
- [ ] Performance workflow includes schedule + workflow_dispatch triggers.

## 2. Core Gated Chain

- [ ] `checks` runs lint + css lint + typecheck.
- [ ] `unit` needs `checks` and runs `test:unit:ci`.
- [ ] `integration` needs `unit` and runs `test:integration`.
- [ ] `build` needs `integration` and runs `build`.
- [ ] `e2e` needs `build` and runs `test:e2e` against started app.

## 3. Additional Gates

- [ ] `security` runs `security:scan`.
- [ ] `secret-scan` runs Gitleaks with full history checkout.
- [ ] `performance` workflow runs bundle/lighthouse/web-vitals scripts and uploads reports.

## 4. Artifacts And Reporting

- [ ] Coverage uploads to Codecov via `CODECOV_TOKEN`.
- [ ] Coverage artifact uploads from `coverage/`.
- [ ] Build artifact uploads `.next` for E2E reuse.
- [ ] E2E job uploads Cypress videos/screenshots.

## 5. Script Alignment (`package.json`)

- [ ] `lint` behavior is documented (error-only vs warning-strict policy).
- [ ] `typecheck` exists.
- [ ] `test:unit:ci` exists.
- [ ] `test:integration` exists.
- [ ] `test:e2e` exists.
- [ ] `build` exists.
- [ ] `security:scan` exists.
- [ ] `perf:bundle-size` exists.
- [ ] `perf:lighthouse` exists.
- [ ] `perf:web-vitals` exists.
- [ ] TS project configs remain aligned (`tsconfig.json` for app/unit, `cypress/tsconfig.json` for Cypress scope).

## 6. Environment And Secret Hygiene

- [ ] No hard-coded secrets in YAML.
- [ ] `CODECOV_TOKEN` exists in GitHub repo secrets.
- [ ] FE runtime env var docs stay aligned (`API_URL`, `NEXT_PUBLIC_API_BASE_URL`, etc.).

## 7. Documentation Sync

- [ ] `docs/internal/initiatives/cicd/README.md` updated.
- [ ] `docs/internal/initiatives/cicd/pipeline-plan.md` updated.
- [ ] `docs/reference/environments.md` updated.
- [ ] `docs/reference/ci-pipeline/backend-handoff.md` updated if FE/BE dependency assumptions changed.
