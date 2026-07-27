# Integration Test Plan – Lakira Frontend

This document describes the **integration test** strategy for the Lakira frontend.  
Integration tests sit between unit tests and end-to-end tests in the testing pyramid and are critical for ensuring that **components, pages, and client-side logic work together correctly**.

---

## 1. Goals

Integration tests for Lakira aim to:

1. Verify that **pages and feature modules** behave correctly when composed with:
   - React Query
   - Jotai (or other state management)
   - React Hook Form
   - Next.js routing/navigation
   - Design system components (cards, forms, typography, etc.).
2. Validate **loading / success / empty / error states** for all data-driven screens.
3. Catch regressions in **form validation**, **interactive flows**, and **local state changes** without requiring a real browser.
4. Provide **fast feedback** in CI while covering more behaviour than unit tests.
5. Enforce basic **accessibility and UX contracts** for core components and layouts.

---

## 2. Definition – What counts as an integration test?

For Lakira, a test is considered an **integration test** if:

- It renders **one or more real components or pages** with the actual providers (React Query, Jotai, Theme, etc.) using a shared `renderWithProviders` helper.
- It interacts with the UI via **React Testing Library** (queries and user-events), not by calling component methods directly.
- It uses **MSW** (Mock Service Worker) or similar to mock HTTP calls instead of mocking fetch/axios inline.
- It verifies behaviour across layers:
  - UI ↔ forms ↔ React Query ↔ API client (mocked network)
  - Local state ↔ UI rendering
  - Routing side effects (redirects, query params) via mocked router.

Unit tests are for **pure functions**; E2E tests are for **real browser flows**. Integration tests sit in the middle.

---

## 3. Tooling & Test Harness

- **Test runner**: Jest
- **DOM utilities**: React Testing Library (`@testing-library/react`, `@testing-library/user-event`)
- **Network mocking**: MSW (Mock Service Worker) with typed handlers
- **Accessibility checks** (for selected tests): `jest-axe`

### 3.1 Shared render helper

All integration tests should use a shared helper, e.g. `renderWithProviders`, that:

- Wraps components with:
  - React Query `QueryClientProvider`
  - Jotai/Store provider (if applicable)
  - Theme provider / CSS reset
  - Router context (mock implementation for Next.js)
- Provides sane defaults for:
  - initial query cache / preloaded state
  - test-friendly configuration for React Query (e.g. `retry: false`)

Current decision (2026-02-18):

- Canonical helper path: `src/test-utils/renderWithProviders.tsx`.
- Minimum helper options: `{ route?: string; queryClient?: QueryClient; initialQueryData?: { queryKey: QueryKey; data: unknown }[] }`.
- Helper is implemented with React Query + Jotai providers and optional route/query-cache seeding.
- MSW server/handlers + global Jest lifecycle wiring are active in:
  - `src/test-utils/msw/server.ts`
  - `src/test-utils/msw/handlers.ts`
  - `jest.integration.setup.ts`
  - `jest.integration.config.ts`
- Current baseline integration specs:
  - `src/features/auth/components/__tests__/LoginForm.int.test.tsx`
  - `src/features/auth/components/__tests__/RegisterForm.int.test.tsx`
  - `src/features/metric-categories/components/__tests__/MetricCategoryForm.int.test.tsx`
  - `src/app/(app)/metric-categories/_components/__tests__/MetricCategoriesPageClient.int.test.tsx`
  - `src/app/(app)/metric-categories/[categoryId]/_components/__tests__/MetricCategoryHeaderSection.int.test.tsx`
  - `src/app/(app)/metric-categories/[categoryId]/_components/__tests__/MetricListSection.int.test.tsx`
  - `src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`
  - `src/app/(app)/metrics/[metricId]/logs/_components/__tests__/MetricLogsClient.int.test.tsx`
  - `src/features/metrics/components/__tests__/MetricForm.int.test.tsx`
  - `src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
  - `src/app/(app)/metrics/_components/__tests__/MetricsPageClient.int.test.tsx`
  - `src/app/(app)/dashboard/_components/__tests__/DashboardContent.int.test.tsx`
  - `src/app/(app)/metrics/[metricId]/_components/__tests__/MetricDetailComposite.int.test.tsx`
  - `src/components/layout/__tests__/BottomNavigationBar.int.test.tsx`
  - `src/components/layout/__tests__/Sidebar.int.test.tsx`
  - `src/components/layout/__tests__/Layout.int.test.tsx`
- Initial integration-level a11y assertions are now implemented in:
  - `src/features/auth/components/__tests__/LoginForm.int.test.tsx` (via `jest-axe`).
  - `src/features/auth/components/__tests__/RegisterForm.int.test.tsx` (via `jest-axe`).
  - `src/features/metric-categories/components/__tests__/MetricCategoryForm.int.test.tsx` (via `jest-axe`).
  - `src/app/(app)/metric-categories/_components/__tests__/MetricCategoriesPageClient.int.test.tsx` (via `jest-axe`).
  - `src/app/(app)/metric-categories/[categoryId]/_components/__tests__/MetricCategoryHeaderSection.int.test.tsx` (via `jest-axe`).
  - `src/app/(app)/metric-categories/[categoryId]/_components/__tests__/MetricListSection.int.test.tsx` (via `jest-axe`).
  - `src/features/metric-logs/components/__tests__/LogForm.int.test.tsx` (via `jest-axe`).
  - `src/app/(app)/metrics/[metricId]/logs/_components/__tests__/MetricLogsClient.int.test.tsx` (via `jest-axe`).
  - `src/features/metrics/components/__tests__/MetricForm.int.test.tsx` (via `jest-axe`).
  - `src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx` (via `jest-axe`).
  - `src/app/(app)/metrics/_components/__tests__/MetricsPageClient.int.test.tsx` (via `jest-axe`).
  - `src/app/(app)/dashboard/_components/__tests__/DashboardContent.int.test.tsx` (via `jest-axe`).
  - `src/app/(app)/metrics/[metricId]/_components/__tests__/MetricDetailComposite.int.test.tsx` (via `jest-axe`).
  - `src/components/layout/__tests__/BottomNavigationBar.int.test.tsx` (via `jest-axe`).
  - `src/components/layout/__tests__/Sidebar.int.test.tsx` (via `jest-axe`).
  - `src/components/layout/__tests__/Layout.int.test.tsx` (via `jest-axe`).

---

## 4. Scope & Coverage Strategy

### 4.1 What we always cover for data-driven views

For every page or feature that fetches data (via React Query):

1. **Loading state**
   - Skeletons/spinners are shown while data is being fetched.
2. **Success state**
   - Data is rendered correctly (lists, tables, charts, detail views).
3. **Empty state**
   - When the API returns an empty list or `null`, the UI shows an appropriate empty message and CTA.
4. **Error state**
   - When the API fails (4xx/5xx), the UI shows a friendly error message and, where applicable, retry actions.

### 4.2 What we always cover for forms

For every non-trivial form (authentication, metrics, settings, logging):

1. **Initial render**
   - All required fields and labels are present.
   - Default values are applied for edit forms.
2. **Validation**
   - Client-side validation errors appear for invalid inputs on submit.
   - Server-side validation errors are surfaced correctly (e.g. inline or toast).
3. **Submission**
   - Valid data triggers the appropriate mutation (React Query mutate function).
   - On success, the expected side effects occur:
     - cache invalidation / updates,
     - redirect or modal close,
     - optimistic updates or success messages.
4. **Error handling**
   - Server errors show UI feedback and do not leave the form in a broken state.

---

## 5. Targets – Features and Pages

This section defines **which features** must have integration tests and what scenarios to cover.

> For each feature below, at least **one integration test file** should exist.

### 5.1 Authentication

**Key components/pages**

- Login page
- Registration page
- (If present) Password reset / change password flows

**Scenarios**

- Successful login with correct credentials:
  - Calls login mutation with correct payload.
  - Stores auth token in client state and triggers redirect (router interaction).
- Invalid credentials:
  - Shows error message from server.
  - Does _not_ change authenticated state.
- Basic accessibility:
  - Inputs associated with labels.
  - Error messages reachable via `aria-describedby` or similar.

Current routes/components in scope:

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/RegisterForm.tsx`

---

### 5.2 Dashboard

**Purpose**

Aggregated view of tracked metrics, goals, and recent activity.

**Scenarios**

- Loading: skeletons or loading indicators visible initially.
- Success with data:
  - Cards rendered for each active metric.
  - Charts rendered with the correct series for provided buckets.
- Empty state:
  - When no metrics are configured, show an empty message and CTA to create metrics.
- Error:
  - For 5xx from `/metrics` or `/metrics/logs`, render an error state with retry.

---

### 5.3 Metric Categories

**Key components/pages**

- Metric Category List (table/list view)
- Metric Category Form (create/edit)

**Scenarios**

- List:
  - Renders categories returned from API.
  - Sorting, filtering, or search (if implemented) modifies the view correctly.
- Form:
  - Create:
    - Valid inputs → calls `createMetricCategory` mutation with correct payload.
    - After success → list is refetched or optimistic updated.
  - Edit:
    - Pre-fills existing values on load.
    - Save updates existing category and updates list/table.

---

### 5.4 Metrics

**Key components/pages**

- Metric List / Library page
- Metric Create/Edit modal or page

**Scenarios**

- Display:
  - Loading data (skeletons).
  - Renders metric cards/rows from the API.
- Create/edit:
  - Required fields validated (name, unit, category, etc.).
  - Proper payload sent on submit.
  - For edit, initial values match API data.

---

### 5.5 Metric Logs

**Key components/pages**

- Metric Log form
- Metric history / log list within metric detail page

**Scenarios**

- Logging a value:
  - Filling value + date/time and submitting calls log mutation.
  - After success, history list updates (new log at correct position).
- Empty & error states for history view.
- Edge cases:
  - Attempts to submit empty/invalid value show appropriate validation messages.

---

### 5.6 Metric Detail & Visualization

**Key components/pages**

- Metric detail page (combining metric info, settings, logs, charts).

**Scenarios**

- Page fetches metric detail + logs + settings and:
  - renders metric name, description, and unit;
  - renders current goal/target (if any);
  - renders chart with data from logs (via transformation utilities).
- Changing settings (e.g. goal) updates visible values and triggers cache updates.
- Changing filters (date range, granularity) adjusts chart data.

---

### 5.7 Account / Profile Settings (if present)

**Scenarios**

- Profile update:
  - Form fields pre-filled with current user data.
  - Submitting valid changes calls update mutation and shows feedback.
- Privacy / notification settings toggles:
  - Toggling switches updates server state and UI.

<!-- SPECIAL NOTE: If there are additional feature modules (e.g., reminders, notifications, templates),
     replicate the same pattern: list components/pages and define key scenarios. -->

---

## 6. Accessibility Expectations for Integration Tests

Integration tests won’t cover **all** accessibility details, but they should:

1. Use semantic HTML and accessible components from the design system.
2. For **selected critical pages/components** (auth forms, dashboard, main forms), run:
   - `jest-axe` analysis and assert there are no violations (or document acceptable exceptions).
3. Verify:
   - Each input has an associated `<label>` or `aria-label`.
   - Error messages are tied to fields via `aria-describedby` where applicable.

Detailed steps and which components/pages to include are defined in:

- `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md`

---

## 7. Test Organization & Naming

- Integration tests should live **close to the code they test**, following:
  - `SomeComponent.tsx` → `SomeComponent.int.test.tsx`  
    or
  - `page.tsx` → `page.int.test.tsx`

  This makes it clear they are **integration** tests (not unit tests).

Current naming decision (2026-02-18):

- Existing tests use `*.test.tsx` under colocated `__tests__` folders.
- New integration tests should use `*.int.test.tsx` to separate intent from pure unit tests while remaining Jest-discoverable.

- Group tests by **feature**, not by technical concern:
  - Prefer `MetricCategoryForm.int.test.tsx` over `FormValidation.int.test.tsx`.

---

## 8. Data & Fixtures Strategy

- Use small, **hand-crafted fixtures** in each test file for clarity.
- For more complex cases, use shared fixtures:
  - e.g. `tests/fixtures/metrics.ts`, `tests/fixtures/metricLogs.ts`.

- MSW handlers should be **typed** using generated OpenAPI/TS types, ensuring contract correctness.

Current fixture/MSW location decision (2026-02-18):

- Shared fixtures target path: `src/test-utils/fixtures/*`.
- MSW target paths: `src/test-utils/msw/handlers.ts` and `src/test-utils/msw/server.ts`.
- If a feature requires local-only fixtures, colocate under `src/<feature>/__tests__/fixtures/*` and keep names feature-scoped.

---

## 9. CI Expectations & Exit Criteria

### 9.1 Minimum coverage expectations

- At least **one integration test** for:
  - Each major page/route under `/app` (dashboard, metrics, categories, logs, settings).
  - Each complex form (auth, metric create/edit, log creation, settings).
- Critical flows (auth, dashboard, metrics) must have tests for:
  - loading
  - success
  - error
  - relevant empty states

### 9.2 CI

- Integration tests run on every **PR** and **main** branch commit.
- PRs that add or significantly modify a feature should:
  - Update or add at least one integration test.
  - Keep existing integration tests passing.

---

## 10. Maintenance

- When refactoring a feature module:
  - Update the associated integration tests in the same PR.
  - Ensure test names still accurately describe behaviour.
- When adding new routes/pages:
  - Extend this plan (or link a smaller per-feature plan) to define integration test scenarios.
- Periodically (e.g. quarterly), review:
  - Gaps between the **PRD** and existing integration tests.
  - Gaps highlighted by E2E tests that would be cheaper to catch via integration tests.
