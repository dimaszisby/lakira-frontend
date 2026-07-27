# Next.js Router Implementation Plan

## 1. Scope

- Features covered:
  - Auth (login/register/profile) – `/login`, `/register`, `/account`, logout redirect logic.
  - Dashboard – `/dashboard` data visualizations backed by `useDashboardVisualizations`.
  - Metric Library (list + create + edit + detail) – `/metrics`, `/metrics/new`, `/metrics/[metricId]`.
  - Metric Category Library – `/metric-categories`, `/metric-categories/new`, `/metric-categories/[categoryId]`.
  - Metric Logs (per metric) – `/metrics/[metricId]/logs` including modal CRUD flows.
  - Metric Settings (per metric) – `/metrics/[metricId]/settings` with goal/display forms.

## 2. Routing Principles and Conventions

- App Router usage:
  - Keep `src/app/(auth)` for unauthenticated pages (`login`, `register`) and `src/app/(public)` (new) for marketing/landing routes such as `src/app/page.tsx`.
  - Consolidate all signed-in experiences under `src/app/(app)` and ensure `src/app/(app)/layout.tsx` becomes a server component that checks auth (replacing per-page `withAuth`) before rendering `AppShell`.
  - Introduce route-groups inside `/metrics/[metricId]` (`(tabs)` and parallel `@modal`) so overview/logs/settings can render independently while sharing a parent `layout.tsx` that loads `useMetricDetailComposite` data on the server.
  - Provide route-level `loading.tsx`/`error.tsx` where client data fetching (React Query) is still used, to keep UX consistent while queries hydrate.
  - Keep page-specific UI colocated under each route's `_components` directory (already done for `src/app/(app)/dashboard/_components` and `src/app/(app)/metric-categories/[id]/_components`) so ownership stays obvious as we keep layering tabs/modals.
- Dynamic segments:
  - `/metrics/[metricId]` → overview tab.
  - `/metrics/[metricId]/logs` → list + CRUD of logs.
  - `/metrics/[metricId]/settings` → goal/display settings.
  - `/metric-categories/[categoryId]` → category detail (possible nested `metrics` tab later).
  - Parallel modal routes: `/metrics/@modal/(...)` and `/metric-categories/@modal/(...)` for create/edit overlays that keep history in sync.
- Query params conventions:
  - Collection pages use `?page`, `?limit`, `?sort=field:dir`, `?q` for search, `?mode=pages|scroll` (already used in `useListMode`) and `?view=list|grid` where toggles exist.
  - Metric detail tabs can use `?range=7d|30d|custom` and `?bucket=day|week|month` to replace the current `globalRangeAtom/globalBucketAtom` state in `DashboardContent`.
  - Logs routes append `?range`, `?view=table|chart`, `?filter[categoryId]=...` as needed; helper functions should stringify nested filter objects consistently.
  - Auth routes honor `?returnUrl` (already added by `middleware.ts`) so successful login/register pushes back to the requested page.
- Navigation utilities:
  - Centralize route builders (e.g., `metricRoutes.detail(metricId)`) to avoid ad-hoc strings across `MetricTable`, `MetricLibraryMobileCard`, `Sidebar`, and forms.
  - Create a `buildPath(base, params)` utility that merges query params and serializes nested filters so hooks such as `useListMode` can call `router.replace(buildPath(pathname, nextParams))`.
  - Prefer `next/link` for static navigation (sidebar, breadcrumbs) so App Router prefetches automatically; use `router.push`/`router.replace` only for imperative flows (mutations, toggles).
  - Provide `useRouteParams()` helper to coerce required params (e.g., `metricId`) and reduce repeated `useParams` casting.
  - Use `router.prefetch` inside list hover/click handlers (e.g., `MetricTable` rows) once the route helpers exist, so detail screens load faster.
- Middleware & access control:
  - Update `middleware.ts` to include `/account`, nested `/metrics/[metricId]/...`, and any future `/analytics` paths; rely on one guard rather than duplicating inside components.
  - Continue using `withAuth` for client components that must access atoms/router, but initiate auth in the segment layout to avoid waterfalls.

## 3. Current Route Inventory and Gaps

| Feature           | Path example                      | Type    | Status          | Notes                                                                                                                                                                                                               |
| ----------------- | --------------------------------- | ------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth Login        | `/login`                          | Page    | Exists (client) | `src/app/(auth)/login/page.tsx` renders `LoginForm`, but it ignores `returnUrl` from `middleware.ts` and uses imperative `router.push("/dashboard")`.                                                               |
| Auth Register     | `/register`                       | Page    | Exists (client) | `src/app/(auth)/register/page.tsx` mirrors login and always pushes to `/dashboard`; no redirect back to requested resource.                                                                                         |
| Profile / Account | `/account`                        | Page    | Missing         | `Sidebar` (`src/components/layout/type.tsx`) links to `/account`, yet no route exists; profile data already available via `fetchUserProfile`.                                                                       |
| Dashboard         | `/dashboard`                      | Page    | Exists (server) | `src/app/(app)/dashboard/page.tsx` delegates to colocated `_components/DashboardContent` (client) using global Jotai atoms for range/bucket; not wrapped with `withAuth`, so relies solely on middleware.           |
| Metric List       | `/metrics`                        | Page    | Exists (client) | `src/app/(app)/metrics/page.tsx` (with `withAuth`) drives TanStack Query pagination but keeps pagination/search/sort purely in component state (not in `searchParams`).                                             |
| Metric Detail     | `/metrics/[metricId]`             | Dynamic | Partial         | Layout now fetches header/settings server-side, but logs/settings still share one tab until dedicated query-param refactors land. |
| Metric Logs       | `/metrics/[metricId]/logs`        | Dynamic | Missing         | Logs live in `MetricLogsSection` on the detail page; cannot deep link or share query filters like `range`.                                                                                                          |
| Metric Settings   | `/metrics/[metricId]/settings`    | Dynamic | Missing         | `MetricSettingsSection` renders inline; editing opens local modal only, so settings cannot be bookmarked.                                                                                                           |
| Metric Categories | `/metric-categories`              | Page    | Exists (client) | `src/app/(app)/metric-categories/page.tsx` uses cursor pagination hooks but, like metrics, keeps query state local and relies on `router.push` only for row clicks.                                                 |
| Category Detail   | `/metric-categories/[categoryId]` | Dynamic | Partial         | `src/app/(app)/metric-categories/[id]/page.tsx` now pulls UI from `_components`, but still fetches via client hook (`useMetricCategoryById`) and lacks URL-aware tabs/filters beyond the hardcoded `categoryId`.    |

## 4. Per-Page Implementation Tasks

### 4.1. Auth (Login/Register/Profile)

- Expected behaviours:
  - Landing page (`src/app/page.tsx`) links to `/login` and `/register`; authenticated users who hit `/login` should be redirected to `/dashboard` with a toast.
  - Both auth forms respect `?returnUrl` so middleware-driven redirects land where the user intended.
  - `/account` shows the signed-in profile (name, email, visibility toggles) with edit modals driven by APIs in `src/services/api/auth.api`.
- Implementation tasks:
  - [x] Add `src/app/(app)/account/page.tsx` wrapped with the shared `(app)` layout, reuse `withAuth`, and hydrate via `fetchUserProfile`.
  - [x] Update `LoginForm` and `RegisterForm` to read `useSearchParams`, compute the redirect target via a central `authRoutes.afterLogin(returnUrl)`, and only fallback to `/dashboard` if the param is absent.
  - [x] Add guarded server components (`redirect` from `next/navigation`) in `/login` and `/register` to short-circuit if `userAtom` is already set.
  - [x] Extend `middleware.ts` matcher to include `/account` and future `/analytics` paths.
  - [x] Surface `returnUrl` in the auth CTA buttons on the landing page so manual navigation can also respect context (e.g., link to `/login?returnUrl=/metrics`).

  _Implementation note_: `src/lib/routes.ts` now exports `buildPath` plus the initial `authRoutes` helpers (`login`, `register`, `account`, `afterAuth`). These power the sanitized return-url flow across the landing page, middleware redirect, and the login/register forms.

  _Update_: `metricRoutes`, `metricCategoryRoutes`, and `dashboardRoute` helpers are seeded in the same module so the upcoming metrics/category tasks can start migrating to the common builders without revisiting serialization rules.

### 4.2. Dashboard (`/dashboard`)

- Expected behaviours:
  - Dashboard renders after auth, persists `range`/`bucket` choices in the URL, and prefetches data visualizations via TanStack Query keys exposed in `src/features/data-visualizations`.
  - Mobile sidebar highlights Dashboard using `usePathname` substring matches (already done in `BottomNavigationBar`).
- Implementation tasks:
  - [x] Convert `src/app/(app)/dashboard/page.tsx` into a server component that reads `searchParams` and passes them to `src/app/(app)/dashboard/_components/DashboardContent`, while hydrating an initial query via `dehydratedState`.
  - [x] Move `globalRangeAtom`/`globalBucketAtom` state to a URL-backed hook (`useDashboardFilters`) so share links (e.g., `/dashboard?range=30d&bucket=week`) recreate the same view.
  - [x] Wrap `DashboardContent` with `withAuth` (or enforce auth inside `(app)/layout`) to prevent flashes before middleware kicks in.
  - [x] Add `loading.tsx` and `error.tsx` under `/dashboard` to show skeletons and error states consistent with `DashboardContent` fallbacks.

  _Implementation note_: `src/app/(app)/dashboard/page.tsx` now prefetches `getDashboardVisualizations` via a server `QueryClient`, hydrates the cache with `HydrationBoundary`, and relies on `useDashboardFilters` (`src/features/data-visualizations/useDashboardFilters.ts`) + the shared parsing utilities in `dashboardFilters.ts` to keep the range/bucket atoms and URL query params in sync.

### 4.3. Metric List (`/metrics`)

- Expected behaviours:
  - URL encodes `mode`, `page`, `limit`, `q`, and `sort`, and these feed straight into `useMetricsListPaginationViaCursor` / `useMetricInfiniteViaCursor`.
  - Clicking any card/table row navigates via `metricRoutes.detail(metric.id)`; CTA buttons open create/edit modals through an intercepting route.
  - List toggles should preserve state on refresh/back thanks to search params rather than local state only.
- Implementation tasks:
  - [x] Introduce a server `page.tsx` that reads `searchParams`, normalizes them into a `MetricListSearchParams` type, and passes them down to the client component; keep mutations client-side.
  - [x] Update the metrics list UI to persist its mode via the URL builders instead of relying solely on local state (`useMetricListSearchState` replaces the previous `useListMode` usage on this page).
  - [x] Persist pagination + sort in the URL; e.g., `Pagination` callbacks call `router.push(metricRoutes.list(nextParams))` instead of mutating local state only.
  - [x] Create `/metrics/@modal/(..metric-form)/page.tsx` intercepting route so hitting `/metrics/new` opens the `MetricForm` component while preserving background UI/history.
  - [x] Replace magic strings (`/metrics/${id}`) across `MetricTable`, `MetricLibraryMobileCard`, and `MetricListSection` with helper functions to avoid drift when the path hierarchy changes.

  _Implementation note_: `src/app/(app)/metrics/page.tsx` now hydrates a server-parsed `MetricListSearchParams` into the new client component (`_components/MetricsPageClient`) which uses `useMetricListSearchState` to keep `mode`, `q`, `sort`, and `page` encoded in the URL via `metricRoutes.list`. Dedicated routes (`/metrics/new`, `/metrics/[metricId]/edit`) host `MetricFormDialog`; intercepting routes under `metrics/@modal/(.)new` and `metrics/@modal/(.)[metricId]` reuse those pages so the background list stays mounted, and both the desktop table + mobile cards prefetch the metric detail route on hover/focus so clicks feel instant even when switching between cursor modes.

### 4.4. Metric Detail Overview (`/metrics/[metricId]`)

- Expected behaviours:
  - Overview page fetches header + settings once (server-side) and provides them via context to child tabs; the colocated `_components` directory remains the home for tab-level UI.
  - Breadcrumbs continue linking back to `/metrics` and `/metric-categories/[categoryId]` but via the helper.
  - Tabs (Overview, Logs, Settings) update the URL and can be opened directly.
- Implementation tasks:
  - [x] Create `src/app/(app)/metrics/[metricId]/layout.tsx` that loads the header/settings via `getUserMetricDetails` and wraps children with a context provider for shared data.
  - [x] Break the former `MetricDetailContent` into dedicated routes (`page.tsx`, `logs/page.tsx`, `settings/page.tsx`) so Overview/Logs/Settings render independently.
  - [x] Replace the implicit tabs with a `<MetricDetailTabs>` nav that links to the real routes via `metricRoutes.overview/logs/settings`.
  - [x] Ensure `VisualizationSection` can read optional `?view` query params for chart vs list modes.
  - [x] Add `loading.tsx`/`error.tsx` to the `[metricId]` segment so long running fetches present skeletons/error recovery per tab.

  _Implementation note_: Layout now hydrates `MetricDetailProvider`, rendering shared chrome (breadcrumbs, header, tab nav) once while the child routes (`overview`, `logs`, `settings`) focus on their respective sections. Logs/settings still rely on local modals in preparation for the upcoming intercepting routes, and the visualization tab will pick up `?view=` handling when Task 4.5 lands.

### 4.5. Metric Logs (`/metrics/[metricId]/logs`)

- Expected behaviours:
  - Dedicated route lists logs using `useMetricLogListCursorPage`, with query params capturing pagination, filters, and date range.
  - "Add Log" opens `/metrics/[metricId]/logs/@modal/new` so the form can be shareable, and editing uses `/metrics/[metricId]/logs/@modal/[logId]`.
  - Switching between overview/logs preserves the chosen range (via shared parent context or query param).
- Implementation tasks:
- [x] Move `MetricLogsSection` into the routed `/metrics/[metricId]/logs/page.tsx` experience and derive filters from `searchParams` via the new `useMetricLogSearchState` helper.
- [x] Add query string serialization for `MetricLogSortParam` (see `src/features/metric-logs/listSearchParams.ts`) so sort chips sync to the URL.
- [x] Implement intercepting routes under `logs/@modal/(.)new` and `logs/@modal/(.)[logId]` using `MetricLogFormDialog` so create/update flows open as Modals while preserving history.
- [x] Hook tab nav + breadcrumbs to `metricRoutes.logs(metricId, params)` so deep links contain the active filters (tabs now rely entirely on route helpers).
- [x] Extend middleware to cover `/metrics/[metricId]/logs` and add smoke tests ensuring unauthorized users are redirected. _(Existing `/metrics/:path*` guard already covered the new routes.)_

  _Implementation note_: `src/app/(app)/metrics/[metricId]/logs/page.tsx` now parses `searchParams` server-side before hydrating `MetricLogsClient`, which in turn syncs sort/search/page to the URL and navigates to the modal routes (`/logs/new`, `/logs/[logId]`) via `metricRoutes.logs`. Intercepting routes live under `logs/@modal/(.)*`, so hitting those paths on top of the logs tab renders `MetricLogFormDialog` without tearing down the underlying list.

### 4.6. Metric Settings (`/metrics/[metricId]/settings`)

- Expected behaviours:
  - Settings tab renders read-only cards (current `MetricSettingsSection`) plus CTA buttons that open route-based modals for editing.
  - Query params capture sub-views (e.g., `?panel=goals|display`) when future sections expand.
- Implementation tasks:
  - [x] Relocate `MetricSettingsSection` into the routed `/settings/page.tsx`, loading its data from the parent layout context rather than re-fetching.
  - [x] Expose dedicated intercepting routes for `MetricSettingsForm` (`/metrics/[metricId]/settings/(…)/@modal/(.)edit`) so edits open as modals while preserving history.
  - [x] Normalize API mutations to `router.refresh()` the parent layout so TanStack caches update without manual invalidations.
  - [x] Provide skeleton and error boundaries for the settings route similar to logs (handled at the `[metricId]` layout level).

  _Implementation note_: `MetricSettingsSection` now reads the metric context directly and navigates via `metricRoutes.settings(metricId)` plus `/edit`; the tab honours optional `?panel=` query params to highlight future subviews. `MetricSettingsFormDialog` consumes the same context, so both `/settings/edit` and the intercepting modal render identical forms without re-fetching.

### 4.7. Metric Category Library (`/metric-categories`)

- Expected behaviours:
  - List honors search params for `page`, `q`, `sort`, and `mode`, mirroring the metrics list behavior.
  - Buttons link to `/metric-categories/new` (modal) and clicking a row uses `metricCategoryRoutes.detail(category.id)`.
- Implementation tasks:
  - [x] Convert `page.tsx` into a server component that reads `searchParams` and initializes the client state accordingly.
  - [x] Synchronize `Pagination`, `SortChipGroup`, and filters with query params via the new helper utilities.
  - [x] Add `/metric-categories/@modal/new` intercepting route for `MetricCategoryForm`, plus `/metric-categories/[categoryId]/@modal/edit`.
  - [x] Replace inline string pushes (`router.push("/metric-categories/${id}")`) with helper calls.
  - [x] Ensure `withAuth` (or layout-level guard) applies consistently so middleware is not the only protection. *(Handled centrally via `src/app/(app)/layout.tsx`, which redirects unauthenticated requests to `authRoutes.login()`.)*

  _Implementation note_: `src/app/(app)/metric-categories/page.tsx` now hydrates `MetricCategoriesPageClient`, which keeps `mode`, `page`, `limit`, `q`, and `sort` in sync with the URL via `useMetricCategorySearchState`. Navigation (row clicks + CTA) flows through `metricCategoryRoutes`, and the client hook drives both cursor pagination strategies while honoring the persisted query state.

### 4.8. Metric Category Detail (`/metric-categories/[categoryId]`)

- Expected behaviours:
  - Header data is fetched on the server in `layout.tsx` and passed to child routes to avoid double-fetching on each tab.
  - The metrics-tab list adopts the same pagination/search param approach as the standalone library but pre-filters by `categoryId`.
  - Buttons can open `MetricForm` modals via intercepting routes scoped under the category segment.
- Implementation tasks:
  - [x] Create `src/app/(app)/metric-categories/[categoryId]/layout.tsx` that fetches the category via `getMetricCategoryById` on the server and provides context for the `_components` already colocated with the route.
  - [x] Move `MetricListSection` into the routed `page.tsx` and have it read filter state from `searchParams`, merging `categoryId` automatically via the new `useCategoryMetricSearchState` helper.
  - [x] Add a `/metric-categories/[categoryId]/metrics/@modal/[metricId]` route so category-scoped metric creation uses the same UI but keeps navigation consistent.
  - [x] Extend breadcrumbs and sidebar to use the helper routes for links back to categories/metrics, preserving the originating list filters via `returnParams`.

  _Implementation note_: Category detail now hydrates a shared `MetricCategoryDetailContext` and server-renders the header once. The metrics table reuses the metrics query hooks but keeps `page`, `limit`, `q`, and `sort` in sync with the URL, forcing the `categoryId` filter automatically so deep links stay stable. When navigating from the list, the current filters are encoded into a `returnParams` object so the header/back links (and sidebar) can return the user to the same slice of the `/metric-categories` grid, and the `useCategoryMetricSearchState` hook now preserves that encoded payload even as users tweak the category-level filters.

## 5. Route Helpers and Utilities

- Create `src/lib/routes.ts` exporting typed builders:
  ```ts
  export const authRoutes = {
    login: (returnUrl?: string) => buildPath("/login", returnUrl ? { returnUrl } : undefined),
    register: (returnUrl?: string) => buildPath("/register", returnUrl ? { returnUrl } : undefined),
    account: () => "/account",
  };
  export const metricRoutes = {
    list: (params?: MetricListQuery) => buildPath("/metrics", params),
    detail: (metricId: string) => `/metrics/${metricId}`,
    overview: (metricId: string, params?: MetricOverviewQuery) =>
      buildPath(`/metrics/${metricId}`, params),
    logs: (metricId: string, params?: MetricLogQuery) =>
      buildPath(`/metrics/${metricId}/logs`, params),
    settings: (metricId: string, params?: MetricSettingsQuery) =>
      buildPath(`/metrics/${metricId}/settings`, params),
    modal: {
      new: () => "/metrics/new",
      edit: (metricId: string) => `/metrics/${metricId}/edit`,
      log: (metricId: string, logId?: string) => `/metrics/${metricId}/logs/${logId ?? "new"}`,
    },
  };
  ```
- Provide similar helpers for categories (`metricCategoryRoutes.list/detail/modal`) and dashboard filters (`dashboardRoute({ range, bucket })`).
- Implement a `buildPath` utility that merges the base pathname with serialized query params (handles arrays and nested filter objects) and ensures outputs remain URL-encoded and deterministic so TanStack Query caches remain consistent.
- Add lightweight hooks:
  - `useRouteParams<Params>()` – wraps `useParams`/`useSearchParams` with runtime errors if a required param is missing.
  - `useRouteSync(state, updateFn)` – generic helper for syncing local state to query params with debounced updates, replacing the custom logic inside `useListMode`.
- Update components (`Sidebar`, `BottomNavigationBar`, `Breadcrumbs`, CTA buttons) to consume these helpers for consistency and easier refactors.

  _Implementation update_: `src/hooks/useRouteParams.ts` and `src/hooks/useRouteSync.ts` now centralize the recurring `useParams`/`router.replace` patterns across dashboard filters, metric lists, category lists, and log tabs. Navigation primitives (`Sidebar`, `BottomNavigationBar`, category cards, metric tables) exclusively reference `navItems` + `metricRoutes`/`metricCategoryRoutes`, so we can grow the route tree without hunting for stray strings.

## 6. Technical Decisions and Trade-offs

- **Tabs via nested routes vs single component:** Splitting `/metrics/[metricId]` into real routes provides shareable URLs and lighter bundles but adds file-system complexity (layout + tab directories). We'll accept the extra structure because the current monolithic page is hard to reason about and cannot deep-link logs/settings.
- **Modal routing strategy:** Using parallel routes (`@modal`) keeps history and the background route synchronised but requires Next 13+ features and additional files. Keeping the legacy local-state modals would be simpler yet fails to support shareable URLs. We'll use intercepting routes for create/edit flows where shareability matters (metrics, logs, categories).
- **Server vs client data fetching:** Lists still rely on TanStack Query for caching/mutations, but top-level pages should become server components that parse `searchParams`, prefetch queries (`dehydratedState`), and render loading states. This avoids hydration waterfalls seen in `MetricDetailContent`.
- **State in URL vs local state:** Only persist user-facing filters (`mode`, `page`, `range`, `sort`, `view`). Highly transient UI state (e.g., whether a section is expanded) can remain local. This balances usability (shareable URLs) with manageable route signatures.
- **Auth enforcement:** We can either keep `withAuth` wrappers or shift to server redirects in `(app)/layout`. Moving auth checks server-side reduces client suspense but requires rewriting `withAuth`-dependent atoms. Hybrid approach: `(app)/layout` ensures auth, while `withAuth` remains for client-only routes needing user context.
- **replace vs push:** Use `router.replace` when mutating filters (so history stays clean), and `router.push` for real navigation (opening detail pages). `useListMode` already uses `replace`; the new route helpers should encapsulate this.
- **Middleware coverage:** Expanding `PROTECTED_PATHS` increases request-time checks but keeps unauthorized users out before React renders. The added overhead is acceptable compared to the UX of flashing unauthenticated pages.

## 7. Implementation Checklist

- [x] Stand up `docs/routing` helpers: `buildPath`, `authRoutes`, `metricRoutes`, `metricCategoryRoutes`, `dashboardRoute`, plus `useRouteParams`.
- [x] Refactor `/metrics` and `/metric-categories` pages to read/write search params, server-render filter defaults, and use the helper routes throughout tables/cards.
- [x] Introduce `/metrics/[metricId]/layout.tsx` with nested tabs (overview/logs/settings) and intercepting routes for metric/log/settings modals.
- [x] Implement dedicated `/metrics/[metricId]/logs` and `/metrics/[metricId]/settings` routes, wiring query params to `useMetricLogListCursorPage` and the settings form.
- [x] Build `/account` route and ensure `(app)` layout enforces auth server-side; update middleware to protect new paths.
- [x] Convert metric category detail to a routed layout with server data fetching and query-param-driven metric lists.
- [x] Update Sidebar + BottomNavigationBar + Breadcrumbs to consume the centralized route helpers.
- [ ] Add `loading.tsx`/`error.tsx` to the main segments (dashboard, metrics tabs, metric categories) and smoke-test deep links/back navigation.
