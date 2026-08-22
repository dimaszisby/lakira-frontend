This is a deprecated file and should not be used as the reference of information. Use the newest plan: docs/internal/archive/testing-plan-ARCHIVED-2025-11-28.md

# Lakira Frontend Testing Plan

This document defines the production-grade test strategy for the Lakira Frontend (Next.js 16, React 19). Each section describes the objective, scope, tooling, data requirements, and execution cadence so feature teams can consistently add or maintain tests while matching security and reliability expectations captured in `docs/security/*`.

## Test Type Summary

| Test Type                      | Primary Goal                                                   | Scope Highlights                                                                          | Core Tooling / Infra                                                           | When to Run                                    |
| ------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------- |
| 1. Unit (logic + hooks)        | Guarantee isolated functions behave deterministically          | Pure helpers, data mappers, form schemas, custom hooks (auth, metric filters)             | Jest + ts-jest, @testing-library/react-hooks, fixtures under `src/test-utils`  | On each PR and pre-push                        |
| 2. Component (UI rendering)    | Validate component output, states, and accessibility semantics | Visual components in `src/components`, feature widgets (`SwipeableCard`, `SortChipGroup`) | React Testing Library, jest-dom, MSW for fetch mocks                           | On each PR and as developers iterate           |
| 3. Integration (feature/page)  | Ensure multiple modules collaborate correctly                  | App Router pages, React Query + routing, cross-component events                           | RTL with page-level renders, Next.js router/test adapters, MSW scenario suites | Nightly pipeline + targeted PRs                |
| 4. API Contract                | Detect breaking backend changes before deploy                  | Axios services, React Query fetchers, Zod schemas                                         | Contract snapshots + schema validation tests, OpenAPI mock server              | On backend schema change PRs & nightly         |
| 5. End-to-End                  | Prove real user journeys function in production build          | Auth, metric catalog/search, logging workflows, mobile breakpoints                        | Cypress + Cypress Component Dev Server (CDS) for Next, mockable login backend  | Per merge to `main` + release candidate        |
| 6. Accessibility               | Enforce WCAG 2.1 AA baseline                                   | Headings, forms, color tokens, focus management                                           | axe-core (Jest + Cypress integrations), Storybook/Playwright audits            | PR gating for affected UI + nightly full sweep |
| 7. Visual Regression           | Catch CSS/tailwind token regressions                           | Key screens and components (cards, charts, data tables)                                   | Chromatic or Percy linked to Storybook, responsive snapshots                   | On design-affecting PRs                        |
| 8. Performance & Web Vitals    | Keep runtime fast and bundles lean                             | Next.js pages, dynamic imports, chart rendering                                           | Lighthouse CI, Next.js bundle analyzer, Web Vitals tracking                    | On release builds + weekly trend report        |
| 9. Security & Compliance Tests | Verify guardrails for auth, logging, and input sanitization    | Auth flows, axios retry/policy, DOMPurify usage                                           | ESLint security rules, dependency audit, targeted Jest+Cypress tests           | On PR (lint/audit) + monthly deep scan         |

## 1. Unit Tests (Logic & Hooks)

- **Objective:** Cover deterministic code paths to keep behavior stable with minimal runtime cost.
- **Scope:** Utility modules under `src/lib`, formatter helpers, data transforms for charts/log tables, form schemas/validators, and React hooks (auth, query state, theme toggles).
- **Implementation Checklist:**
  - Add `jest.config.ts` with ts-jest + jsdom environment.
  - Create `src/test-utils/fixtures` for sample metric categories, logs, auth tokens.
  - For hooks using React Query or contexts, wrap tests with utility renderers providing mock providers.
  - Target ≥90% coverage on pure helpers and ≥80% on hooks that orchestrate third-party libs (React Query, Jotai).
- **Cadence:** Automatically run via `npm run test:unit -- --watch=false` in CI for every PR; developers run focused suites locally before committing.

### unit-test-plan

- **Owner:** Feature squads who touch `src/lib`, shared hooks, or adapters; QA reviews coverage.
- **Environment:** Node 20 + jsdom; run locally and in CI containers with deterministic locale/timezone.
- **Toolchain:** Jest + ts-jest, Testing Library hooks, MSW for isolated hook fetch mocks, jest-canvas-mock for Chart helpers.
- **Entry Criteria:** Story/task ready for implementation, acceptance criteria defined, supporting fixtures drafted.
- **Test Cases:**
  - Validate all branches of helper functions (formatters, selectors, calculators).
  - Hook behavior for success/error/loading states, retry logic, and side effects (e.g., toast triggers).
  - Schema validation functions rejecting malformed payloads with actionable errors.
  - Edge cases for date/timezones, number precision, and undefined/null data.
- **Exit Criteria & Reporting:** Tests green locally and in CI; jest coverage summary ≥ target thresholds with no uncovered critical branches; results posted in PR status and tracked via coverage badge.

## 2. Component Tests (UI Rendering)

- **Objective:** Ensure UI components render the correct states, semantics, and interactions given props.
- **Scope:** Shared primitives (`DataLabel`, `Visualization`), layout blocks, cards (`MetricCategoryMobileCard`, `MetricLibraryMobileCard`), buttons/chips tied to tailwind tokens, error/empty states, and theming toggles.
- **Implementation Checklist:**
  - Use React Testing Library with jest-dom matchers for DOM assertions (roles, accessible names).
  - Mock Chart.js canvas rendering via `jest-canvas-mock` for deterministic snapshots.
  - Validate tailwind token usage through class assertions for semantics critical to design system (card tokens, typography utility classes).
  - Include interaction tests for gestures (swipe, sort selection) via `user-event`.
- **Cadence:** Gated on PR; run subset related to touched files via Jest watch mode locally.

### component-test-plan

- **Owner:** Component authors + Design Systems guild; QA ensures accessibility criteria met.
- **Environment:** jsdom with global styles imported via `@testing-library/jest-dom`; rely on CSS modules/tokens mocked.
- **Toolchain:** React Testing Library, user-event, jest-axe (spot checks), MSW when component fetches data.
- **Entry Criteria:** Component props documented, acceptance criteria mapped to states, mock data defined.
- **Test Cases:**
  - Rendering for base, loading, empty, and error states.
  - Interaction flows (taps, keyboard events, swipe gestures) with focus assertions.
  - ARIA roles/labels and semantic heading hierarchy.
  - Snapshot/specific assertions for token classes (e.g., `card.recipe.css` variants).
- **Exit Criteria & Reporting:** Component tests pass with zero accessibility violations, Percy/Chromatic snapshot (if configured) approved; results surfaced as PR checks.

## 3. Integration Tests (Feature/Page)

- **Objective:** Catch bugs that only appear when several components/providers interact.
- **Scope:** Next.js App Router pages under `src/app/(app)/*`, particularly:
  - Metrics list page (`/metrics`) with React Query + filters.
  - Metric category detail page (log timeline + chips).
  - Authentication gating (middleware, login mutation).
- **Implementation Checklist:**
  - Compose renders using a `renderWithProviders` helper supplying Next router mocks, React Query client, theming context, and MSW handlers.
  - Mock network boundaries with MSW scenario files mirroring backend contracts defined in `docs/openapi`.
  - Assert analytics/logging calls (if implemented) through spies to ensure telemetry coverage.
  - Negative paths: unauthorized user, empty datasets, fetch failures/resilience via axios-retry.
- **Cadence:** Nightly CI run for full integration suite; targeted subsets triggered on PRs affecting page folders or feature directories.

### integration-test-plan

- **Owner:** Feature squads for respective pages, assisted by QA automation.
- **Environment:** Jest + jsdom or Node (if server components) with full provider stack (React Query, Theme, Next Router mocks).
- **Toolchain:** React Testing Library, MSW scenario configs, jest.spyOn for telemetry assertions.
- **Entry Criteria:** API contracts mocked, user journeys defined with success/failure paths, environment variables stubbed.
- **Test Cases:**
  - Page load with cached data vs cache-miss.
  - User interactions spanning multiple components (chip selection updating lists, card clicks opening detail).
  - Auth guard behavior (redirect to login, toast messaging).
  - Error handling/resilience (retry UI, offline messaging).
- **Exit Criteria & Reporting:** All journey tests pass; MSW logs show expected requests; integration suite artifacts attached to CI report for nightly runs.

## 4. API Contract Tests

- **Objective:** Detect contract drift between Lakira frontend data layer and backend APIs before runtime errors happen.
- **Scope:** Axios service modules, fetch wrappers, React Query `useQuery`/`useMutation` hooks (e.g., `login.mutation.ts`), and Zod schema parsing.
- **Implementation Checklist:**
  - Import OpenAPI schemas from `docs/openapi` to auto-generate TypeScript types (using `openapi-typescript` or similar) and compare to manually maintained Zod schemas.
  - Write Jest tests ensuring every API handler rejects invalid responses and gracefully handles `axios-retry` logic.
  - Create contract snapshot tests (e.g., `__contracts__/metric-category.responses.json`) to track backend payload shape.
  - Integrate with CI so backend schema PR triggers frontend contract tests through shared artifact (optional GitHub Action).
- **Cadence:** Run on nightly CI and whenever backend API definitions update; treat failures as blocking.

### api-contract-test-plan

- **Owner:** Platform/data integration team; backend team notified on failures.
- **Environment:** Node environment using mocked HTTP server (MSW node or Pact) referencing OpenAPI specs.
- **Toolchain:** Jest, openapi-typescript, zod, contract snapshot framework (e.g., Jest serializers), optional Pact broker.
- **Entry Criteria:** Latest OpenAPI specs checked in, client schemas updated, fixtures representing canonical responses created.
- **Test Cases:**
  - Schema compatibility (type generation vs Zod definitions).
  - Request payload validation (required headers, auth tokens).
  - Error path coverage (HTTP 4xx/5xx mapping to typed errors).
  - Backwards compatibility detection through snapshots when backend publishes new version.
- **Exit Criteria & Reporting:** Contract suite passes; diff reports attached to CI; automatic notification to backend owners when compatibility breaks.

## 5. End-to-End (E2E) Tests

- **Objective:** Replicate production user journeys in a browser to validate routing, network, and UI interplay on a built app.
- **Scope:** Core flows:
  1. Authentication: login + token storage + protected route access.
  2. Metrics browsing: load /metrics, apply chips, open detail, view logs.
  3. Metric logging: submit new log entry, verify table update + toast.
  4. Mobile UX: swipe through cards, ensure responsive layout for ≤640px width.
  5. Error handling: simulate API outage to confirm fallback UI.
- **Implementation Checklist:**
  - Use Cypress with `cypress.config.ts` to spin up Next via `next dev` or, ideally, `next build && next start`.
  - Stub auth backend via MSW or Cypress network intercepts; store fixtures under `cypress/fixtures`.
  - Add accessibility assertions via `cypress-axe` where feasible.
  - Capture videos/screenshots in CI for debugging; keep runs deterministic by mocking timers/random IDs.
- **Cadence:** Execute smoke subset on every PR merge to `main`; run full regression pack before release and nightly with production build artifact.

### e2e-test-plan

- **Owner:** QA automation + feature teams for journey ownership.
- **Environment:** Cypress running against production build (`next build && next start`) hosted in CI; optional staging environment with seeded data.
- **Toolchain:** Cypress, MSW or intercepts, cypress-axe, testing-library/cypress commands, Docker image for reproducible runs.
- **Entry Criteria:** Feature deployed/staged, mock users + credentials available, APIs stable or mocked.
- **Test Cases:**
  - Smoke flows (login, metrics navigation, log creation).
  - Regression flows for edge cases (empty categories, offline banner).
  - Responsive viewport coverage (mobile/tablet/desktop).
  - Security-critical scenarios (session timeout, unauthorized access).
- **Exit Criteria & Reporting:** Cypress dashboard records green runs with artifacts stored; flake triaged before release; failures block deploy pipeline until resolved.

## 6. Accessibility Tests

- **Objective:** Enforce WCAG 2.1 AA compliance aligned with semantic/color token documentation.
- **Scope:** Interactive components (forms, charts, modals), focus flow in `Layout.tsx`, semantic tokens (`palette.css`, `semantic.css`), and data visualizations.
- **Implementation Checklist:**
  - Add Jest-level axe checks for each Storybook story or component test, failing on violations.
  - Integrate `axe-core` with Cypress to scan key routes (metrics list/detail, login, dashboards).
  - Verify keyboard navigation for swipeable controls by providing fallback buttons; assert ARIA labels exist for chart/graph components.
  - Track contrast regressions by referencing token specs in documentation; update tests when tokens change.
- **Cadence:** Run automated axe suite on every PR touching UI; schedule full-route scan nightly.

### accessibility-test-plan

- **Owner:** Accessibility champion plus feature teams; design reviews sign off.
- **Environment:** Jest (component/unit) and Cypress (browser) contexts with global styles loaded; run against both light/dark themes.
- **Toolchain:** axe-core, jest-axe, cypress-axe, Storybook accessibility add-on, keyboard testing utilities.
- **Entry Criteria:** UI ready for review, semantic tokens finalized, ARIA/docs updated.
- **Test Cases:**
  - Automated axe scans for each component/page state.
  - Manual keyboard navigation scripts (tab order, focus trap, skip links).
  - Contrast verification against palette tokens using tooling (e.g., axe color checks).
  - Screen reader text validation for data visuals and icon-only controls.
- **Exit Criteria & Reporting:** Zero critical axe violations; manual checklist signed; issues logged/tracked in backlog with SLA; accessibility status included in release summary.

## 7. Visual Regression Tests

- **Objective:** Detect unintended UI changes introduced by CSS/tailwind updates, token modifications, or dependency upgrades.
- **Scope:** Storybook stories for high-value components (cards, log tables, charts), critical pages at multiple viewport sizes, dark/light themes.
- **Implementation Checklist:**
  - Stand up Storybook (if not already) with stories colocated next to components.
  - Connect to Chromatic/Percy to snapshot stories and key pages at sm/md/lg breakpoints.
  - Gate merges on approval of diffs; align baseline updates with design review sign-off.
  - Use deterministic mock data to avoid flaky diffs (seeded random values, fixed timestamps).
- **Cadence:** Trigger visual checks on every PR that affects UI directories or styles; run scheduled weekly snapshot refresh to detect drift.

### visual-regression-test-plan

- **Owner:** Design systems + QA visual lead.
- **Environment:** Storybook static build deployed to Chromatic/Percy; optional Playwright screenshot tests for pages.
- **Toolchain:** Storybook, Chromatic/Percy CLI, deterministic fixture generator, GitHub status checks.
- **Entry Criteria:** Stories authored with stable data, breakpoints defined, design sign-off on baseline images.
- **Test Cases:**
  - Component-level snapshots for each variant/theme.
  - Page-level snapshots for critical flows (metrics list/detail, login).
  - Responsive checks at defined breakpoints.
  - Regression of typography/token updates.
- **Exit Criteria & Reporting:** All snapshots approved; diffs reviewed by design; baseline updates documented in PR to avoid silent regressions.

## 8. Performance & Web Vitals Tests

- **Objective:** Maintain smooth interactions and meet SLOs (<2.5s LCP, CLS <0.1) on both desktop and mobile.
- **Scope:** Production build bundles, dynamic imports (chart libraries), lazy loading for feature modules, network resiliency.
- **Implementation Checklist:**
  - Run Lighthouse CI against deployed preview or `next start` build, storing trends in CI artifact.
  - Configure Next.js bundle analyzer to threshold JS payload (e.g., metrics page ≤250 KB first load).
  - Instrument Web Vitals reporting and add automated assertions (e.g., Playwright script reading `performance.getEntriesByType`).
  - Profile React Query cache hydration/resume for returning visitors.
- **Cadence:** Execute Lighthouse on every deploy preview; weekly job reviews bundle stats, failing when thresholds exceeded.

### performance-test-plan

- **Owner:** Performance champion within frontend platform team.
- **Environment:** Production-equivalent build served via `next start`, tested using Lighthouse CI and Playwright on CI runners plus optional lab devices.
- **Toolchain:** Lighthouse CI, Web Vitals reporter, next-bundle-analyzer, Playwright for scripted interactions.
- **Entry Criteria:** Feature merged to staging, analytics/perf budgets updated, caching strategy documented.
- **Test Cases:**
  - Lighthouse runs for top pages (desktop + mobile) verifying LCP, CLS, TBT budgets.
  - Bundle size regression detection comparing against previous CI artifacts.
  - Scripted flows measuring hydration time and React Query cache behavior.
  - Stress scenarios (slow 3G, 4x CPU throttle) to ensure acceptable performance.
- **Exit Criteria & Reporting:** All metrics within budget; variances >10% flagged; weekly dashboard shared with engineering leads.

## 9. Security & Compliance Tests

- **Objective:** Align frontend behavior with security program artifacts (`security-audit-plan.md`, `threat-model.md`).
- **Scope:** Authentication flows, token storage, DOMPurify usage, secure logging/redaction, dependency health.
- **Implementation Checklist:**
  - Expand existing `npm run security:scan` to include `npm audit --production` and `npx depcheck` thresholds.
  - Write Jest tests ensuring sensitive data never leaks into client logs/toasts.
  - Add Cypress tests verifying middleware redirects unauthorized users, and session expiry flows log out.
  - Include static analysis (ESLint security plugin, `eslint-plugin-jsx-a11y`, `eslint-plugin-security`) in CI with zero-warning policy.
- **Cadence:** Run lint + audit on each PR; schedule monthly dependency review and quarterly manual threat-model validation test run.

### security-test-plan

- **Owner:** Security champion + platform team; reports feed into security-audit log.
- **Environment:** CI runners with locked dependency tree; staging environment for auth flow tests.
- **Toolchain:** ESLint security rules, npm audit, dependency-check tools, Jest security suites, Cypress auth specs.
- **Entry Criteria:** Threat model updated, dependency updates planned, secrets management verified.
- **Test Cases:**
  - Static analysis for insecure patterns (eval usage, innerHTML).
  - Runtime tests for auth/session expiry, CSRF token handling, DOMPurify sanitization.
  - Dependency audit for critical/high vulnerabilities; verify mitigations.
  - Logging/redaction tests to ensure sensitive fields absent from UI logs or analytics.
- **Exit Criteria & Reporting:** `npm run security:scan` passes with zero high vulnerabilities; Cypress/Jest security specs green; findings documented in `docs/internal/audits/security/audit-2025-11-21/security-audit-log.md` with remediation owners.

## Implementation Roadmap

1. **Tooling Setup:** Add Jest + ts-jest config, MSW handlers, Cypress config, Storybook/Chromatic pipeline, Lighthouse CI workflow.
2. **Foundational Tests:** Seed unit/component suites for shared utilities and hero components; create first Cypress smoke spec.
3. **Expand Coverage:** Layer integration tests per page, contract tests per API module, and axe checks for most used screens.
4. **Automate CI/CD:** Wire GitHub Actions (or chosen CI) with matrix jobs: lint, unit, component, integration, e2e (production build), accessibility, visual, performance.
5. **Governance:** Track coverage metrics, flaky test dashboard, and review cadence alongside security documents.

By following this plan per test type, the Lakira Frontend can achieve production-grade confidence while scaling features across metrics, categories, and logging experiences.
