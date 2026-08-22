# Analytics Backend Overhaul Plan

## 1. Purpose & Scope

This plan translates the UX gaps described in `visualization-frontend-analysis.md` into concrete backend deliverables. It focuses on the `/analytics/dashboard` stack (queries, services, caching, schema) so the dashboard can display richer empty states, expose recovery controls, and stay synchronized with metric metadata.

## 2. Background

- Dashboard shows up to 12 metrics with 30d/1d defaults. When no samples fall into the requested window, cards collapse into a non-informative "No data" label.
- The frontend cannot distinguish whether a metric has never been logged, is stale, or simply falls outside the current range. Filters cannot be edited in-place, so recovery requires leaving the page.
- The backend only returns per-range stats and series data. No lifecycle metadata (first/last log) or pagination hints are available. ETag strategy can allow stale metadata to persist in client caches.

## 3. Goals & Success Criteria

1. **Context-rich payloads:** Add lifecycle metadata for each metric so FE can render differentiated empty states and recency cues.
2. **Guided recovery:** Surface range/bucket information and fallback indicators that enable inline filter adjustments.
3. **Resilient caching:** Align ETag and cache invalidation policy with metadata updates to avoid stale dashboards.
4. **Operational safety:** Keep queries performant (respect 400-bucket guardrails) and testable with deterministic fixtures.
5. **Communication-ready:** Provide sufficient documentation for data-contract changes to coordinate FE rollout.

Success is measured by:

- FE receiving new payload fields without extra round-trips.
- Empty metrics now accompanied by rationale (never logged, last activity date, fallback window) in QA builds.
- Cache invalidation triggers when metrics or settings change.

## 4. Gaps & Pain Points

| Gap                                        | Impact                                                   | Required Backend Work                                                       |
| ------------------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| No `lastLogAt`/`totalLogs` info            | FE cannot signal metric freshness                        | Aggregate lifecycle stats per metric within dashboard query                 |
| No fallback or actual range info           | FE cannot tell whether data is missing vs. auto-expanded | Return requested window and actual window per metric                        |
| Missing pagination metadata                | Users cannot see hidden metrics count                    | Compute `meta.totalMetrics` after filtering `showOnDashboard` & `is_active` |
| ETag tied only to payload rows             | Metadata changes stale for up to 5 minutes               | Incorporate metric + settings `updated_at` into ETag hash                   |
| 400-bucket guard prevents auto exploration | FE cannot offer "show last activity" experiences         | Design fallback query that stays within safeguards                          |

## 5. Proposed Backend Enhancements

### 5.1 Data Contract Additions (per metric)

- `lastLogAt: string | null` – ISO timestamp of the most recent log overall.
- `firstLogAt: string | null` – First known log for copy such as “Metric created on …”.
- `totalLogs: number` – Total persisted logs (not limited to window).
- `latestValue: number | null` – Value of the latest log plus `latestBucketStart` to seed FE tooltips.
- `requestedRange: { startISO: string; endISO: string; bucket: string }` – Echo back the inbound filters for clarity.
- `actualRange: { startISO: string; endISO: string; bucket: string }` – Mirrors fallback window when auto-expand occurs; equals requested range otherwise.
- `fallbackRangeUsed: boolean` – Signals FE to annotate charts.

### 5.2 Endpoint-Level Metadata

- `meta.totalMetrics` – Count of metrics eligible for dashboard (after `showOnDashboard/is_active` filters) even if not returned due to `limit`.
- `meta.fallbackMetrics` – Number of metrics where fallback was applied (helps FE message globally).
- `sync.etagSeed` – Hash of concatenated `metric.updated_at`, `metric_settings.updated_at`, `metric_visualization.updated_at` to guarantee invalidation when metadata changes.

### 5.3 Query Logic

1. **Primary fetch** – Existing aggregated query limited to requested window/bucket.
2. **Lifecycle aggregation** – Batched query per metric ID computing `min(timestamp)`, `max(timestamp)`, `count(*)`, and `max_by(value, timestamp)` for `latestValue`. Prefer a single SQL CTE rather than per-metric round-trips.
3. **Fallback selection** – When `series` is empty:
   - Compute `fallbackEnd = lastLogAt ?? now()` and `fallbackStart = max(fallbackEnd - guardRange, fallbackEnd - 180d)`.
   - Respect 400-bucket guard by coarsening bucket (e.g., escalate 1d → 7d) if needed.
   - Populate `actualRange` with fallback window and refill `series` using same aggregation pipeline.
   - Set `fallbackRangeUsed=true` and capture `fallbackStrategy` (optional string for observability).

### 5.4 Caching Strategy

- Update ETag computation: `etag = hash(resultChecksum + metadataVersionChecksum)`.
- Expose `Cache-Control: max-age=60` aligned with FE `staleTime`. Document that FE should rely on ETag to avoid stale metadata.
- Recompute ETag whenever lifecycle aggregations change; ensure fallback queries also influence checksum so FE refreshes when metrics leave/enter fallback state.

## 6. Implementation Roadmap

| Phase                            | Timeline  | Key Tasks                                                                                                                                                          | Owner                    |
| -------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Phase 0 – Alignment              | Week 0    | Confirm FE payload contract, update OpenAPI schema draft, document copy needs                                                                                      | Backend + Frontend leads |
| Phase 1 – Schema & SQL prep      | Week 1    | Extend `visualization.dashboard.sql.ts` to produce lifecycle metadata CTEs; write migrations if new indices needed (e.g., on `metric_logs(metric_id, created_at)`) | Data Platform            |
| Phase 2 – Service updates        | Week 2    | Update `getDashboardVisualization.ts` to join lifecycle CTE, build fallback range logic, assemble new DTO                                                          | Analytics Services       |
| Phase 3 – API contract & caching | Week 3    | Update OpenAPI spec, adjust ETag generator (likely `src/services/metric.service.ts` or middleware), add pagination metadata                                        | Platform Infra           |
| Phase 4 – Testing & rollout      | Weeks 4-5 | Add integration tests covering empty metrics, fallback, ETag invalidation; release behind toggled version (`?v=2`) for FE to consume                               | QA + Release             |

## 7. Testing Strategy

- **Unit:** Cover helper functions that determine fallback buckets, range coarsening, and metadata serialization.
- **Integration:** Add Jest/TS tests hitting a real DB fixture to assert: (a) lifecycle metadata correctness; (b) fallback triggered when range empty; (c) ETag changes when metric metadata updates.
- **Contract:** Generate updated OpenAPI docs and use Schemathesis/Postman tests to ensure FE clients can parse the new structures.
- **Performance:** Run EXPLAIN ANALYZE on lifecycle query to keep p95 latency within current SLA (target < 300ms per request at 12 metrics).

## 8. Operational & Observability Considerations

- Emit structured logs whenever fallback is applied (`metricId`, requested vs. actual range, bucket adjustments) for future tuning.
- Expose a Prometheus counter `dashboard_fallback_total` to quantify frequency.
- Create dashboard alerts if fallback rate spikes (indicating users routinely exceed default ranges).
- Update runbooks with new troubleshooting steps (e.g., verifying lifecycle CTE results).

## 9. Risks & Mitigations

| Risk                                     | Mitigation                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Lifecycle aggregates slow query          | Pre-compute partial aggregates or add covering indexes (`metric_logs(metric_id, bucket_start)`).                  |
| Fallback overrides surprise users        | Include both ranges in API so FE can visibly label fallback state and provide opt-out query flag for power users. |
| Larger payload size                      | Keep lifecycle metadata concise (< 200 bytes per metric) and gzip responses.                                      |
| Cache churn from frequent metadata edits | Keep ETag seed stable by rounding timestamps to seconds and avoiding volatile fields.                             |

## 10. Next Actions

1. Share this plan with frontend counterpart to validate field names and UX assumptions.
2. Produce OpenAPI diff + sample payload with new metadata fields.
3. Create tickets for Phases 1-4 with estimates and assign owners.
4. Schedule performance benchmark once lifecycle query implementation is ready.
