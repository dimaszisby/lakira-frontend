## Fix: metric-detail-cache-stale-on-modal-close-20251130

### Overview
- Editing a metric or log via intercepting modal (e.g., /metrics/[id]/edit or /metrics/[id]/logs/[logId]) closed the overlay without revalidating the parent /metrics/[id] layout.
- Mobile log table cards (swipeable view) memoized solely by log.id and ignored updated fields, so edited values never re-rendered until a full page refresh.

### Impact
- Metric header, settings, tabs, and visualization relied on server-fetched context; users saw stale details until they manually reloaded.
- Logs list (desktop) eventually refreshed via React Query invalidation, but mobile cards continued to show outdated value/timestamp.

### Root Cause
| Symptom | Root Cause |
| --- | --- |
| Layout state never updated after closing metric/log edit modal | Modal dialog called router.back() without router.refresh(), so the App Router restored cached RSC tree |
| Mobile log cards stayed stale after edit | LogMobileCard was memoized on log.id only, so changes to logValue/loggedAt were ignored |

### Solution
1. Updated MetricFormDialog, MetricLogFormDialog, and MetricSettingsFormDialog to trigger router.back() followed by a microtask router.refresh(), guaranteeing the parent route re-fetches once the modal closes.
2. Added a data-visualizations cache helper and invalidated metric visualizations within log mutations to keep charts in sync.
3. Extended LogMobileCard memo comparison (log.id + logValue + loggedAt) so mobile UI re-renders on edits.

### Verification
- npm run dev -> edit metric/log -> closing modal now refreshes detail page automatically (confirmed no manual reload needed).
- Mobile logs view reflects edited value/timestamp immediately; React Query inspector shows viz/query invalidations firing.

### Follow-up
- Document intercepting-route patterns: every modal must refresh its owner layout after mutation.
- Add unit tests covering memoized components to ensure comparisons include all displayed fields.
