# Performance Release Checklist – Lakira Frontend

Use this checklist before a **release** (or major feature launch) to ensure Lakira stays within agreed performance budgets.

This checklist is backed by:

- [Performance Budget](../../reference/performance-budget.md)
- [Lighthouse Plan](../../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/lighthouse-plan.md)
- [Web Vitals Plan](../../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/web-vitals-plan.md)
- [Bundle Size Checklist](../../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/bundle-size-checklist.md)

---

## 0. Pre-conditions

Before running through this checklist:

- [ ] The release build is **ready** (same config as production).
- [ ] The app is deployed to a **staging/test environment** similar to production.
  - <!-- SPECIAL NOTE: Add URL here, e.g. `https://lakira-staging.example.com`. -->
- [ ] CI has already passed:
  - [ ] Static checks
  - [ ] Unit + integration tests
  - [ ] E2E smoke suite

This checklist focuses specifically on performance.

---

## 1. Lighthouse / Page-Level Performance

Run Lighthouse (or equivalent lab tool) against the **staging build** using the procedure in `lighthouse-plan.md`.

### 1.1 Pages in scope

At minimum:

- [ ] Landing / marketing page (if any) → `/`
- [ ] Auth page → `/login` (or equivalent)
- [ ] Dashboard → `/app/dashboard`
- [ ] At least one **data-heavy page**:
  - e.g. metrics library, metric detail with chart + logs

### 1.2 Score thresholds

For each page above:

- [ ] **Performance score** meets or exceeds target in `performance-budget.md`:
  - e.g. `LCP`, `FID/INP`, `CLS` budgets.
- [ ] **Best Practices** and **SEO** scores are not critically low (if applicable).
- [ ] No new **critical Lighthouse warnings** compared to previous release, especially:
  - [ ] “Avoid enormous network payloads”
  - [ ] “Reduce JavaScript execution time”
  - [ ] “Eliminate render-blocking resources”

If a page significantly regresses:

- [ ] Regression is investigated and either:
  - [ ] Fixed before release, or
  - [ ] Explicitly documented with justification and a follow-up task.

---

## 2. Bundle Size & JS Execution

Follow `bundle-size-checklist.md` and your build tooling output.

- [ ] Analyze bundle size for:
  - [ ] main app bundle,
  - [ ] vendor bundle,
  - [ ] major route chunks (dashboard, metrics, etc.).

Check against budgets in `performance-budget.md`:

- [ ] No bundle exceeds its configured budget.
- [ ] No **unexpected large dependency** was added (e.g. heavy chart lib!) without justification.
- [ ] Code-splitting is applied to:
  - [ ] rarely used pages,
  - [ ] heavy components (e.g. charts, complex editors).

If any bundle grew significantly since last release:

- [ ] Growth is understood (new feature, necessary dep).
- [ ] Opportunities to lazy-load or split have been considered.

---

## 3. Core Web Vitals (Lab / Runtime)

Check Web Vitals as per `web-vitals-plan.md`.

### 3.1 Lab checks

From Lighthouse or WebPageTest/Chrome DevTools:

- [ ] **LCP** (Largest Contentful Paint) within target (e.g. `< 2.5s` on test profile).
- [ ] **INP/FID** within target.
- [ ] **CLS** (Cumulative Layout Shift) below threshold (no big jumps).

### 3.2 Runtime (if telemetry is configured)

If Web Vitals reporting to a backend is implemented:

- [ ] No obvious regressions in recent staging/production samples.
- [ ] Any known problematic pages are tracked in issues with mitigation plans.

<!-- SPECIAL NOTE: Once Web Vitals telemetry is wired, document the dashboard URL or tool used here. -->

---

## 4. Images, Assets & Fonts

- [ ] All large images use:
  - [ ] `next/image` (or equivalent) with correct `sizes` and `loading` settings.
  - [ ] No unoptimized full-res images on core pages.

- [ ] Critical icons and small graphics:
  - [ ] Delivered via SVG or icon font, not huge PNG/JPEGs.

- [ ] Fonts:
  - [ ] Only necessary font weights/styles are loaded.
  - [ ] `display=swap` (or similar) is configured to avoid FOIT.
  - [ ] Large unused font variants are not imported.

- [ ] No obvious **duplicate asset imports** across feature modules.

---

## 5. Network & API Performance

Check the most important flows in DevTools or via test scripts:

- [ ] Number of network requests on first load:
  - [ ] Within reasonable limits (no “waterfall explosion”).
- [ ] No obvious **N+1** patterns in frontend calls:
  - e.g. not firing one request per metric when a batched/aggregated endpoint exists.

- [ ] For dashboard and data-heavy pages:
  - [ ] React Query / caching strategy avoids unnecessary refetching.
  - [ ] Polling (if used) has sensible intervals and stops when component unmounts.

- [ ] Errors:
  - [ ] Error responses are not retried excessively (no infinite loops).
  - [ ] Failing endpoints don’t spam logs or toast notifications.

---

## 6. React-Specific Performance

- [ ] Avoid obvious **re-render storms**:
  - [ ] Key lists are memoized appropriately (`React.memo`, `useMemo`, etc. where justified).
  - [ ] Jotai/other state atoms are scoped sensibly; no single atom causes huge tree re-renders.

- [ ] List and table rendering:
  - [ ] Use `key` props correctly (stable and unique).
  - [ ] For very large lists, consider windowing/virtualization (if performance budget requires it).

- [ ] Expensive operations:
  - [ ] Heavy computations are memoized or moved off the main render path.
  - [ ] Charts or visualizations aren’t re-rendering unnecessarily on unrelated state changes.

---

## 7. Caching, CDN & Headers (High-Level FE Concerns)

Some of this is infra/backend, but FE should sanity-check behaviour:

- [ ] Static assets (JS, CSS, fonts) are served with:
  - [ ] long cache lifetimes,
  - [ ] content hashing (e.g. `*.hash.js`).

- [ ] HTML documents:
  - [ ] not cached aggressively in a way that breaks auth/session flows.

- [ ] API responses that are read-only (e.g., metric templates, categories) use:
  - [ ] appropriate caching headers where applicable (if coordinated with backend).

You don’t need to own infra config, but **large misconfigurations** are caught here.

---

## 8. UX & Perceived Performance

Beyond metrics, confirm perceived performance on key flows:

- [ ] Core pages show **skeletons / loading states** instead of blank screens.
- [ ] Big actions (create metric, log metric, save settings):
  - [ ] Show immediate UI feedback (button loading state or toast).
- [ ] Transitions are:
  - [ ] Responsive (no frozen UI after click),
  - [ ] Not excessively animated on low-end devices.

If you have a low-end test device or throttled profile, sanity-check:

- [ ] Basic interactions remain smooth enough on:
  - [ ] Dashboard.
  - [ ] Metric list.
  - [ ] Logging form.

---

## 9. CI Integration & Thresholds

- [ ] CI runs **Lighthouse and/or performance tests** using the config in:
  - `../tests-plans-and-logs/5-performance-and-web-vitals-tests/lighthouse-plan.md`

- [ ] Thresholds for scores and/or budgets are:
  - [ ] Up to date in scripts/config (not stale from old versions).
  - [ ] Not weakened without explicit, documented justification.

- [ ] CI is currently **passing** performance checks for:
  - [ ] main branch,
  - [ ] release candidate commit(s).

If CI perf checks are temporarily disabled:

- [ ] Reason and duration are documented.
- [ ] A follow-up task exists to re-enable and fix issues.

---

## 10. Documentation & Known Issues

Before release, ensure:

- [ ] Any **known performance issues** are:
  - [ ] Documented (e.g. in `performance-budget.md` or issue tracker),
  - [ ] Classified by severity (must-fix vs can-defer),
  - [ ] Linked to specific PRs or areas of the code.

- [ ] `performance-budget.md` is still aligned with reality:
  - [ ] If the app has grown significantly and budgets were adjusted, the doc reflects that.
  - [ ] If budgets are repeatedly exceeded, revisit the strategy rather than normalizing slow behaviour.

---

##
