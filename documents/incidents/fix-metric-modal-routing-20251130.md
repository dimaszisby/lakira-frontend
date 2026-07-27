# Fix: Metric Modal Routing & Data Fetch Regression (2025-11-30)

## Overview
The metric detail experience introduced intercepting routes for edit flows (metrics, categories, logs). Three regressions surfaced:

1. **Metric detail header edit modal** crashed with `Invalid interception route` because the detail layout lacked a parallel `@modal` slot.
2. **Metric category detail header edit modal** navigated to `/edit` without rendering a modal for the same reason.
3. **Metric log edit modal** rendered but the API call failed with `metricId is required as a query parameter` since the server now requires the metric context for every log detail fetch.

This document records the debugging steps, root causes, and permanent fixes for future reference.

## Impact
- Opening metric or category edit dialogs from their respective detail headers threw 500s in the dev server and left the page unchanged for end users.
- Opening a metric log edit dialog surfaced repeated API errors, leaving the modal empty and logging noisy console errors in production builds.

## Root Cause Analysis
| Symptom | Root Cause |
| --- | --- |
| `Invalid interception route` error when clicking the metric header pencil button | The detail layout (`src/app/(app)/metrics/[metricId]/layout.tsx`) only rendered `{children}` and never exposed the nested `@modal` slot, so the router attempted to reuse the list-level intercepting route. Next.js generated an invalid interception path (`/(.)(.)(.)...`) and returned HTTP 500. |
| Category edit modal never appeared | The category detail layout mirrored the same structure (missing `{modal}`), so the parallel route tree could not render. |
| Metric log edit API call failed with `metricId is required as a query parameter` | Backend contract changed to require `metricId` in every log-detail query. The app kept calling `GET /metric-logs/{id}` without the `metricId` query param, causing the API wrapper to throw during `unwrap`. |

## Resolution Details
1. **Metric Detail Layout Update** (`src/app/(app)/metrics/[metricId]/layout.tsx`)
   - Accepts the `modal` prop and renders it after the shared shell, allowing intercepting routes such as `/metrics/[id]/@modal/(.)edit` to mount.
   - Added `@modal/default.tsx` and re-exported page for intercept routes so Next.js has a stable slot.

2. **Metric Category Layout Update** (`src/app/(app)/metric-categories/[categoryId]/layout.tsx`)
   - Mirrors the same fix: accepts `modal`, renders it beneath the provider, and adds required default + intercepting files.

3. **Metric Log Detail API Contract Fix**
   - `getMetricLogDetail` now requires `{ logId, metricId }` and forwards `metricId` via Axios `params`. (`src/features/metric-logs/api.ts`)
   - The server component route (`src/app/(app)/metrics/[metricId]/logs/[logId]/page.tsx`) passes both IDs so the modal can hydrate correctly.

## Verification
- `npm run dev` (Next 16.0.3) then:
  1. Navigate to `/metrics/:id` and click the header pencil → modal appears, no 500s.
  2. Navigate to `/metric-categories/:id` and click the header pencil → modal appears over the detail page.
  3. Navigate to `/metrics/:id/logs` and open any log edit link → modal loads filled form and network tab shows `GET /metric-logs/:logId?metricId=...` returning 200.

## Follow-Up / Preventive Actions
- Add unit/contract tests for API clients where request signatures include required query params.
- Document the layout requirement for every parallel route when introducing nested intercepting modals.
- Consider integration tests covering modal routing to catch missing slot regressions earlier.
