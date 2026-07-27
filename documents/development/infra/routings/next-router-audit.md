# Next Router Implementation Audit

Legend: ✅ = implemented, ⚠️ = partial, ❌ = missing

## 2. Routing Principles & Conventions
| Item | Status | Evidence / Notes |
| --- | --- | --- |
| Consolidate authenticated routes under `src/app/(app)` with server guard | ✅ | `src/app/(app)/layout.tsx:1-16` checks the `lakira_token` cookie and redirects to `authRoutes.login()` before rendering `AppShell`. |
| Keep unauthenticated routes under `(auth)` | ✅ | `src/app/(auth)/login/page.tsx:1-28` and `src/app/(auth)/register/page.tsx:1-28` live inside the `(auth)` segment. |
| Introduce `(public)` group for marketing/landing routes | ❌ | Landing page still resides at `src/app/page.tsx:1-45`; there is no `src/app/(public)` group, so marketing pages share the root layout with authenticated areas. |
| Nested metric detail tabs & parallel modals | ✅ | `src/app/(app)/metrics/[metricId]/layout.tsx:1-34` loads detail data once and nests dedicated `logs` / `settings` directories plus `@modal` folders (e.g., `logs/@modal/(.)new/page.tsx:1`). |
| Route-level `loading.tsx` / `error.tsx` for data-heavy segments | ✅ | Examples include `src/app/(app)/dashboard/loading.tsx:1-11` and `error.tsx:1-34`, plus `src/app/(app)/metrics/[metricId]/loading.tsx:1-8` and `error.tsx:1-20`. |
| Query-state lives in URLs (`buildPath`, `useRouteSync`) | ✅ | `src/lib/routes.ts:1-111` defines `buildPath`, `authRoutes`, `metricRoutes`, and `metricCategoryRoutes`; hooks such as `useRouteSync` (`src/hooks/useRouteSync.ts:1-43`) and `useMetricListSearchState` (`src/features/metrics/useMetricListSearchState.ts:1-40`) serialize list state back to the router. |
| Navigation uses helpers + prefetch | ✅ | `src/components/layout/type.tsx:1-18` pulls hrefs from `dashboardRoute`, `metricRoutes`, etc., and list components prefetch detail routes (`src/app/(app)/metrics/_components/MetricsPageClient.tsx:185-198`, `src/features/metrics/components/MetricLibraryMobileCard.tsx:31-68`). |

## 4.1 Auth (Login/Register/Profile)
| Requirement | Status | Evidence / Notes |
| --- | --- | --- |
| `/account` page under `(app)` guarded by auth | ✅ | `src/app/(app)/account/page.tsx:1-111` wraps the client page with `withAuth` and uses `useAuthProfileQuery` for profile data. |
| Login/Register honor `?returnUrl` and redirect via helpers | ✅ | `LoginForm` reads `returnUrl` and pushes `authRoutes.afterAuth(returnUrl)` (`src/features/auth/components/LoginForm.tsx:19-42`), mirrored in `RegisterForm` (`src/features/auth/components/RegisterForm.tsx:19-34`). |
| `/login` and `/register` short-circuit when already authenticated | ✅ | Both server components inspect cookies and redirect via `authRoutes.afterAuth` before rendering forms (`src/app/(auth)/login/page.tsx:18-25`, `src/app/(auth)/register/page.tsx:18-25`). |
| Middleware extends guard coverage & propagates `returnUrl` | ✅ | `middleware.ts:4-29` protects `/dashboard`, `/metrics`, `/metric-categories`, and `/account`, redirecting unauthenticated users to `/login?returnUrl=…`. |
| Landing page links include `returnUrl` | ✅ | Buttons use `authRoutes.login(returnUrl)` and `authRoutes.register(returnUrl)` in `src/app/page.tsx:12-40`. |

## 4.2 Dashboard (`/dashboard`)
| Requirement | Status | Evidence / Notes |
| --- | --- | --- |
| Server component prefetches dashboard data & hydrates client | ✅ | `src/app/(app)/dashboard/page.tsx:1-45` parses `searchParams`, prefetches TanStack Query data, and renders `HydrationBoundary`. |
| Range/Bucket synced to URL | ✅ | `useDashboardFilters` (`src/features/data-visualizations/useDashboardFilters.ts:19-73`) parses and serializes `bucket`/`range` via `dashboardRoute`. |
| Auth enforced via layout | ✅ | Covered by `(app)/layout` as noted above; Dashboard relies on that guard. |
| Route-specific loading/error | ✅ | See `dashboard/loading.tsx:1-11` and `dashboard/error.tsx:1-34`. |

## 4.3 Metric List (`/metrics`)
| Requirement | Status | Evidence / Notes |
| --- | --- | --- |
| Server `page.tsx` normalizes search params | ✅ | `src/app/(app)/metrics/page.tsx:1-21` calls `parseMetricListSearchParams` before rendering the client component. |
| Client syncs mode, pagination, search, sort to URL | ✅ | `MetricsPageClient` uses `useMetricListSearchState` and updates `mode`, `page`, `q`, `sort`, `limit` through `replaceParams` (`src/app/(app)/metrics/_components/MetricsPageClient.tsx:48-165`). |
| Pagination & toggles drive router navigation | ✅ | Handlers such as `handlePageChange` (`lines 168-182`) and `handleModeChange` (`lines 123-133`) push new URLs via the shared state hook; query serialization lives in `src/features/metrics/listSearchParams.ts:1-71`. |
| Intercepting modal routes for create/edit | ✅ | `/metrics/@modal/(.)new/page.tsx:1` and `/metrics/@modal/(.)[metricId]/page.tsx:1` re-export the standalone form pages to power overlays. |
| Route helpers replace ad-hoc strings | ✅ | All navigation in `MetricsPageClient` uses `metricRoutes` (`lines 134-152`), and shared builders live in `src/lib/routes.ts:80-95`. |

## 4.4 Metric Detail Overview (`/metrics/[metricId]`)
| Requirement | Status | Evidence / Notes |
| --- | --- | --- |
| Layout fetches detail once and shares via context | ✅ | `src/app/(app)/metrics/[metricId]/layout.tsx:1-34` loads details, maps to view models, and wraps children with `MetricDetailProvider`. |
| Tabs split into dedicated routes | ✅ | Overview (`page.tsx:1-9`), Logs (`logs/page.tsx:1-8`), and Settings (`settings/page.tsx:1-13`) render independently under the shared layout. |
| Tab navigation uses route helpers | ⚠️ | `MetricDetailTabs` builds links via `metricRoutes` but always drops current `searchParams` (`src/app/(app)/metrics/[metricId]/_components/MetricDetailTabs.tsx:18-37`), so returning to `/logs` resets filters despite plan call-out to preserve them. |
| Visualization reacts to URL state | ✅ | `VisualizationSection` passes `searchParamKey` to the visualization widget, which reads/writes `?viz-range`/`?viz-bucket` ( `src/app/(app)/metrics/[metricId]/_components/VisualizationSection.tsx:7-18`, `src/components/ui/Visualization.tsx:21-107`). |
| Loading/error boundaries | ✅ | Covered at the `[metricId]` segment (`loading.tsx:1-8`, `error.tsx:1-20`). |

## 4.5 Metric Logs (`/metrics/[metricId]/logs`)
| Requirement | Status | Evidence / Notes |
| --- | --- | --- |
| Logs route derives state from `searchParams` | ✅ | Server page parses params with `parseMetricLogSearchParams` (`logs/page.tsx:1-8`), and `MetricLogsClient` hydrates `useMetricLogSearchState` (`_components/MetricLogsClient.tsx:30-74`). |
| Sort/search query serialization | ✅ | `MetricLogListSearchParams` encode `page`, `limit`, `q`, and `sort` (`src/features/metric-logs/listSearchParams.ts:1-55`), consumed by the client component (`MetricLogsClient.tsx:76-134`). |
| Intercepting modal routes for create/edit | ✅ | `/logs/@modal/(.)new/page.tsx:1` and `/logs/@modal/(.)[logId]/page.tsx:1` reuse the standalone form pages. |
| Tab/breadcrumb links preserve active filters | ❌ | `MetricDetailTabs` and `Breadcrumbs` never include the current logs query when linking back to `/logs` (`src/app/(app)/metrics/[metricId]/_components/MetricDetailTabs.tsx:18-37`, `Breadcrumbs.tsx:17-39`), so deep links lose `?page`, `?sort`, etc., contrary to the plan. |
| Middleware coverage | ✅ | Already handled by global matcher in `middleware.ts:4-29`. |

## 4.6 Metric Settings (`/metrics/[metricId]/settings`)
| Requirement | Status | Evidence / Notes |
| --- | --- | --- |
| Settings tab reads data from layout context | ✅ | `MetricSettingsSection` uses `useMetricDetail` to display existing settings (`src/app/(app)/metrics/[metricId]/_components/MetricSettingsSection.tsx:19-123`). |
| Modal routes for editing | ✅ | `/settings/edit/page.tsx:1-6` renders `MetricSettingsFormDialog`, and `/settings/@modal/(.)edit/page.tsx:1` exposes it as an overlay. |
| Mutations refresh parent layout | ✅ | `MetricSettingsFormDialog` invokes `router.refresh()` before closing (`src/features/metric-settings/components/MetricSettingsFormDialog.tsx:7-24`). |
| Optional query params for future panels | ✅ | `settings/page.tsx:1-13` reads `searchParams.panel` and passes it to `MetricSettingsSection`, which highlights cards based on the panel prop. |

## 4.7 Metric Category Library (`/metric-categories`)
| Requirement | Status | Evidence / Notes |
| --- | --- | --- |
| Server `page.tsx` normalizes search params | ✅ | `src/app/(app)/metric-categories/page.tsx:1-21` calls `parseCategoryListSearchParams`. |
| URL-synced pagination/search/sort/mode | ⚠️ | `useMetricCategorySearchState` supports serializing `mode`, `page`, `limit`, `q`, and `sort` (`src/features/metric-categories/useMetricCategorySearchState.ts:1-45`), but `MetricCategoriesPageClient` never calls `setMode` or renders a toggle (`src/app/(app)/metric-categories/_components/MetricCategoriesPageClient.tsx:47-207`), so the user cannot actually switch between `pages` and `scroll` modes as required. |
| Modal routes for create/edit | ✅ | `/metric-categories/@modal/(.)new/page.tsx:1` and `/metric-categories/@modal/(.)[categoryId]/edit/page.tsx:1` reuse the standalone form pages. |
| Navigation uses centralized helpers | ✅ | Row clicks and CTA buttons rely on `metricCategoryRoutes` (`MetricCategoriesPageClient.tsx:109-160`), and category detail breadcrumbs use helpers too (`MetricCategoryHeaderSection.tsx:10-44`). |
| Auth guard relies on `(app)/layout` | ✅ | Metric category routes live under `(app)`, so they inherit the global auth guard described earlier. |

## Additional Observations
- `useRouteParams` is available for coercing required params and is used inside category detail components (`src/hooks/useRouteParams.ts:1-43`, `src/app/(app)/metric-categories/[categoryId]/_components/MetricCategoryHeaderSection.tsx:10-32`).
- Metric detail and category list components proactively prefetch target routes, delivering on the navigation UX goals from the plan (`MetricsPageClient.tsx:185-198`, `MetricListSection.tsx:99-121`).
