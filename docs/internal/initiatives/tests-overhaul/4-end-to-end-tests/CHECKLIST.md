# End-to-End (E2E) Test Checklist – Lakira Frontend

Use this checklist when:

- Creating/updating **E2E specs** (e.g. `auth.cy.ts`, `dashboard.cy.ts`), or
- Preparing a **release** and verifying core flows still work end-to-end.

This complements the detailed plan in `PLAN.md`.

---

## 0. Global Setup (once / rarely changed)

Before relying on E2E tests, ensure:

- [x] There is a **stable base URL** for the E2E environment.
  - Current value: `http://127.0.0.1:3000` (CI uses `CYPRESS_BASE_URL` in `.github/workflows/test.yml`).
- [ ] Backend + DB test environment is reproducible:
  - [ ] Migrations/seed scripts can be run to reset state.
  - [ ] Or a “reset test data” endpoint/command exists.

- [x] Cypress/Playwright is configured to:
  - [x] Point to the correct base URL.
  - [x] Use TypeScript (if applicable).
  - [x] Load any required env variables (test users, tokens, etc.).

- [x] There is a **login helper**:
  - e.g. `cy.loginAsBasicUser()`, `cy.loginAsUserWithMetrics()`.
  - Canonical helper path: `cypress/support/commands.ts` (`cy.loginAsTestUser`, `cy.setInvalidAuthToken`).

- [ ] There is a **data reset strategy**:
  - [ ] Either: DB reset/seed between test runs/specs, or
  - [ ] Test specs are written to be safe with shared seeded data.

---

## 1. Per-Spec File Basics

For each new/updated E2E spec file (e.g. `auth.cy.ts`, `dashboard.cy.ts`):

- [ ] File name reflects **business domain** (auth, dashboard, metrics, etc.), not just “misc”.
- [ ] Tests inside are named by **user behaviour / scenario**:
  - ✅ `logs in and redirects to dashboard`
  - ✅ `logs metric and sees dashboard update`
  - ❌ `sets isAuthenticated to true in store`
- [ ] Spec defines its **preconditions** clearly in comments (user type, seed state, etc.).

---

## 2. Authentication & Session Handling

When a flow depends on authentication:

- [ ] There is **at least one test** that logs in via the **UI form**:
  - Fill email/password, click submit, verify redirect & UI state.

- [ ] Other tests use a **programmatic login helper**:
  - [ ] Helper calls login API (or uses a known token).
  - [ ] Stores auth token/session in the correct place (cookie/localStorage/etc.).
  - [ ] After helper, visiting a protected page shows authenticated UI without going through the login form.

- [ ] Logout behaviour is covered:
  - [ ] Calling the logout UI clears auth state.
  - [ ] After logout, attempting to access `/app/...` redirects to login.

Auth mechanism decision:

- Session cookie name: `lakira_token` (HttpOnly; synced via `/api/auth/session` route).
- E2E auth helper should use API-backed login and cookie state, not direct UI typing for every spec.

---

## 3. Core Flows – Checklist by Domain

### 3.1 Auth Flow

- [ ] **Login success** is covered:
  - [ ] Valid credentials → redirect to dashboard.
  - [ ] Dashboard key elements are visible.

- [ ] **Login failure** is covered:
  - [ ] Invalid credentials → error message displayed.
  - [ ] User remains on login page and no auth state persists.

- [ ] (If registration is exposed in UI) **Registration → login** is covered:
  - [ ] Registration form submits successfully.
  - [ ] User is logged in or can log in with new account.

---

### 3.2 Metric Category & Metric Lifecycle

- [ ] **Create metric category**:
  - [ ] From authenticated state, user can open categories page,
  - [ ] Fill in category details (name, icon, color),
  - [ ] See new category in category list.

- [ ] **Create metric using new category**:
  - [ ] Metric creation flow allows selecting the new category,
  - [ ] Metric appears in metric list/library.

- [ ] **Edit metric**:
  - [ ] Edit screen can be opened,
  - [ ] Name/goal/visibility updates persist after save and page reload.

- [ ] (If implemented) **Delete/archive metric**:
  - [ ] Deleted/archived metric is removed from active views,
  - [ ] Archive list or status behaves as designed.

---

### 3.3 Metric Logging & Dashboard

- [ ] **Log new value & see in history**:
  - [ ] From metric detail, user logs a new value,
  - [ ] New entry appears in log list with correct timestamp/value.

- [ ] **Log new value & see dashboard update**:
  - [ ] Baseline dashboard view is captured (last value, chart point, etc.),
  - [ ] After logging, re-visiting dashboard shows updated data.

- [ ] **Error on logging**:
  - [ ] When backend rejects log (forced via test-env or fixture),
  - [ ] User sees an error notification / inline message,
  - [ ] No incorrect data appears in history or dashboard.

---

### 3.4 Metric Settings & Goals

- [ ] **Set goal**:
  - [ ] From metric settings, user sets a goal/threshold,
  - [ ] Goal is visible on metric detail and dashboard (badge, label, line on chart, etc. as applicable).

- [ ] **Update goal**:
  - [ ] Changing goal updates visible goal metadata accordingly.

- [ ] **Remove/disable goal**:
  - [ ] Removing/turning off goal removes goal indicators from all relevant views.

---

### 3.5 Routing Guards & Authorisation

- [ ] **Unauthenticated redirect**:
  - [ ] Visiting a protected route without auth → redirect to login,
  - [ ] Optional: confirm presence of `redirect` query if implemented.

- [ ] **Authenticated direct navigation**:
  - [ ] With auth, direct navigation to `/app/metrics/:id` loads correct detail.

- [ ] **Expired/invalid token**:
  - [ ] Simulated invalid/expired token leads to:
    - redirect to login or clear auth + error,
    - no stale authenticated UI visible.

Token invalid/expired simulation decision:

- Use Cypress helper to set an invalid/expired auth token cookie before visiting a protected route.
- Assert redirect to `/login` (or equivalent auth-clear behavior) and absence of stale protected UI.

---

### 3.6 Account / Profile (if present)

- [ ] **Update profile**:
  - [ ] Changes to profile fields persist across reload.

- [ ] **Update privacy/notification settings**:
  - [ ] Toggling a setting persists and impacts behaviour where applicable.

---

## 4. Accessibility in E2E (cypress-axe / equivalent)

For each **key page** included in E2E (at minimum: login, dashboard, one metrics page, one main form):

- [ ] `axe` is injected after the page loads.
- [ ] `cy.checkA11y()` (or equivalent) is run on a meaningful container or the whole page.
- [ ] There are **no high-severity violations**; any known violations are:
  - [ ] Documented via comments in the test, and/or
  - [ ] Tracked as issues.

See also:

- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/a11y-e2e-checklist.md`
- `docs/how-to/releases/a11y-release-checklist.md`

---

## 5. Data & Test Isolation

- [ ] Tests assume a known **initial data state**:
  - [ ] Either via DB seed/migration,
  - [ ] Or via explicit setup steps at test/spec start (API calls to seed endpoint).

- [ ] Tests that **create entities** (metrics, categories, logs) either:
  - [ ] Are written so repeated runs on the same DB state don’t conflict, or
  - [ ] Clean up after themselves (delete/archive created data), or
  - [ ] Run against a freshly reset DB per test run.

- [ ] Different specs do not assume data created by other specs unless that dependency is explicitly documented and stable.

Current reset strategy decision (2026-02-18):

- Keep E2E suite stateless while reset/seed automation is not available.
- Introduce explicit DB reset hook (`npm run db:test:reset` or `cy.task("db:reset")`) before expanding to stateful flows.

---

## 6. Flakiness & Reliability

For each flaky-prone area:

- [ ] Tests **do not rely on arbitrary `wait` calls**:
  - [ ] Use built-in retries on commands/selectors instead of fixed timeouts.

- [ ] Network timing / background jobs:
  - [ ] Where eventual consistency is a factor, tests assert on final UI state, not on intermediate assumptions.

- [ ] Tests don’t rely on **test ordering**:
  - [ ] Specs can run independently or in parallel without breaking each other.

- [ ] Intermittent failures are investigated:
  - [ ] When flakiness is detected, root cause is addressed,
  - [ ] or the test is temporarily quarantined with a comment and a TODO, not ignored silently.

---

## 7. CI & PR Gate Expectations

Before merging a PR that affects E2E-covered flows:

- [ ] E2E **smoke suite** passes on CI (at least auth + one main application flow).
- [ ] If behaviour changed in a covered flow:
  - [ ] Corresponding tests updated to reflect new UX,
  - [ ] New tests added for new branches of behaviour (e.g. new error state).

Before a **release**:

- [ ] Full E2E suite runs successfully on the intended release build/environment.
- [ ] Any failing tests are either:
  - [ ] Fixed, or
  - [ ] Explicitly evaluated and documented as false positives / temporarily skipped with justification.

---

## 8. Documentation & Cross-Links

- [ ] For every new E2E spec:
  - [ ] link (in comments or docs) to relevant PRD section and/or feature docs in `docs/documentation/`.

- [ ] When you add a **new core flow**:
  - [ ] Update `PLAN.md` to mention it.
  - [ ] Add at least one E2E scenario to cover the primary happy path.

- [ ] Bugs found in production that map to untested flows:
  - [ ] Get a dedicated regression E2E test where appropriate.
