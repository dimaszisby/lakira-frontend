# Integration Test Checklist – Lakira Frontend

Use this checklist whenever you:

- Add/modify a **data-driven page** (dashboard, metrics, categories, logs, settings), or
- Introduce/modify a **non-trivial form** (auth, metric, log, settings).

This complements the detailed plan in `PLAN.md`.

---

## 0. Pre-setup (once per project / rarely touched)

Before adding new integration tests, confirm the basics:

- [x] A shared `renderWithProviders` helper exists and is used (React Query, Jotai/store, Theme, Router).
- [x] MSW is configured for tests:
  - [x] Global setup/teardown hooks start and stop the MSW server.
  - [x] Handlers scaffold exists for feature endpoint mocks.
- [x] Integration Jest runner is configured (`jest.integration.config.ts`) and wired from `test:integration`.

Decision references:

- `renderWithProviders` target: `src/test-utils/renderWithProviders.tsx`
- MSW targets: `src/test-utils/msw/server.ts`, `src/test-utils/msw/handlers.ts`
- Integration Jest setup target: `jest.integration.setup.ts`
- Baseline integration specs:
  - `src/features/auth/components/__tests__/LoginForm.int.test.tsx`
  - `src/features/metric-categories/components/__tests__/MetricCategoryForm.int.test.tsx`
  - `src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`
  - `src/features/metrics/components/__tests__/MetricForm.int.test.tsx`
  - `src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
  - `src/app/(app)/metrics/_components/__tests__/MetricsPageClient.int.test.tsx`
  - `src/app/(app)/dashboard/_components/__tests__/DashboardContent.int.test.tsx`
  - `src/app/(app)/metrics/[metricId]/_components/__tests__/MetricDetailComposite.int.test.tsx`
- Baseline integration a11y assertions currently implemented in:
  - `src/features/auth/components/__tests__/LoginForm.int.test.tsx` (`jest-axe`).
  - `src/features/metric-logs/components/__tests__/LogForm.int.test.tsx` (`jest-axe`).
  - `src/features/metrics/components/__tests__/MetricForm.int.test.tsx` (`jest-axe`).
  - `src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx` (`jest-axe`).
  - `src/app/(app)/dashboard/_components/__tests__/DashboardContent.int.test.tsx` (`jest-axe`).
  - `src/app/(app)/metrics/[metricId]/_components/__tests__/MetricDetailComposite.int.test.tsx` (`jest-axe`).

---

## 1. For Each New/Updated Feature

For every feature or page you touch in a PR, run through this section.

### 1.1 Test file basics

- [ ] There is at least **one integration test file** for the feature:
  - canonical pattern: `FeatureName.int.test.tsx` or `page.int.test.tsx`.
- [ ] Test names describe **behaviour** (what the user sees/does), not implementation:
  - ✅ `renders empty state when there are no metrics`
  - ❌ `calls useGetMetrics with empty array`

---

### 1.2 Rendering with correct providers

- [ ] Tests use `renderWithProviders` (or equivalent) to wrap:
  - [ ] React Query
  - [ ] Jotai/store (if used)
  - [ ] Theme provider / styling
  - [ ] Router context (for navigation/redirect assertions)
- [ ] Any feature-specific provider requirements are satisfied (e.g. feature-level context).

---

### 1.3 Network mocking with MSW

For each API endpoint used by the feature:

- [ ] There is an MSW handler covering the **happy path** (under `src/test-utils/msw/handlers.ts`).
- [ ] There is an MSW handler (or override) for **error scenarios** (4xx/5xx).
- [ ] Handlers are typed against your OpenAPI/TS types where possible.

In tests:

- [ ] You use MSW to override responses for specific scenarios (success/empty/error) **instead of** mocking `fetch`/`axios` directly.
- [ ] React Query is configured appropriately for tests:
  - [ ] `retry: false` for queries that are expected to fail in tests (to avoid delays/flakiness).

---

### 1.4 UI state coverage (data-driven views)

For each data-driven page or component:

- [ ] **Loading state** is covered:
  - [ ] A test asserts loading indicators/skeletons appear while data is pending.
- [ ] **Success state** is covered:
  - [ ] A test renders the component with a “normal” API response and asserts that:
    - key items, cards, rows, or charts appear as expected;
    - important derived values/text (e.g., totals, averages) are displayed.
- [ ] **Empty state** is covered:
  - [ ] API returns empty list or `null`.
  - [ ] Test asserts the UI shows an empty state message + relevant CTA (e.g., “Create metric”).
- [ ] **Error state** is covered:
  - [ ] API returns 4xx/5xx.
  - [ ] Test asserts a friendly error message and/or retry control is rendered.
  - [ ] UI doesn’t crash or get stuck in loading.

---

### 1.5 Forms & mutations

For each non-trivial form (auth, metric, log, settings, profile):

- [ ] **Initial render**
  - [ ] All visible inputs have visible labels.
  - [ ] Default values are present for edit forms (values match loaded data).
- [ ] **Client-side validation**
  - [ ] Invalid input (e.g. missing required field) shows validation messages.
  - [ ] Submit is blocked when validation fails.
- [ ] **Server-side errors**
  - [ ] When MSW returns a 4xx with validation errors, the UI surfaces them appropriately (inline or toast).
- [ ] **Successful submission**
  - [ ] Test submits valid data and asserts:
    - the correct mutation function is called with the expected payload;
    - UI reacts properly (success message, close modal, redirect, etc.).
  - [ ] React Query cache is updated / invalidated:
    - e.g. new metric/category/log shows up in list after submission.
- [ ] **Disabled / loading state**
  - [ ] While submitting, submit button is disabled or shows loading state to avoid double-submit (if implemented).

---

### 1.6 Behaviour & interaction

- [ ] Tests use `userEvent` to interact with the UI (typing, clicking, selecting).
- [ ] For components with conditional UI (tabs, filters, toggles):
  - [ ] Tests assert that toggling/filtering updates the visible subset of data.
- [ ] For components/pages that use routing:
  - [ ] Tests assert redirects/navigation by:
    - inspecting router-mock calls, or
    - checking that the expected UI for the target route appears.
- [ ] Routing mock strategy follows one of:
  - file-level `jest.mock("next/navigation", ...)` for targeted tests, or
  - central helper support from `renderWithProviders` where applicable.

---

## 2. Accessibility (Integration Level)

For **key pages/components** (auth screens, dashboard, main forms):

- [ ] Tests run `jest-axe` (or equivalent) on the rendered output.
- [ ] There are **no critical accessibility violations**, or known issues are documented.

Basic checks (manual or via assertions):

- [ ] Every form input has an associated `<label>` or `aria-label`.
- [ ] Error messages are linked to their inputs where appropriate (e.g. `aria-describedby`).
- [ ] Interactive elements use appropriate semantic roles (`button`, `link`, etc.).

Refer to:

- `documents/tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md`  
  for more detailed a11y expectations.

---

## 3. Data, fixtures, and assertions

- [ ] Test data is **realistic but minimal** (only fields the UI actually uses).
- [ ] Tests don’t rely on **exact JSON structure** unless necessary; they assert UI output rather than implementation details.
- [ ] When using shared fixtures:
  - [ ] Fixtures live in a common location (e.g. `tests/fixtures/*`).
  - [ ] Fixture naming clearly communicates intent (e.g. `metricsWithLogs`, `emptyMetricList`).

Assertions:

- [ ] Prefer queries that mimic user behaviour:
  - `getByRole`, `getByText`, `getByLabelText`, `getByPlaceholderText`, etc.
- [ ] Avoid brittle selectors:
  - No `getByTestId` unless there is no accessible alternative.
- [ ] Avoid overly generic `getByText` on dynamic content that might change often.

---

## 4. Performance & reliability of tests

- [ ] Tests complete quickly:
  - [ ] No unnecessary `waitFor` with long timeouts.
  - [ ] React Query retries disabled for failing scenarios.
- [ ] No test relies on **test ordering** or shared mutated state.
- [ ] Cleanup (unmount/reset handlers/cache) happens via shared utilities or testing framework hooks.

---

## 5. CI & PR expectations

Before merging a PR that touches integration-covered features:

- [ ] All integration tests pass locally.
- [ ] CI integration test job is green.
- [ ] If you modify behaviour or UX:
  - [ ] Existing tests are updated to reflect the new behaviour.
  - [ ] New scenarios are added where applicable (e.g. new empty/error states).
- [ ] If adding a new core page/flow:
  - [ ] At least one integration test exists that covers the **happy path**.
  - [ ] Consider whether an accompanying E2E test should be added/updated.

---

## 6. Documentation & cross-links

- [ ] If you add or significantly change a feature’s integration tests:
  - [ ] Update `PLAN.md` if coverage strategy changes.
  - [ ] Add comments in the test file for any **non-obvious** mocking or setup.
- [ ] When you find a bug that **should** have been caught by integration tests:
  - [ ] Add a regression test.
  - [ ] Optionally, log the case in a test log or issue tracker for future analysis.

---
