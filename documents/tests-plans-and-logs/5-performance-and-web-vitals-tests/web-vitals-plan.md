# Web Vitals Plan - Lakira Frontend

This document defines how Lakira will capture and use real-user Web Vitals data.

References:

- `documents/documentation/performance-budget.md`
- `documents/tests-plans-and-logs/5-performance-and-web-vitals-tests/lighthouse-plan.md`

---

## 1. Current Status

- Real-user Web Vitals telemetry is not yet instrumented in this repo.
- Performance checks currently rely on local/CI build validation and planned Lighthouse runs.

---

## 2. Metrics in Scope

Core metrics:

- LCP
- CLS
- INP

Optional support metrics:

- FCP
- TTFB

Thresholds must follow `documents/documentation/performance-budget.md`.

---

## 3. Instrumentation Decision

Target implementation:

- Add `reportWebVitals` instrumentation in the Next.js app layer.
- Emit metric payloads to a dedicated ingestion endpoint (planned) or approved analytics provider.
- Include route/path context and environment marker (preview/staging/prod).

Data contract (minimum fields):

- metric name
- metric value
- page path
- timestamp
- environment

---

## 4. Rollout Phases

1. Phase 1 - capture only:
- Collect metrics without enforcing thresholds.

2. Phase 2 - visibility:
- Create dashboard/report for percentile tracking (p75 baseline).

3. Phase 3 - enforcement:
- Add alerting or CI/release checks for sustained regressions.

---

## 5. Exit Criteria

- [ ] Web Vitals emission path is implemented and tested.
- [ ] Data retention/reporting owner is assigned.
- [ ] Thresholds and alert policy are documented.
- [ ] Release checklist links to real telemetry evidence.

