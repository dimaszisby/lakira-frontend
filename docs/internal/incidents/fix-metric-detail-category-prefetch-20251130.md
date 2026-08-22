# Metric Detail & Category Prefetch Failures – Async Params & Auth Propagation

- **Date detected:** 2025-11-30
- **Owner:** Codex assist
- **Related routes:** `/metrics/[metricId]`, `/metrics/[metricId]/logs/*`, `/metrics/[metricId]/edit`, `/metric-categories/[categoryId]`, `/metric-categories/[categoryId]/edit`, `/metric-categories/[categoryId]/metrics/[metricId]`
- **Related docs:** `docs/internal/incidents/fix-searchParams-and-cookies-20251130.md`

---

## 1. Summary

Migration to Next.js 16 introduced two regressions that blocked the Metric Detail and Metric Category detail flows:

1. **Async `params` contract** – All dynamic server components continued to read `params.metricId` synchronously even though Next 16 now provides `params` as a Promise. The framework threw `Route "...[metricId]" used params.metricId. params is a Promise...`, falling back to runtime failures and generating `/metrics/undefined` API calls.
2. **Missing auth headers during SSR prefetch** – New server routes (metric detail, category detail, logs, and dashboard) fetch protected data via the `/api/proxy`. Without copying the incoming cookies into each server-side axios request, the proxy rejected the call with `401 Unauthorized`, causing blank states and 404 fallbacks.
3. **Client-only hooks in server components** – `MetricCategoryHeaderSection` used `useRouter` but remained an RSC, triggering build errors during category navigation.

---

## 2. Impact

- **Users:** Every authenticated user hitting a metric detail URL (overview, logs, settings, edit) or category detail page.
- **Severity:** Critical. Detail pages returned 500/404, API logs showed `/metrics/undefined`, and the dashboard/category layouts could not hydrate.
- **Frequency:** 100% once the router changes landed (Nov 30).
- **Error surface:** Turbopack console, browser console (`AxiosError 401`), and screenshot of the 404 fallback.

---

## 3. Timeline

| Time (local) | Event |
|--------------|-------|
| 10:05 | Navigated to `/metrics/e315...`; server threw `params is a Promise` error. |
| 10:15 | Noted `/api/proxy/metrics/undefined` 401 responses and 404 fallback page. |
| 10:40 | Added async `params` handling + cookie forwarding helper; confirmed `/metrics` renders locally. |
| 11:05 | Hit `/metric-categories/fb101c...` and saw build error (`useRouter` in server component). |
| 11:15 | Marked `MetricCategoryHeaderSection` as `"use client"` and reloaded successfully. |

---

## 4. Root Causes

### 4.1 Async `params` enforcement
- **What changed:** Next 16 wraps `params` in a Promise to align streaming semantics.
- **Where:** `src/app/(app)/metrics/[metricId]/layout.tsx`, `/logs/*.tsx`, `/edit/page.tsx`, category counterparts.
- **Failure:** Accessing `params.metricId` synchronously triggered the runtime guard and prevented data fetching.

### 4.2 Server fetch without cookies
- **What changed:** Axios moved behind `/api/proxy` which requires `lakira_token`.
- **Where:** Metric detail layout, metric edit, log detail, category layout/edit, dashboard prefetch.
- **Failure:** Server fetches did not forward cookies, so proxy refused with 401, cascading to `notFound()` and blank charts.

### 4.3 Client hook in server component
- **What changed:** `MetricCategoryHeaderSection` relocated into the app router but kept `useRouter`.
- **Failure:** Without `"use client"`, Next flagged the file and blocked the route compilation.

---

## 5. Resolution

1. **Unwrap `params` everywhere**
   - Updated every dynamic route (metric detail/edit/logs, category detail/edit/metric edit, log modals) to type `params` as `Promise<...>` and await before use.
2. **Share auth headers for SSR fetches**
   - Introduced `getServerAuthHeaders` (`src/services/api/serverHeaders.ts`) that reads cookies via `next/headers` and constructs a `Cookie` header.
   - Extended `RequestOpts` to include `headers`, plumbed through `metric.api.ts`, `metric-logs/api.ts`, `metric-categories/api.ts` (GET/POST/PUT/DELETE), and used the helper when prefetching in layouts/pages.
   - Dashboard page now reuses the helper instead of duplicating cookie logic.
3. **Mark client-only component**
   - Added `"use client"` directive to `MetricCategoryHeaderSection` so `useRouter` works.

---

## 6. Verification

- Reloaded `/metrics/e315...` authenticated: layout fetches succeed (no more `/metrics/undefined` or 401).
- Navigated to metric logs/settings/edit routes: SSR requests succeed, pages render.
- Opened `/metric-categories/fb101c...`: header renders without build error; edit/back buttons work.
- Confirmed dashboard prefetch still hydrates (no 401 spam).

---

## 7. Follow-ups / Prevention

1. **Lint rule / helper** – Create an ESLint rule or shared helper to unwrap Next 16 `params`/`searchParams` across the repo to prevent regressions.
2. **Server fetch utility** – Expand `getServerAuthHeaders` (or a wrapper around axios) to automatically attach cookies for all server-side API consumers.
3. **Component boundary checks** – Audit shared components for hooks (`useRouter`, `useState`, etc.) and ensure `"use client"` is set where required.

---

## 8. References

- Next.js error logs captured on Nov 30 (Turbopack output, terminal snippet).
- Updated files: `src/app/(app)/metrics/[metricId]/layout.tsx`, `.../logs/*.tsx`, `.../edit/page.tsx`, category counterpart files, `src/services/api/serverHeaders.ts`, `src/features/metrics/metric.api.ts`, `src/features/metric-categories/api.ts`, `src/features/metric-logs/api.ts`, `docs/internal/incidents/fix-searchParams-and-cookies-20251130.md`.
