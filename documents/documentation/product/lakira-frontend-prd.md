# Lakira Frontend PRD (Current-State Baseline)

## Document Control

- Product: Lakira Frontend
- Repository: `lakira-frontend`
- Version: `2.0`
- Status: Active
- Last Updated: March 12, 2026
- Owner: Frontend Engineering
- Purpose: This PRD reflects the app that is currently implemented in this codebase and replaces the previous placeholder/generic PRD.

---

## 1. Product Summary

Lakira Frontend is a web application for personal metric tracking. Users can:

- Register and log in.
- Create and organize metric categories.
- Create metrics under those categories.
- Log metric values over time.
- Configure metric settings (goal/timeframe/alerts/display metadata).
- Visualize trends on metric detail pages and on the dashboard.

The product is built with Next.js App Router, React 19, TypeScript, TanStack Query, Jotai, and Tailwind CSS.

---

## 2. Goals and Non-Goals

### 2.1 Current Product Goals

1. Provide reliable authenticated access to personal tracking data.
2. Provide complete day-to-day CRUD workflows for categories, metrics, and logs.
3. Provide trend visualization for metrics and dashboard-level summary cards.
4. Preserve list/search/sort/pagination state in URL for deep-linking and shareability.
5. Support responsive usage across desktop and mobile layouts.

### 2.2 Non-Goals (Current Release)

1. Smart reminders, push notifications, or scheduled nudges.
2. Social/team collaboration features.
3. Native iOS/Android apps.
4. In-app profile edit management (account page is read-only display + refresh).
5. Full RBAC UX (role is displayed, but role-based UI controls are not implemented).
6. Offline-first sync.

---

## 3. Target Users

### 3.1 Primary User Segment

- Individual users tracking personal growth or habits via customizable metrics.

### 3.2 User Jobs-To-Be-Done

1. Define categories and metrics quickly.
2. Log values with low friction.
3. Review trends and progress over time.
4. Manage metric visibility and dashboard display preferences.

---

## 4. Scope (Implemented Functional Requirements)

### 4.1 Authentication and Session

#### Requirements

- User can register (`/register`) and log in (`/login`) with email/password.
- Session is persisted via `lakira_token` cookie (`HttpOnly`, `SameSite=Lax`, `Secure`).
- `returnUrl` query parameter is supported and sanitized to safe relative paths.
- Protected routes redirect unauthenticated users to login with `returnUrl`.

#### Acceptance Criteria

1. Unauthenticated access to `/dashboard`, `/metrics`, `/metric-categories`, `/account` redirects to `/login`.
2. Successful login/register stores session token and navigates to `returnUrl` or `/dashboard`.
3. Logout clears user state and session cookie.

### 4.2 Navigation and App Shell

#### Requirements

- Desktop: persistent left sidebar navigation.
- Mobile: bottom navigation bar.
- Navigation sections: Dashboard, Metrics, Category, Account.

#### Acceptance Criteria

1. Current route is visually indicated in nav.
2. Navigation is available on all authenticated pages.

### 4.3 Dashboard

#### Requirements

- Route: `/dashboard`.
- Server-side prefetch + hydration for dashboard analytics query.
- Default analytics query baseline: relative `30d`, bucket `1d`, timezone `Asia/Jakarta`, fill mode `none`.
- Dashboard renders up to 12 metric cards from analytics endpoint.
- Each card shows category chip, mini trend chart, and summary stats.
- Supports loading, empty, and error states.

#### Acceptance Criteria

1. Dashboard loads from `/analytics/dashboard` through proxy.
2. If no dashboard metrics are available, user sees empty-state guidance.
3. Query parameters `bucket` and time range are supported in URL parsing.

### 4.4 Metric Category Library

#### Requirements

- Route: `/metric-categories`.
- Category list supports:
  - Search (`q`)
  - Sort
  - Pagination/infinite mode (`mode=pages|scroll`)
- Create/Edit/Delete category via modal-intercept routes.
- Category detail route (`/metric-categories/[categoryId]`) shows category info and contained metrics.

#### Acceptance Criteria

1. User can create, edit, and delete a category from list/detail contexts.
2. List state persists in URL and is restorable on reload.
3. Category detail allows navigation back to list with preserved return params.

### 4.5 Metrics Library

#### Requirements

- Route: `/metrics`.
- Metric list supports:
  - Search (`q`)
  - Sort
  - Pagination/infinite mode (`mode=pages|scroll`)
- Create/Edit/Delete metric via modal-intercept routes.
- Metric form includes category assignment and duplicate-name validation check.
- Category selector supports async typeahead and inline category creation.

#### Acceptance Criteria

1. User can create, edit, and delete metric records.
2. User can assign or clear category while creating/editing metric.
3. Duplicate metric name surfaces validation error before submit.

### 4.6 Metric Detail

#### Requirements

- Route: `/metrics/[metricId]`.
- Shared layout preloads metric detail and exposes:
  - Header summary
  - Breadcrumbs
  - Tabs (Overview, Logs, Settings)
- Overview tab renders visualization component.
- Visualization query is URL-driven (`viz-bucket`, `viz-range` or `viz-start`/`viz-end`) and supports bucket aliases: `1h`, `1d`, `1w`, `1m`, `1y`.

#### Acceptance Criteria

1. Invalid metric ID returns not-found state.
2. Detail route exposes loading and error boundaries.

### 4.7 Metric Logs

#### Requirements

- Route: `/metrics/[metricId]/logs`.
- Logs list supports search, sort, pagination.
- Create/Edit/Delete log entries via modal-intercept routes.
- Log form captures numeric value + datetime.

#### Acceptance Criteria

1. User can add, edit, and delete metric logs.
2. Logs list updates after mutation through React Query invalidation/update behavior.

### 4.8 Metric Settings

#### Requirements

- Route: `/metrics/[metricId]/settings`.
- User can create/update metric settings:
  - Goal enable/type/value
  - Timeframe enable/start/deadline
  - Alerts enable/threshold
  - Display options (show on dashboard, priority, chart type, color)
- Settings edit is opened through modal-intercept route.

#### Acceptance Criteria

1. User can save settings and see updated values on settings panel.
2. Validation enforces goal/timeframe rules from schema.
3. Delete settings action is not currently exposed in UI.

### 4.9 Account Page

#### Requirements

- Route: `/account`.
- Displays profile fields: username, email, role, profile visibility.
- Provides manual refresh action.

#### Acceptance Criteria

1. Account page is accessible only for authenticated users.
2. Profile displays current fetched values.
3. No profile-edit mutation flow is available in current UI.

---

## 5. End-to-End User Flows

### 5.1 Onboarding and First Data

1. User lands on `/`.
2. User opens `/register` and creates account.
3. User is redirected to `/dashboard`.
4. User opens category library and creates category.
5. User opens metrics library and creates metric.
6. User opens metric logs and adds first log entry.

### 5.2 Metric Review and Optimization

1. User opens `/metrics/[metricId]`.
2. User reviews trend chart (Overview tab).
3. User opens Settings tab and updates goal/display options.
4. User returns to dashboard to verify visibility.

### 5.3 Ongoing Library Management

1. User searches/sorts metrics and categories.
2. User switches list mode (pages vs scroll).
3. User edits/deletes stale items via row actions (desktop) or swipe actions (mobile).

---

## 6. Information Architecture and Route Inventory

| Route | Auth Required | Purpose |
| --- | --- | --- |
| `/` | No | Landing page with Login/Register CTAs |
| `/login` | No | User login |
| `/register` | No | User registration |
| `/dashboard` | Yes | Dashboard cards + trend snapshots |
| `/metrics` | Yes | Metric library list |
| `/metrics/new` | Yes | Create metric (page/modal intercept) |
| `/metrics/[metricId]` | Yes | Metric overview |
| `/metrics/[metricId]/edit` | Yes | Edit metric (page/modal intercept) |
| `/metrics/[metricId]/logs` | Yes | Metric log list |
| `/metrics/[metricId]/logs/new` | Yes | Create log (page/modal intercept) |
| `/metrics/[metricId]/logs/[logId]` | Yes | Edit log (page/modal intercept) |
| `/metrics/[metricId]/settings` | Yes | Metric settings read view |
| `/metrics/[metricId]/settings/edit` | Yes | Edit metric settings (page/modal intercept) |
| `/metric-categories` | Yes | Category library list |
| `/metric-categories/new` | Yes | Create category (page/modal intercept) |
| `/metric-categories/[categoryId]` | Yes | Category detail + metrics list |
| `/metric-categories/[categoryId]/edit` | Yes | Edit category (page/modal intercept) |
| `/metric-categories/[categoryId]/metrics/new` | Yes | Create metric from category context |
| `/metric-categories/[categoryId]/metrics/[metricId]` | Yes | Edit metric from category context |
| `/account` | Yes | Profile display |

---

## 7. Domain Model and Validation Rules

### 7.1 Core Entities

1. User
- `id`, `username`, `email`, `role`, `isPublicProfile`, timestamps.

2. Metric Category
- `id`, `name`, `color`, `icon`, `metricCount`, timestamps.

3. Metric
- `id`, `name`, `defaultUnit`, `description`, `isPublic`, `categoryId`, `originalMetricId`, timestamps.

4. Metric Log
- `id`, `metricId`, `logValue`, `loggedAt`, `type(manual|automatic)`, timestamps.

5. Metric Settings
- `id`, `metricId`, `goalEnabled`, `goalType`, `goalValue`, `timeFrameEnabled`, `startDate`, `deadlineDate`, `alertEnabled`, `alertThresholds`, `displayOptions`, timestamps.

### 7.2 Validation Highlights

1. Auth
- Username min 3 chars.
- Email format enforced.
- Password min 6 chars.
- Password and confirmation must match.

2. Metric
- Name required.
- Default unit required.

3. Metric Category
- Name required.
- Color/icon required with defaults.

4. Metric Log
- `metricId` must be UUID.
- `logValue` must be non-negative.
- `loggedAt` required.

5. Metric Settings
- If `goalEnabled=true`, `goalType` and `goalValue` are required.
- If `timeFrameEnabled=true`, both dates are required and `deadlineDate > startDate`.
- `alertThresholds` constrained to integer 0-100.

---

## 8. API Integration Contract

### 8.1 Frontend API Access Pattern

- Primary API surface: `/api/proxy/*` (Next.js route handler proxying to backend API).
- Auth cookie -> proxy injects `Authorization: Bearer <token>` for protected resource groups.
- Session cookie synchronization endpoint: `/api/auth/session` (POST/DELETE).

### 8.2 Resource Endpoints Consumed by Frontend

1. Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `POST /auth/logout`

2. Metrics
- `GET /metrics`
- `GET /metrics/:metricId`
- `POST /metrics`
- `PUT /metrics/:metricId`
- `DELETE /metrics/:metricId`
- `POST /metrics/dummy` (dev/test utility)

3. Metric Categories
- `GET /metric-categories`
- `GET /metric-categories/:categoryId`
- `POST /metric-categories`
- `PUT /metric-categories/:categoryId`
- `DELETE /metric-categories/:categoryId`
- `POST /metric-categories/dummy` (dev/test utility)

4. Metric Logs
- `GET /metric-logs`
- `GET /metric-logs/:logId`
- `POST /metric-logs`
- `PUT /metric-logs/:logId`
- `DELETE /metric-logs/:logId`
- `POST /metric-logs/:metricId/dummy` (dev/test utility)

5. Metric Settings
- `GET /metric-settings`
- `GET /metric-settings/:settingsId`
- `POST /metric-settings`
- `PUT /metric-settings/:settingsId`
- `DELETE /metric-settings/:settingsId` (API available; UI delete not exposed)
- `PATCH /metric-settings/:settingsId/achieve`
- `PATCH /metric-settings/:settingsId/display`

6. Analytics
- `GET /analytics/dashboard`
- `GET /analytics/metrics/:metricId`

---

## 9. Non-Functional Requirements

### 9.1 Performance

Current enforced thresholds (via scripts and CI):

1. Lighthouse categories (selected routes)
- Performance >= 70
- Accessibility >= 90
- Best Practices >= 90

2. Lab Web Vitals thresholds
- LCP <= 3600ms
- CLS <= 0.15
- INP <= 300ms

3. Bundle thresholds
- Total JS <= 3,000,000 bytes
- Largest chunk <= 300,000 bytes

### 9.2 Accessibility

1. Target baseline: WCAG 2.1 AA.
2. Semantic landmarks, keyboard behavior, visible focus, labeled controls.
3. A11y checks are included in integration testing setup (`jest-axe`) and release checklist guidance.

### 9.3 Security

1. HTTP security headers configured in `next.config.ts` (CSP, HSTS, X-Frame-Options, etc.).
2. Session token in HttpOnly cookie; auth guard at middleware + app layout + proxy layer.
3. Client-side error message sanitization to reduce unsafe rendering risk.
4. Security CI jobs include lint/audit and secret scanning.

### 9.4 Reliability and Error Handling

1. Route-level loading/error boundaries for dashboard and metric detail segments.
2. React Query with retries and cancellation handling.
3. API error normalization and user-friendly messaging fallback.
4. Skeleton/empty/error states across major list/detail views.

### 9.5 Responsive Behavior

1. Desktop table patterns for data-heavy views.
2. Mobile card + swipe actions for list item operations.
3. Bottom navigation for mobile app shell access.

---

## 10. Quality and Release Gates

### 10.1 CI Workflow Gates

`frontend-ci` currently runs:

1. Lint + CSS lint + typecheck
2. Unit tests (coverage artifact upload)
3. Integration tests
4. Build verification
5. E2E execution (Cypress)
6. Security scan (`npm audit` path)
7. Secret scan (gitleaks)

### 10.2 Performance Workflow

Scheduled/manual `frontend-performance` runs:

1. Build
2. Bundle threshold check
3. Lighthouse checks
4. Lab Web Vitals summary

### 10.3 Current Automated Test Surface

- Unit test files: 52
- Integration test files: 16
- E2E test files: 1

---

## 11. Success Metrics

### 11.1 Product Outcome Metrics (Target)

1. Activation: user can complete register/login and create first metric + log in one session.
2. Engagement: repeat metric logging and dashboard return usage.
3. Reliability: low failed mutation rate for core CRUD actions.

### 11.2 Engineering Quality Metrics (Current Operational)

1. CI pass rate across lint/type/test/build/security jobs.
2. Lighthouse and Web Vitals threshold pass rate.
3. Security scan and secret scan pass status.

---

## 12. Known Gaps and Current Limitations

1. Dashboard has URL-driven filter support but no dedicated in-page controls for bucket/range.
2. Metric settings expose `chartType`, but current chart rendering is line-chart only.
3. Metric settings delete capability exists in API hooks but is not exposed in current UI.
4. Account page is read-only (no profile update form/workflow).
5. E2E coverage is minimal compared to unit/integration coverage.
6. Legacy/internal routes and utilities exist (`/api/auth/login`, `/api/auth/logout`, legacy `useAuth` hook) but are not primary production flow paths.

---

## 13. Dependencies and Runtime Configuration

### 13.1 Required Environment Configuration

1. `API_URL` or `NEXT_PUBLIC_API_BASE_URL` for backend proxy target.
2. Optional app-origin env vars used by API base URL resolution for server-side requests:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VERCEL_URL`
- `VERCEL_URL`

### 13.2 Optional Feature Flags

1. `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS=true`
- Enables dummy data generation actions in list UIs.
- Intended for non-production/testing usage.

---

## 14. Post-Baseline Roadmap (Recommended)

1. Add dashboard filter controls UI (bucket + range) with explicit UX controls.
2. Implement chart type rendering parity with settings (`line/bar/area/pie`).
3. Add account profile edit flow (and password/change email strategy if required).
4. Expand E2E coverage to critical authenticated CRUD and settings flows.
5. Evaluate role-based UI behavior if admin workflows become product requirement.
