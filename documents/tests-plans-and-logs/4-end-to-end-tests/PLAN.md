# End-to-End (E2E) Test Plan – Lakira Frontend

This document describes the **end-to-end (E2E) testing strategy** for the Lakira frontend.  
E2E tests validate **full user flows in a real browser** against a running Lakira backend (or a fully mocked API layer), ensuring that critical journeys behave correctly in a production-like environment.

---

## 1. Goals

E2E tests for Lakira aim to:

1. Verify that **core user journeys** (auth, metrics, logging, dashboard, settings) work end to end.
2. Catch **integration issues** between frontend, backend, routing, authentication, and browser environment that unit/integration tests may miss.
3. Provide **high confidence before releases** via a small but powerful suite of “smoke” tests.
4. Act as a **safety net** for future refactors across features or layers.

E2E tests are intentionally **few but high-value** and focus on **business-critical flows**, not every edge case.

---

## 2. Tooling & Environment

### 2.1 Test framework

- **Primary framework**: Cypress or Playwright (Cypress is assumed in this plan; adapt naming if using Playwright).
- **Assertion library**: built-in assertion library (Chai for Cypress, Playwright expect, etc.).
- **Accessibility**: `cypress-axe` for a11y checks on key flows.

### 2.2 Environment

E2E tests should run against a dedicated **test environment**:

- A deployed test/staging instance of:
  - Next.js frontend (same build as production, but with test config).
  - Express/Sequelize backend with a **test database**.
- OR a local `docker-compose` environment started as part of the test run.

Current environment decision (2026-02-18):

- Local and CI base URL: `http://127.0.0.1:3000`.
- CI source of truth: `.github/workflows/test.yml` via `CYPRESS_BASE_URL`.
- Cypress fallback: `cypress.config.ts` uses `CYPRESS_BASE_URL || "http://127.0.0.1:3000"`.
- Local run pattern: start app (`npm run start -- --hostname 127.0.0.1 --port 3000`), then run `npm run test:e2e`.

### 2.3 Test data strategy

We need **predictable, repeatable data**:

- Prefer a **known seed state** before running E2E tests:
  - run DB migrations and seed scripts,
  - or call a “reset test data” admin endpoint before the test suite.
- Use one or more **test users** with well-defined data:
  - `test_user_basic` – freshly created, no metrics.
  - `test_user_with_metrics` – has metrics, categories, and logs pre-seeded.

Current data strategy decision (2026-02-18):

- Until dedicated seed/reset automation is available, E2E scope is limited to stateless smoke coverage.
- Stateful multi-user scenarios remain planned and should be enabled only after backend reset or seed hooks are available.

---

## 3. Authentication Handling in E2E

Authenticating in E2E can be expensive if done via UI in every test.

We will follow this pattern:

1. Have **one test** that logs in via the UI (login form).
2. For other tests, login is done **programmatically**:
   - Call backend login API,
   - store returned token as cookie/localStorage/session according to the app logic,
   - then visit the app as an already-authenticated user.

This keeps tests accurate but fast.

Current auth decision (2026-02-18):

- Auth session is maintained via HttpOnly cookie `lakira_token` (`/api/auth/session` route).
- Canonical helper path: `cypress/support/commands.ts`.
- Implemented helpers:
  - `cy.loginAsTestUser(args?)` for API-backed login.
  - `cy.setInvalidAuthToken(token?)` for token-expiry/invalid-session scenarios.
- Additional role-specific helper variants remain planned.

---

## 4. Scope – Flows Covered by E2E

E2E tests focus on Lakira’s **critical flows** linked to the PRD:

1. **Authentication flows**
2. **Metric & category lifecycle**
3. **Metric logging & dashboard visualisation**
4. **Metric settings & goals**
5. **Authorisation & routing guards**
6. **Account/settings (if present)**

For each, we define required scenarios below.

---

## 4.1 Authentication Flows

**Pages/components:**

- Login page
- Registration page (if available)

**Scenarios:**

1. **Successful registration → login redirect**
   - Visit registration page.
   - Fill valid user details.
   - Submit and verify:
     - registration success message or auto-login,
     - redirect to onboarding screen or dashboard.

2. **Successful login**
   - Visit login page.
   - Enter valid credentials for `test_user_with_metrics`.
   - On submit:
     - user is redirected to dashboard,
     - key dashboard elements are visible (e.g. metric cards).

3. **Invalid credentials**
   - Enter wrong password.
   - Verify:
     - error message visible,
     - user stays on login page,
     - no authenticated-only elements shown.

4. **Logout**
   - Start from authenticated state (`cy.loginAs...` helper).
   - Click logout.
   - Verify:
     - auth state cleared (no token),
     - navigation to login page,
     - trying to access `/app/...` redirects back to login.

---

## 4.2 Metric Category & Metric Lifecycle

**Goal:** Confirm that a user can **define structure** of what they track.

**Scenarios:**

1. **Create metric category**
   - From authenticated state, navigate to metric categories page.
   - Use form to create a new category (name, icon, color).
   - Verify:
     - category appears in the category list,
     - category is selectable when creating a metric.

2. **Create metric using that category**
   - Navigate to metric creation view.
   - Select the newly-created category.
   - Fill metric details (name, unit, type, etc.).
   - Submit:
     - metric appears in metric library/list,
     - metric appears as available choice when logging data.

3. **Edit metric**
   - Open existing metric detail/edit view.
   - Change name/goal/visibility.
   - Save:
     - updated values are visible in the list and detail view.

4. **Soft delete / archive metric (if supported)**
   - Delete/archive an existing metric.
   - Verify:
     - metric disappears from the active list,
     - but remains accessible if there is an archived view (depending on design).

<!-- SPECIAL NOTE: Add real route paths + selectors once components/pages are finalized, e.g. `/app/metric-categories`, `/app/metrics`. -->

---

## 4.3 Metric Logging & Dashboard

**Goal:** Ensure logging a metric value updates views that rely on it.

**Scenarios:**

1. **Log new value and see it in history**
   - Start authenticated as `test_user_with_metrics` with at least one metric.
   - Navigate to metric detail page.
   - Open log form and submit a new value.
   - Verify:
     - new log entry appears in the log list/history with correct date/value.

2. **Log new value and see dashboard update**
   - From dashboard:
     - capture baseline value (e.g., latest value, daily total, or chart datapoint).
   - Log a new value for the same metric (via detail or quick log).
   - Return to dashboard:
     - verify updated value/chart reflects the new log.

3. **Error when logging**
   - Force backend to return an error for log creation (via test fixture or test-only endpoint/failure mode).
   - Verify:
     - an error notification is shown,
     - log form remains usable or is reset appropriately,
     - dashboard is not updated with incorrect data.

---

## 4.4 Metric Settings & Goals

**Goal:** Validate that **goal configuration** works and propagates to the UI.

**Scenarios:**

1. **Set goal for a metric**
   - Open metric settings.
   - Set a target value and goal type (e.g., ≥, ≤, between).
   - Save:
     - goal is displayed on metric detail,
     - goal badge or indicator appears on dashboard.

2. **Update goal**
   - Change goal value/type.
   - Verify UI updates accordingly (e.g., new threshold line in chart, updated badge text).

3. **Remove/disable goal**
   - Remove goal or toggle “goal tracking” off.
   - Verify:
     - goal indicators disappear from dashboard and detail views.

---

## 4.5 Authorisation & Routing Guards

**Goal:** Ensure that protected routes are not accessible without proper auth.

**Scenarios:**

1. **Unauthenticated access redirect**
   - Without valid auth state, visit a protected route (e.g., `/app/dashboard`).
   - Verify redirect to login page, with optional `redirect` query parameter.

2. **Direct URL navigation while authenticated**
   - With valid auth:
     - Navigate directly to `/app/metrics/:id`.
     - Page loads correct data without requiring user to go through dashboard first.

3. **Expired/invalid token handling**
   - Simulate invalid/expired token (e.g. by manipulating storage or using a seeded invalid token).
   - Attempt to visit a protected route.
   - Verify:
     - either redirect to login or clear auth state + show error,
     - no stale data rendered as if user were logged in.

Current token-expiry simulation decision (2026-02-18):

- Add helper that writes an invalid/expired auth cookie token and attempts protected route navigation.
- Expected assertion: redirect to `/login` or auth state cleared with a recoverable error UI.

---

## 4.6 Account / Profile Settings (If Present)

**Scenarios:**

1. **Update profile**
   - Change display name or avatar (if supported).
   - Save:
     - verify update persisted by reloading page.

2. **Update privacy or notification settings**
   - Toggle a setting.
   - Reload or revisit the page:
     - verify that toggle retains updated value.

---

## 5. Accessibility in E2E

For key flows we also run **automated accessibility checks** using `cypress-axe`:

- Login page
- Dashboard
- A main “metrics” page (e.g., metrics list or metric detail)
- A primary form (e.g., metric create, metric log)

For each of these:

- Inject axe after page load.
- Run `cy.checkA11y()` on the full page or key container.
- Either:
  - Assert **no violations**, or
  - Document known acceptable issues with comments.

See also:

- `documents/tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md`
- `documents/checklists/a11y-release-checklist.md`

---

## 6. Test Organisation & Naming

### 6.1 File structure

Recommended structure (for Cypress):

```text
cypress/
  e2e/
    auth.cy.ts
    dashboard.cy.ts
    metric-lifecycle.cy.ts
    metric-logging.cy.ts
    metric-settings.cy.ts
    routing-guards.cy.ts
    profile.cy.ts         # if applicable
```
