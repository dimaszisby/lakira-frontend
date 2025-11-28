# Lighthouse Plan – Lakira Frontend

This document defines **how** we run Lighthouse for Lakira and **what we enforce**.

It supports:

- [Performance Budget](../../documentation/performance-budget.md)
- [Performance Release Checklist](../../checklists/performance-release-checklist.md)
- [Bundle Size Checklist](./bundle-size-checklist.md)

Lighthouse is used as a **lab tool** to measure performance and quality of key pages in a controlled environment.

---

## 1. Goals

Lighthouse is used to:

1. Track **Core Web Vitals proxies** (LCP, CLS, INP/FID) and performance scores.
2. Detect regressions in:
   - page load performance,
   - accessibility,
   - best practices.
3. Provide a **repeatable, automatable** check in CI and pre-release.

Lighthouse is **not** used as an exhaustive test of all pages, but as a guardrail on **representative key screens**.

---

## 2. Tools & Environment

### 2.1 Tooling

We use:

- Lighthouse CLI (via Node) or
- Lighthouse CI (if configured)

<!-- SPECIAL NOTE: Once chosen, document the actual package + version and config file path, e.g.:
     - `lighthouse` via `npm` in `devDependencies`
     - `lighthouserc.json` or `lighthouse.config.cjs`. -->

### 2.2 Test Environment

Lighthouse must run against a **production-like build**:

- Staging or test deployment, built with:
  - same Next.js config as production,
  - minified and optimized bundles.

Typical base URL:

- <!-- SPECIAL NOTE: Fill in actual staging/test URL, e.g. `https://lakira-staging.example.com`. -->

For local runs, we can also use:

- `next build && next start`
