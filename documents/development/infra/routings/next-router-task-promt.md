You are an expert Next.js + TypeScript frontend architect embedded in this VSCode workspace.

Project context:

- App: Lakira – a versatile tracking app for custom metrics, metric categories, metric logs, and metric settings.
- Frontend: Next.js App Router, React, TypeScript, TanStack Query, Jotai, Tailwind.
- Backend: Express + PostgreSQL with REST APIs already wired into typed API clients and React Query hooks.
- The API contracts, React Query hooks, and caching strategies are already implemented and working for:
  - Auth (login, register, profile)
  - Metrics
  - Metric Categories
  - Metric Logs
  - Metric Settings
  - Analytics (Dashboard or Data Visualizations)
- I now want to standardize and fully implement **Next.js routing/navigation** for all existing pages and features.

Your task:

1. **Scan the codebase** for:
   - Next.js App Router structure under `src/app`.
   - Existing usage of `next/navigation` (e.g., `useRouter`, `usePathname`, `useSearchParams`).
   - Feature-level folders like `src/features/metrics`, `src/features/metric-categories`, `src/features/metric-logs`, `src/features/metric-settings`, `src/features/auth`, `src/features/data-visualizations`etc.
   - Existing navigation patterns (e.g., how we link from lists to detail pages, from dashboard to other pages).

2. Based on that, design a **Next Router implementation plan** that:
   - Aligns with App Router best practices.
   - Works well with our existing hooks and API contracts.
   - Is production-grade and portfolio-worthy (clear, systematic, and realistic to implement).

3. Create a **Markdown document** called `docs/routing/next-router-plan.md` with the following structure:

   ```md
   # Next.js Router Implementation Plan

   ## 1. Scope

   - Features covered:
     - Auth (login/register/profile)
     - Dashboard
     - Metric Library (list + create + edit + detail)
     - Metric Category Library
     - Metric Logs (per metric)
     - Metric Settings (per metric)

   ## 2. Routing Principles and Conventions

   - App Router usage:
     - Use `src/app/(app)/...` for authenticated sections.
     - Use `src/app/(public)/...` or similar for unauthenticated pages (e.g., login/register).
   - Dynamic segments:
     - `/metrics/[metricId]` for metric detail.
     - `/metrics/[metricId]/logs` for logs.
     - `/metrics/[metricId]/settings` for settings.
   - Query params conventions:
     - `?view=...` for alternate views (e.g., chart/list).
     - `?range=7d|30d|custom` for time range.
   - Navigation utilities:
     - Prefer `useRouter().push` / `router.replace` in client components.
     - Centralize route builders where appropriate (e.g., a `routes.ts` helper).

   ## 3. Current Route Inventory and Gaps

   - Table of existing routes vs desired routes, for example:

   | Feature           | Path example                      | Type    | Status          | Notes |
   | ----------------- | --------------------------------- | ------- | --------------- | ----- |
   | Auth Login        | `/login`                          | Page    | Exists / TBD    | ...   |
   | Dashboard         | `/dashboard`                      | Page    | Exists / TBD    | ...   |
   | Metric List       | `/metrics`                        | Page    | Exists / TBD    | ...   |
   | Metric Detail     | `/metrics/[metricId]`             | Dynamic | Missing/Partial | ...   |
   | Metric Logs       | `/metrics/[metricId]/logs`        | Dynamic | Missing         | ...   |
   | Metric Settings   | `/metrics/[metricId]/settings`    | Dynamic | Missing         | ...   |
   | Metric Categories | `/metric-categories`              | Page    | Exists / TBD    | ...   |
   | Category Detail   | `/metric-categories/[categoryId]` | Dynamic | Missing/Partial | ...   |

   (Fill this table based on the actual codebase.)

   ## 4. Per-Page Implementation Tasks

   For each important page, describe:

   - The expected URL pattern.
   - Navigation entry points (links/buttons).
   - How the page should integrate with existing hooks.
   - Required changes to components to use the router properly.

   For example:

   ### 4.1. Metric List (`/metrics`)

   - Expected behaviours:
     - Clicking a metric card navigates to `/metrics/[metricId]`.
     - "Create Metric" button navigates to `/metrics/new` or opens a dialog (define which we use).
   - Implementation tasks:
     - [ ] Update `<MetricList>` item onClick to use `router.push(metricDetailPath(metric.id))`.
     - [ ] Ensure search/sort state is reflected in the URL query params where appropriate.
     - [ ] Add a small route helper in `src/features/metrics/routes.ts`.

   ### 4.2. Metric Detail (`/metrics/[metricId]`)

   - Expected behaviours:
     - Deep links should load the correct metric via existing hooks.
     - Internal tabs:
       - Overview → `/metrics/[metricId]`
       - Logs → `/metrics/[metricId]/logs`
       - Settings → `/metrics/[metricId]/settings`
   - Implementation tasks:
     - [ ] Use `useParams`/`useSearchParams` to read `metricId` and optional query.
     - [ ] Wire tab navigation with router pushes instead of local state only.
     - [ ] Ensure loading/error states for hooks are handled gracefully.

   (Repeat for metric logs, metric settings, metric categories, dashboard, auth.)

   ## 5. Route Helpers and Utilities

   - Define a `routes` helper module strategy:
     - e.g., `src/lib/routes.ts` or feature-level `routes.ts`:
       - `metricDetailPath(metricId: string) => \`/metrics/${metricId}\``
       - `metricLogsPath(metricId: string, params?: { range?: string }) => string`
   - List concrete functions to create and where they will be used.

   ## 6. Technical Decisions and Trade-offs

   - Pages vs modals/drawers for create/edit flows.
   - When to use replace vs push.
   - How far to encode UI state into query params (filters, sort, range).

   ## 7. Implementation Checklist

   - [ ] Implement route helpers.
   - [ ] Update all metric list → detail navigations.
   - [ ] Implement logs routes and wire to hooks.
   - [ ] Implement settings routes and wire to hooks.
   - [ ] Update metric categories routing.
   - [ ] Smoke-test deep links and back/forward browser behaviour.
   - [ ] Add basic route-level tests where appropriate.
   ```
