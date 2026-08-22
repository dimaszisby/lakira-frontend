# Analytics Backend Overhaul Checklist

## 1. Overview

Use this checklist to drive the backend implementation of the dashboard overhaul. Each section mirrors the phases in `analytics-backend-overhaul-plan.md` and should be reviewed during sprint planning and release readiness.

## 2. Alignment & Contract Prep

- [ ] Confirm payload additions (`lastLogAt`, `firstLogAt`, `totalLogs`, `latestValue`, `actualRange`, `requestedRange`, `fallbackRangeUsed`).
- [ ] Produce shared sample response + OpenAPI snippet for `/analytics/dashboard`.
- [ ] Agree on feature behind version flag or media type (e.g., `?v=2`).
- [ ] Finalize copy requirements for FE-empty states and document in UX brief.

## 3. Schema, SQL & Performance Foundations

- [ ] Audit existing indices on `metric_logs` and add covering index for `(metric_id, bucket_start)` if missing.
- [ ] Extend `visualization.dashboard.sql.ts` with lifecycle CTE (min/max timestamps, count, latest value).
- [ ] Introduce fallback range computation helpers ensuring 400-bucket guard compliance.
- [ ] Run `EXPLAIN ANALYZE` for lifecycle query using representative dataset and capture baseline latency.

## 4. Service & Application Layer

- [ ] Update `getDashboardVisualization.ts` to hydrate new metadata fields and fallback logic.
- [ ] Ensure DTO serialization includes `requestedRange` and `actualRange` objects per metric.
- [ ] Implement pagination metadata (`meta.totalMetrics`, `meta.fallbackMetrics`).
- [ ] Wire observability hooks (structured logs for fallback events).

## 5. Caching & ETag Strategy

- [ ] Update ETag generator to hash metric + settings `updated_at` values alongside payload checksum.
- [ ] Align `Cache-Control` headers with FE caching expectations (max-age/stale-while-revalidate if applicable).
- [ ] Validate ETag/304 behavior via integration tests and manual curl checks.

## 6. Testing & Validation

- [ ] Add unit tests for fallback bucket/range selection utilities.
- [ ] Add integration tests covering: lifecycle metadata presence, fallback path, pagination metadata, ETag change on metadata update.
- [ ] Regenerate OpenAPI docs and run contract tests (Schemathesis/Postman) against the updated schema.

## 7. Release Readiness

- [ ] Document rollout plan, including feature flag toggles and monitoring dashboards.
- [ ] Update runbooks with troubleshooting guidance for fallback signals and cache issues.
- [ ] Schedule coordinated QA session with frontend to verify empty-state scenarios.
- [ ] Announce change in release notes and internal changelog once production deploy is complete.
