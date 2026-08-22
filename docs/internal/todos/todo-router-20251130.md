# Router TODOs – 30 Nov 2025

## Focused Overhauls
- Centralize every navigation path with typed helpers (`authRoutes`, `metricRoutes`, `metricCategoryRoutes`) plus query-param builders.
- Sync list/search/filter state for metrics and metric-categories with the App Router (server-driven `searchParams`, client updates via helpers).
- Enforce authenticated layout boundaries and build missing account/profile route.
- Break `/metrics/[metricId]` into routed tabs (overview/logs/settings) with intercepting modals so logs/settings gain shareable URLs.
- Mirror the routing patterns for metric categories (detail layout, scoped CRUD flows).

## Checklists

### 1. Route Helper + Navigation Cleanup
- [x] Create `src/lib/routes.ts` exporting helper factories + a `buildPath` util for query serialization.
- [x] Refactor `Sidebar`, `BottomNavigationBar`, breadcrumbs, and card/table components to read from the helper map (no ad-hoc strings).
- [x] Add lightweight hooks (`useRouteParams`, `useRouteSync`) to standardize parameter parsing and query updates.
- [x] Document the helper usage in `docs/internal/initiatives/routing/next-router-plan.md` so future features follow the same pattern.

### 2. Metrics Library URL State
- [x] Convert `/metrics` page to parse `searchParams` on the server and pass normalized props to the client list component.
- [x] Persist `mode`, `page`, `limit`, `sort`, `q`, and filter inputs to the URL via helper-powered `router.replace`.
- [x] Introduce intercepting modal routes for create/edit flows (`/metrics/new`, `/metrics/[metricId]/edit`) that reuse `MetricForm`.
- [x] Prefetch metric detail routes from list rows/cards after centralizing helper usage.

### 3. Metric Categories URL State
- [x] Apply the same server/client split to `/metric-categories`, feeding pagination/sort/search from `searchParams`.
- [x] Ensure category detail pages inherit the query state when linking back to the main list (e.g., via `returnParams` object).
- [x] Add intercepting routes for category create/edit forms so dialog URLs can be shared.
- [x] Update category-scoped metric tables to auto-append `categoryId` filter when building URLs.

### 4. Authenticated Layout + Account Route
- [x] Implement `/account` under `(app)` with server-side user profile fetch and client edit modals.
- [x] Move auth enforcement to `src/app/(app)/layout.tsx` (server redirect or `redirect("/login")`) while keeping `withAuth` only where atoms are required.
- [x] Expand `middleware.ts` coverage to `/account`, `/metrics/[metricId]/(tabs)/*`, `/metric-categories/[categoryId]/*`, and future analytics routes.
- [x] Wire `returnUrl` handling through the new helpers so login/register flows round-trip correctly.

- [x] Add `src/app/(app)/metrics/[metricId]/layout.tsx` that fetches header/settings once and shares via context.
- [x] Create tab routes for overview/logs/settings, each with dedicated `loading.tsx` and `error.tsx`.
- [x] Migrate `MetricLogsSection` to the logs tab and read its filters from `searchParams`; settings tab refactor still pending.
- [x] Build intercepting modal routes for log CRUD (`/metrics/[metricId]/logs/(…)/@modal/...`) so create/edit forms open without leaving the tab.
- [x] Move the settings tab to route-based navigation, add optional `?panel=` support, and expose `/metrics/[metricId]/settings/(…)/@modal/(.)edit` for the form dialog.
- [x] Add nested modal routes under `/metric-categories/[categoryId]/metrics/(…)/@modal/(.)new|[metricId]` so category-scoped metric creation/editing keeps the tab mounted.

### 6. Metric Category Detail Routing
- [x] Introduce a layout under `/metric-categories/[categoryId]` fetching the category server-side.
- [x] Port the embedded `MetricListSection` to a routed tab that consumes shared context and URL-backed pagination.
- [x] Provide modal routes for creating/editing metrics within a category, inheriting `categoryId` in the form defaults.
- [x] Update breadcrumbs + CTA buttons to leverage the helper routes with proper query preservation.
