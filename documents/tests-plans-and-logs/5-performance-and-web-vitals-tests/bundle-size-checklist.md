# Bundle Size Checklist - Lakira Frontend

Use this checklist to control bundle growth during feature work.

References:

- `documents/documentation/performance-budget.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/lighthouse-plan.md`

---

## 0. Preconditions

- [ ] Production build runs successfully (`npm run build`).
- [ ] Build output is reviewed for route/chunk size deltas.
- [ ] Any large dependency addition includes explicit rationale.

---

## 1. Dependency Review

When adding or changing a dependency:

- [ ] Confirm no lighter native/existing alternative is suitable.
- [ ] Prefer tree-shakeable imports.
- [ ] Avoid namespace imports when selective imports are possible.
- [ ] For heavy UI/chart packages, evaluate lazy loading.

---

## 2. Build Review Procedure

1. Run build:

```bash
npm run build
```

2. Review route table and any significant chunk growth.

3. Record notable deltas in PR notes if budget impact is meaningful.

4. Run automated bundle report:

```bash
npm run perf:bundle-size
```

5. Review output report:

- `reports/performance/bundle-size-report.json`

---

## 3. CI Direction

- [x] Automated bundle-size report script added (`scripts/perf/bundle-size-report.mjs`).
- [x] Bundle report uploaded in scheduled CI workflow (`.github/workflows/performance.yml`).
- [x] Fail conditions defined via thresholds in `scripts/perf/performance-thresholds.json`.

---

## 4. Release Sign-off

Before release:

- [ ] Build size changes are reviewed against performance budget.
- [ ] Regressions have mitigation plan or documented exception.
- [ ] Lighthouse and Web Vitals evidence is attached where applicable.
