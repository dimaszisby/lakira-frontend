# Lighthouse Plan - Lakira Frontend

This document defines how Lighthouse is used in Lakira frontend quality checks.

References:

- `documents/documentation/performance-budget.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/bundle-size-checklist.md`
- `documents/ci-cd/frontend/GITHUB_ACTIONS_PIPELINE_PLAN.md`

---

## 1. Current Status

- Lighthouse is not yet wired into CI jobs.
- Current CI quality gates remain: lint, typecheck, unit, build, e2e, security, secret-scan.
- Lighthouse checks are currently manual/planned.

---

## 2. Tooling Decision

- Target tooling: Lighthouse CLI (`lighthouse`) with JSON + HTML artifacts.
- Target config file: `lighthouserc.json` at repo root (planned).
- CI mode decision (pending): PR gate vs scheduled/nightly run.

---

## 3. Run Targets

Primary pages to audit:

- `/`
- `/login`
- `/dashboard`
- `/metrics`

Environment targets:

- Local: `http://127.0.0.1:3000`
- Staging: use FE preview/staging URL once finalized in env matrix docs.

---

## 4. Manual Run Procedure (Current)

1. Build and start app:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
```

2. Run Lighthouse per route (example):

```bash
npx lighthouse http://127.0.0.1:3000/dashboard \
  --output html \
  --output json \
  --output-path ./reports/lighthouse-dashboard \
  --chrome-flags="--headless"
```

3. Save artifacts in `reports/` and link results in release/perf logs.

---

## 5. Exit Criteria for CI Wiring

- [ ] Config file (`lighthouserc.json`) is added and reviewed.
- [ ] Minimum score thresholds are aligned with `performance-budget.md`.
- [ ] CI job uploads Lighthouse artifacts.
- [ ] Ownership for threshold failures is defined.

