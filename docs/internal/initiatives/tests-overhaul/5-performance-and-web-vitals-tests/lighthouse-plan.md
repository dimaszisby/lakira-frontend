# Lighthouse Plan - Lakira Frontend

This document defines how Lighthouse is used in Lakira frontend quality checks.

References:

- `docs/reference/performance-budget.md`
- `docs/internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/bundle-size-checklist.md`
- `docs/internal/initiatives/cicd/pipeline-plan.md`

---

## 1. Current Status

- Lighthouse checks are wired via script + scheduled CI workflow.
- Threshold source of truth: `scripts/perf/performance-thresholds.json`.
- Scheduled runner: `.github/workflows/performance.yml` (nightly + manual dispatch).

---

## 2. Tooling Decision

- Tooling: Lighthouse CLI via `npx lighthouse` in `scripts/perf/run-lighthouse.mjs`.
- Config + thresholds: `scripts/perf/performance-thresholds.json`.
- CI mode decision: scheduled/nightly gate (`.github/workflows/performance.yml`), not PR-required.

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

## 4. Run Procedure

1. Build app:

```bash
npm run build
```

2. Run bundle size report:

```bash
npm run perf:bundle-size
```

3. Start app:

```bash
npm run start -- --hostname 127.0.0.1 --port 3000
```

4. Run Lighthouse thresholds:

```bash
npm run perf:lighthouse
```

5. Build lab Web Vitals summary from Lighthouse reports:

```bash
npm run perf:web-vitals
```

Reports are written to `reports/performance/`.

---

## 5. CI Wiring Status

- [x] Executable script added: `scripts/perf/run-lighthouse.mjs`.
- [x] Thresholds aligned to current baseline and tracked in `scripts/perf/performance-thresholds.json`.
- [x] CI job uploads performance artifacts (`reports/performance`) in `.github/workflows/performance.yml`.
- [ ] Ownership and escalation policy for persistent threshold failures documented.
