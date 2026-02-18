# Lakira Frontend - GitHub Actions Checklist

Use this checklist when updating `.github/workflows/test.yml`.

## 1. Workflow Baseline

- [ ] Workflow exists at `.github/workflows/test.yml`.
- [ ] Workflow name is `frontend-ci` (or intentional rename documented).
- [ ] `push` branches include `main`, `dev`.
- [ ] `pull_request` branches include `main`, `dev`.
- [ ] Concurrency cancel-in-progress is enabled.

## 2. Core Gated Chain

- [ ] `checks` runs lint + css lint + typecheck.
- [ ] `unit` needs `checks` and runs `test:unit:ci`.
- [ ] `build` needs `unit` and runs `build`.
- [ ] `e2e` needs `build` and runs `test:e2e` against started app.

## 3. Additional Gates

- [ ] `security` runs `security:scan`.
- [ ] `secret-scan` runs Gitleaks with full history checkout.

## 4. Artifacts And Reporting

- [ ] Coverage uploads to Codecov via `CODECOV_TOKEN`.
- [ ] Coverage artifact uploads from `coverage/`.
- [ ] Build artifact uploads `.next` for E2E reuse.
- [ ] E2E job uploads Cypress videos/screenshots.

## 5. Script Alignment (`package.json`)

- [ ] `lint` behavior is documented (error-only vs warning-strict policy).
- [ ] `typecheck` exists.
- [ ] `test:unit:ci` exists.
- [ ] `test:e2e` exists.
- [ ] `build` exists.
- [ ] `security:scan` exists.
- [ ] TS project configs remain aligned (`tsconfig.json` for app/unit, `cypress/tsconfig.json` for Cypress scope).

## 6. Environment And Secret Hygiene

- [ ] No hard-coded secrets in YAML.
- [ ] `CODECOV_TOKEN` exists in GitHub repo secrets.
- [ ] FE runtime env var docs stay aligned (`API_URL`, `NEXT_PUBLIC_API_BASE_URL`, etc.).

## 7. Documentation Sync

- [ ] `documents/ci-cd/frontend/README.md` updated.
- [ ] `documents/ci-cd/frontend/GITHUB_ACTIONS_PIPELINE_PLAN.md` updated.
- [ ] `documents/ci-cd/frontend/ENVIRONMENTS_MATRIX.md` updated.
- [ ] `documents/ci-cd/frontend/BACKEND_HANDOFF_FOR_FE_CICD.md` updated if FE/BE dependency assumptions changed.
