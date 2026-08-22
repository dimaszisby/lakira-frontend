# Performance Budget – Lakira Frontend

This document defines Lakira’s **performance budgets**: target limits for page weight, Web Vitals, and related metrics.

These budgets guide:

- Development decisions (dependencies, lazy loading, code splitting).
- Automated checks:
  - [Lighthouse Plan](../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/lighthouse-plan.md)
  - [Web Vitals Plan](../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/web-vitals-plan.md)
  - [Bundle Size Checklist](../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/bundle-size-checklist.md)
- Release gates:
  - [Performance Release Checklist](../how-to/releases/performance-release-checklist.md)

> Budgets are **targets**, not guarantees. Exceeding a budget should trigger discussion and explicit trade-offs, not be silently accepted.

---

## 1. Target Devices & Network Assumptions

We design for:

- **Primary device:** mid-range mobile and laptop.
- **Network:** 4G / “Fast 3G” conditions.

Budget values assume:

- Users may be on variable mobile networks.
- Lakira is a **productivity tool**, so responsiveness and perceived performance matter a lot.

---

## 2. Web Vitals Budgets (Core Web Vitals)

Budgets are aligned with Core Web Vitals “Good” thresholds, with slight internal tightening where we can.

### 2.1 Page-Level Targets

For **key routes**:

- `/` (landing, if present)
- `/login`
- `/app/dashboard`
- `/app/metrics`
- `/app/metrics/[id]`

**LCP (Largest Contentful Paint)**

- Target p75: **≤ 2.5s**
- Soft max: **≤ 3.0s** on test devices

**CLS (Cumulative Layout Shift)**

- Target p75: **≤ 0.1**
- Hard max: **≤ 0.15**

**INP / FID (Interaction Responsiveness)**

- Target p75: **≤ 200ms**
- Soft max: **≤ 300ms**

If any core route exceeds these for p75 in field data or repeatedly in lab:

- Treat as a performance regression needing investigation.

---

## 3. Bundle Size & JS Budgets

Numbers below are **guidelines** for production builds (approx values before gzip).  
They should be tuned once you have real build stats.

### 3.1 Per-Route JavaScript

Initial route JS (excluding subsequent lazy loads):

- **Main runtime / app bundle:**
  - Target: ≤ **120 kB**
- **Dashboard route chunk:**
  - Target: ≤ **180–200 kB**
- **Metrics library route chunk:**
  - Target: ≤ **180–220 kB** (charts, filters, etc.)
- **Metric detail route chunk:**
  - Target: ≤ **200–250 kB** (charts + logs)

These are starting points. As the app grows:

- Avoid **unbounded growth**.
- For any route > ~250–300 kB:
  - Require justification and/or move heavy features to lazy-loaded chunks.

### 3.2 Total JS on First Load

On first load of a core app page (e.g. dashboard):

- Total JS to parse/execute (app + vendor + route) should ideally be:
  - Target: ≤ **300 kB** (gzipped)
  - Soft max: ≤ **400 kB** (gzipped) with explicit justification

If we cross soft max:

- We should:
  - Identify heavy deps,
  - Consider code splitting, lazy loading, or alternatives.

---

## 4. Images & Assets

### 4.1 Images

- No single image on core flows should exceed **200–300 kB** (optimized, responsive sources).
- Avoid:
  - Full-resolution photo assets on dashboard / main flows.
- Use:
  - Appropriate responsive sizes via `next/image` or equivalent.

### 4.2 Fonts

- Limit to:
  - 1 primary text family + 1 display family (already in design).
  - Only necessary weights (e.g. 300, 400, 500, 600, 700 where justified).

- Budget:
  - Total custom font payload ideally ≤ **150 kB** (compressed), loaded with `display=swap`.

---

## 5. Network Requests

On initial load of core pages (dashboard, metrics):

- Target:
  - **≤ 25** total requests (HTML, JS, CSS, XHR, fonts, images) under normal conditions.
- Focus on:
  - Bundling/combining where appropriate,
  - Avoiding many tiny network calls on first load.

For API calls:

- Avoid patterns where:
  - 1 page = 1 request per metric / record (N+1 over network).
- Prefer:
  - Aggregated endpoints for dashboard/summary views.

---

## 6. Lighthouse Score Budgets

On target routes, measured under consistent lab conditions:

- **Performance score**
  - Target ≥ **80** (desktop-like lab profile)
  - Target ≥ **70** (mobile-like lab profile)

- **Accessibility score**
  - Target ≥ **90**

- **Best Practices**
  - Target ≥ **90**

These are enforced via:

- [Lighthouse Plan](../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/lighthouse-plan.md)
- [Performance Release Checklist](../how-to/releases/performance-release-checklist.md)

---

## 7. Field Web Vitals Budgets

From real-user telemetry (see [Web Vitals Plan](../internal/initiatives/tests-overhaul/5-performance-and-web-vitals-tests/web-vitals-plan.md)):

- For core routes:
  - **p75 LCP**:
    - Target: ≤ 2.5s
  - **p75 CLS**:
    - Target: ≤ 0.1
  - **p75 INP/FID**:
    - Target: ≤ 200ms

If a route is consistently “Needs improvement” or “Poor”:

- Create an issue and track improvements across releases.

---

## 8. When Budgets Are Exceeded

If any budget is exceeded (bundle size, Lighthouse, Web Vitals):

- Do **not** silently normalize the new, slower state.
- Instead:
  - Investigate root cause (new dependency, layout change, etc.).
  - Decide one of:
    1. **Fix now** – refactor, split, or optimize.
    2. **Accept with justification** – document trade-off in PR + issue.
    3. **Adjust budget** – only if app scope changed significantly and we have clear rationale.

Any permanent budget change should:

- Be recorded in this document.
- Be reflected in CI configs and checklists.

---

## 9. Maintenance

- Review budgets at least **once per quarter** or after major features:
  - Compare actual build stats and Web Vitals with these numbers.
  - Tighten budgets where realistic; loosen only with clear rationale.
- Keep `performance-budget.md` in sync with:
  - CI threshold configs,
  - Lighthouse scripts,
  - Bundle size checks.
