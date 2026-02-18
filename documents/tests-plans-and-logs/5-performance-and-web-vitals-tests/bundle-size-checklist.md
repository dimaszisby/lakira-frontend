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

---

## 3. CI Direction (Planned)

- [ ] Add automated bundle-size report script (planned, e.g. `scripts/bundle-size-report.mjs`).
- [ ] Upload bundle report artifact in CI.
- [ ] Define fail conditions for major regressions.

---

## 4. Release Sign-off

Before release:

- [ ] Build size changes are reviewed against performance budget.
- [ ] Regressions have mitigation plan or documented exception.
- [ ] Lighthouse and Web Vitals evidence is attached where applicable.

