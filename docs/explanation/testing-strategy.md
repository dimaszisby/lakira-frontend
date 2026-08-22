# Lakira Frontend – Testing Strategy

This document describes the testing strategy for the Lakira frontend (Next.js + React), designed to be **production-grade** and aligned with common industry practices.

It explains:

- **What** we test
- **Where** different kinds of tests live
- **How** they are executed (locally and in CI)
- **What is expected** when implementing new features

---

## 1. Goals & Principles

Lakira’s tests exist to:

1. **Prevent regressions** in core user flows (auth, metrics, logging, dashboard).
2. **Catch defects early** via static analysis and fast unit/integration tests.
3. **Validate contracts** between frontend, backend, and design system.
4. **Enforce non-functional requirements**: accessibility, performance, and basic security behaviours.

Guiding principles:

- Prefer **fewer, higher-value tests** over many brittle ones.
- Prefer **integration tests** over overly mocked unit tests for UI.
- Test behaviour from the **user’s perspective** (React Testing Library, Cypress).
- Make tests **fast, deterministic, and isolated**.

Accessibility-specific design and coding rules are defined in the
[Accessibility Guidelines](../reference/accessibility-baseline.md), and are enforced
via integration and E2E tests plus release checklists.

Performance budgets and expectations are defined in the
[Performance Budget](../reference/performance-budget.md) document and are enforced
via performance & Web Vitals tests plus the performance release checklist.

---

## 2. Testing Pyramid Overview

Lakira follows a classic **testing pyramid**:

| Layer                           | Purpose                                         | Primary tools                                | Docs folder                           |
| ------------------------------- | ----------------------------------------------- | -------------------------------------------- | ------------------------------------- |
| **1. Static checks**            | Catch issues at compile / lint time             | TypeScript, ESLint, Stylelint                | `1-static-checks/`                    |
| **2. Unit tests**               | Verify pure logic and small, isolated pieces    | Vitest/Jest                                  | `2-unit-tests/`                       |
| **3. Integration tests**        | Test components/pages with real providers + MSW | Vitest/Jest + React Testing Library + MSW    | `3-integration-tests/`                |
| **4. End-to-end (E2E) tests**   | Validate full browser flows                     | Cypress / Playwright                         | `4-end-to-end-tests/`                 |
| **5. Performance & Web Vitals** | Guard performance budgets & runtime Web Vitals  | Lighthouse, Next.js Web Vitals, bundle tools | `5-performance-and-web-vitals-tests/` |

**Cross-cutting concerns**:

- **Accessibility**: integrated into integration & E2E layers (`a11y-testing-checklist.md`, `a11y-e2e-checklist.md`).
- **Security**: detailed in `/docs/security-audit/*`, referenced by release checklists.
- **Release readiness**: high-level checklists in `/docs/how-to/releases/*`.

---

## 3. Test Layers

### 3.1 Static Checks (Layer 1)

**Purpose**

Prevent entire categories of bugs from compiling or merging.

**Tools**

- TypeScript (`tsc --noEmit` in strict mode)
- ESLint (React, hooks, accessibility rules)
- Stylelint (CSS / Tailwind conventions)
- Dependency checks (`npm audit` or similar) – optional but recommended

**Scope**

- Type correctness (props, hooks, API responses)
- Unsafe patterns (unused variables, missing deps in hooks, etc.)
- Style/token misuse

**Docs**

- `docs/internal/initiatives/tests-overhaul/1-static-checks/CHECKLIST.md`

---

### 3.2 Unit Tests (Layer 2)

**Purpose**

Fast, deterministic tests for **pure logic** and small utilities.

**Tools**

- Vitest or Jest (whichever is configured in the repo)

**What we test**

- Pure domain logic:
  - value / goal calculations
  - bucketing and date/time utilities for metrics & charts
  - aggregation helpers (avg, min, max)
- DTO ↔ ViewModel mappers
- Small custom hooks that do not hit the network or router

**What we **don’t** test here**

- React components with DOM rendering → these belong in **integration tests**.

**Location**

- Tests are colocated with source files where reasonable, e.g.:
  - `src/lib/date/bucketByRange.ts`
  - `src/lib/date/bucketByRange.test.ts`

**Docs**

- `docs/internal/initiatives/tests-overhaul/2-unit-tests/PLAN.md`
- `docs/internal/initiatives/tests-overhaul/2-unit-tests/CHECKLIST.md`

---

### 3.3 Integration Tests (Layer 3)

**Purpose**

Validate that **components and pages** work correctly with:

- React Query (data fetching / caching)
- Jotai / state management
- Routing (Next.js / `next/navigation`)
- Form handling (React Hook Form)
- API layer (via **MSW** mocks)

These tests are closer to how the user interacts with the page but still run in a Node/JSDOM environment.

**Tools**

- Vitest/Jest
- React Testing Library
- Mock Service Worker (MSW) for API mocking
- jest-axe (for a11y checks on key components/pages)

**What we test**

- Complex components (forms, tables, cards) in isolation or within a page:
  - Metric Category form & table
  - Metric form
  - Metric Log form
  - Dashboard widgets (metric cards + charts)
- Behaviour:
  - loading, success, empty and error states
  - basic navigation (using router mocks)
  - form validation and error messages
- Accessibility smoke tests for core layouts and components.

**Location**

- Typically colocated near pages/components being tested, e.g.:
  - `src/features/metric-categories/components/MetricCategoryForm.int.test.tsx`
  - `src/features/auth/components/LoginForm.int.test.tsx`

**Docs**

- `docs/internal/initiatives/tests-overhaul/3-integration-tests/PLAN.md`
- `docs/internal/initiatives/tests-overhaul/3-integration-tests/CHECKLIST.md`
- `docs/internal/initiatives/tests-overhaul/3-integration-tests/a11y-testing-checklist.md`

---

### 3.4 End-to-End Tests (Layer 4)

**Purpose**

Simulate a **real user in a real browser** and validate complete flows from the UI down to the backend (or a full API mock).

**Tools**

- Cypress (or Playwright)
- cypress-axe (for E2E accessibility)

**What we test**

Core happy paths and a few critical negative flows:

- Authentication:
  - register → redirect to onboarding/dashboard
  - login → redirect to dashboard
  - logout → restricted routes redirect to login
- Metric lifecycle:
  - create metric category → create metric → see metric in list
- Logging & dashboard:
  - log metric values → see updated dashboard/chart/summary
- Metric settings:
  - set/update/remove goals and visibility flags

Negative flows:

- Login with wrong credentials
- Backend error on `/metrics` or `/metric-logs` → friendly error UI
- Unauthorized access to authenticated routes without a valid token

**Location**

- `cypress/e2e/*.cy.ts` (or equivalent framework directory)

**Docs**

- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/PLAN.md`
- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/CHECKLIST.md`
- `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/a11y-e2e-checklist.md`

---

### 3.5 Performance & Web Vitals (Layer 5)

**Purpose**

Ensure that the app stays within agreed **performance budgets** and provides good Core Web Vitals.

**Tools**

- Lighthouse CLI or Lighthouse CI
- Next.js Web Vitals reporting (optional)
- Bundle analysis tools (e.g. `next build` output, `@next/bundle-analyzer`)

**What we test**

- Lighthouse scores for key pages (e.g. `/`, `/app/dashboard`):
  - Performance
  - Best Practices
  - Accessibility (supplements other tests)
- Bundle size budgets
- (Optional) Web Vitals reporting with thresholds

**Docs**

Docs

- High-level budgets/specs:
  - [Performance Budget](../reference/performance-budget.md)
- Testing details:
  - [Lighthouse Plan](5-performance-and-web-vitals-tests/lighthouse-plan.md)
  - [Web Vitals Plan](5-performance-and-web-vitals-tests/web-vitals-plan.md)
  - [Bundle Size Checklist](5-performance-and-web-vitals-tests/bundle-size-checklist.md)
- Release checks:
  - [Performance Release Checklist](../how-to/releases/performance-release-checklist.md)

---

## 4. Cross-Cutting Concerns

### 4.1 Accessibility

Accessibility is treated as a **first-class quality attribute** and is tested at multiple levels:

- **Component / integration level**
  - Use semantic HTML and WAI-ARIA only when necessary.
  - Run `jest-axe` on key components/pages.
- **E2E level**
  - Use `cypress-axe` on important screens:
    - login, registration
    - dashboard
    - metric detail
    - logging flows

Reference docs:

Guidelines (spec):

- [Accessibility Guidelines](../reference/accessibility-baseline.md)

Integration tests:

- [Integration A11y Checklist](3-integration-tests/a11y-testing-checklist.md)

E2E tests:

- [E2E A11y Checklist](4-end-to-end-tests/a11y-e2e-checklist.md)

Release checklist:

- [A11y Release Checklist](../how-to/releases/a11y-release-checklist.md)

---

### 4.2 API Contracts

API contracts are enforced primarily through:

- **OpenAPI-driven types** (in `/docs/reference/api/*.ts`).
- Typed API clients in the frontend.
- Integration tests using MSW that:
  - assert requests use correct URLs/methods,
  - validate behaviour against expected response shapes.

Any change to the backend contract should:

1. Update OpenAPI schemas.
2. Regenerate / update TS types.
3. Update MSW handlers and integration tests as needed.

---

### 4.3 Security (Frontend Behaviour)

Deep security policies are documented under:

- `docs/security-audit/*`

The frontend testing strategy focuses on behaviours such as:

- Proper handling of JWT/session tokens.
- Logout clearing local auth state and blocking protected routes.
- No sensitive information rendered in error messages or URLs.

Security-related checks are included in:

- E2E tests for auth and protected routes.
- Release-time checklists:
  - `docs/how-to/releases/release-checklist.md`
  - `docs/internal/todos/*` for time-boxed security tasks.

---

## 5. Conventions & When to Use Which Layer

### 5.1 Naming

- Unit/interaction tests: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`.
- Integration tests: `*.int.test.ts`, `*.int.test.tsx`.
- E2E tests: `*.cy.ts` in `cypress/e2e/`.

Runner contract:

- Unit scripts (`test:unit`, `test:unit:watch`, `test:unit:ci`) run with `jest.unit.config.ts`.
- Integration scripts (`test:integration`) run with `jest.integration.config.ts`.
- Unit discovery must exclude `*.int.test.ts(x)`; integration discovery must only include `*.int.test.ts(x)`.

### 5.2 Choosing the right layer

When adding a new feature:

1. **Start with unit tests** if you introduce non-trivial logic:
   - calculations, transformations, complex conditions.
2. Add an **integration test** for the main component/page:
   - ensure loading / success / empty / error states.
   - cover form submission and React Query behaviour.
3. If the feature is part of a **core user flow**, add or extend an **E2E test**.
4. For user-facing screens, ensure **a11y checks** run at integration and/or E2E level.

Minimal expectation for a user-visible feature:

- At least **one integration test** covering the primary success path.
- **Unit tests** for critical logic, if any.
- E2E coverage if it touches auth, dashboard, or other core flows.

---

## 6. How to Run Tests (Recommended Scripts)

_Note: concrete script names may differ; this is the intended structure._

- Static checks

  ```bash
  npm run lint        # ESLint
  npm run lint:css    # Stylelint
  npm run typecheck   # tsc --noEmit
  ```

- Unit / interaction tests

  ```bash
  npm run test:unit
  npm run test:unit:ci
  ```

- Integration tests

  ```bash
  npm run test:integration
  ```

- E2E tests

  ```bash
  npm run test:e2e
  ```

## 9. Related Documents

- [Accessibility Guidelines](../reference/accessibility-baseline.md)
- [Integration A11y Checklist](3-integration-tests/a11y-testing-checklist.md)
- [E2E A11y Checklist](4-end-to-end-tests/a11y-e2e-checklist.md)
- [A11y Release Checklist](../how-to/releases/a11y-release-checklist.md)
- [Performance Budget](../reference/performance-budget.md)
- [Lighthouse Plan](5-performance-and-web-vitals-tests/lighthouse-plan.md)
- [Web Vitals Plan](5-performance-and-web-vitals-tests/web-vitals-plan.md)
- [Bundle Size Checklist](5-performance-and-web-vitals-tests/bundle-size-checklist.md)
- [Performance Release Checklist](../how-to/releases/performance-release-checklist.md)
