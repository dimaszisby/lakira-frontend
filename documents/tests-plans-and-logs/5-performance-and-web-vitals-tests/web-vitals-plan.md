---

### `web-vitals-plan.md`

```md
# Web Vitals Plan – Lakira Frontend

This document defines how Lakira tracks **Core Web Vitals in the real world** (RUM – Real User Monitoring) and how that data is used.

It complements:

- [Performance Budget](../../documentation/performance-budget.md)
- [Lighthouse Plan](./lighthouse-plan.md)
- [Performance Release Checklist](../../checklists/performance-release-checklist.md)

Lighthouse is lab; **Web Vitals telemetry is field**.

---

## 1. Goals

Web Vitals telemetry for Lakira aims to:

1. Measure real users’ experience for key metrics:
   - LCP (Largest Contentful Paint)
   - FID/INP (First Input Delay / Interaction to Next Paint)
   - CLS (Cumulative Layout Shift)
   - Optional: TTFB, FCP, custom metrics.
2. Detect regressions in production that lab tests might miss.
3. Provide actionable data to:
   - prioritize performance work,
   - validate the impact of performance improvements.

---

## 2. Metrics in Scope

We track at minimum:

- **LCP** – how quickly main content is visible.
- **CLS** – how stable the layout is.
- **FID/INP** – how responsive the page is to user input.

Optionally:

- **FCP** – First Contentful Paint.
- **TTFB** – Time to First Byte.

Thresholds (aligned with `performance-budget.md` and Core Web Vitals guidelines):

- LCP:
  - Good ≤ 2.5s, Needs improvement 2.5–4.0s, Poor > 4.0s.
- CLS:
  - Good ≤ 0.1, Needs improvement 0.1–0.25, Poor > 0.25.
- FID/INP:
