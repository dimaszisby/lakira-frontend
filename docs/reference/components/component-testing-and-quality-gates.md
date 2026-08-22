# Component Testing and Quality Gates

This document defines the minimum quality bar for component-level implementation and review.

---

## 1. Testing Philosophy

Primary principle:

- Test behavior from user perspective, not implementation details.

Implications:

- Prefer role/text/label queries over class-based selectors.
- Avoid brittle tests tied to internal markup structure.
- Focus on interaction outcomes and state semantics.

---

## 2. Component Test Pyramid

### 2.1 Unit/Interaction Tests (Required)

Tools:

- Jest + React Testing Library + `@testing-library/user-event`

What to cover:

- Renders with expected semantic role/name.
- Supports intended keyboard and pointer interactions.
- Handles disabled/loading/error states correctly.
- Emits expected callbacks with correct values.

### 2.2 Integration Tests (Recommended for Composites)

What to cover:

- Interplay between primitives (field + validation + submit).
- Modal/popover opening/closing and focus return.
- Select/listbox behaviors across keyboard + mouse.

Naming and ownership:

- `*.test.ts(x)` and `*.spec.ts(x)` are treated as unit/interaction tests.
- `*.int.test.ts(x)` is treated as integration.
- Canonical contract and examples live in `docs/explanation/testing-strategy.md`.

### 2.3 E2E Tests (Critical Flows)

Tools:

- Cypress (already available in project)

What to cover:

- High-value user paths using components in real screens.
- A11y-critical flows in production-like rendering.

### 2.4 Tier-Based Minimum Test Matrix (Required)

Apply this minimum matrix when classifying reusable components by tier:

1. Tier 1 (foundation primitives)
   - At least 4 behavior tests per component.
   - Must include semantic render, primary interaction, disabled/loading or error path, and callback/value contract assertions.
2. Tier 2 (complex interactions)
   - At least 6 behavior tests per component.
   - Must include all Tier 1 minimums plus keyboard navigation, focus handoff/restore, and close/escape or edge-guard assertions.
3. Tier 3 (display and utility)
   - At least 3 behavior tests per component.
   - Must include semantic/state labeling and an edge-state path where applicable.

Notes:

- Integration tests remain recommended for composite flows that combine multiple primitives.
- Meeting minimum counts does not waive accessibility critical-failure checks.

---

## 3. Required Test Cases by Component Type

### Button-like controls

Must test:

1. Default render and accessible name.
2. Disabled and loading behavior.
3. Click/keyboard activation.

### Input-like controls

Must test:

1. Label and helper/error text associations.
2. Value changes and callback behavior.
3. Invalid and disabled states.

### Overlay components (Modal/Popover)

Must test:

1. Open/close state transitions.
2. Escape handling.
3. Focus handoff in and out.

### Custom list/select components

Must test:

1. Option navigation via keyboard.
2. Selection behavior.
3. Disabled option handling.
4. Outside-click close behavior.

---

## 4. A11y Checks in Tests

Baseline checks:

- `toBeInTheDocument`, `toHaveAccessibleName`, `toBeDisabled`, `toHaveAttribute`.
- Role-based assertions (`getByRole`) to verify semantic correctness.

Recommended extension:

- Add `axe-core` checks in integration/e2e layers for major composite components.

---

## 5. Performance and Bundle Awareness for Components

Rules:

- Avoid unnecessary `use client` escalation for non-interactive UI.
- Keep heavy dependencies out of primitives.
- For expensive UI (charts, rich widgets), lazy-load at feature boundary.

Reference:

- `docs/reference/performance-budget.md`

---

## 6. CI/Local Quality Gates

Before merging component changes:

1. `npm run lint`
2. `npm run lint:css`
3. `npm run test:unit`
4. Relevant integration/e2e checks for touched behavior

Runner boundary note:

- `npm run test:unit` maps to `jest.unit.config.ts` (unit/interaction only).
- `npm run test:integration` maps to `jest.integration.config.ts` (`*.int.test.ts(x)` only).

Optional but recommended in major UI updates:

1. Lighthouse/web-vitals checks for affected flows.
2. Manual keyboard-only verification.

---

## 7. Visual Regression Strategy (Two Approaches)

### Approach A: Storybook + Visual Snapshot Platform

Use when:

- Team wants isolated component previews and formal visual diff workflow.

Pros:

- Strong component-level visual confidence.

Cons:

- Extra tooling setup and maintenance.

### Approach B: Route-level Visual Checks + E2E Screenshots

Use when:

- Team prefers lower tooling overhead initially.

Pros:

- Faster to adopt with current stack.

Cons:

- Less granular component-level visibility.

---

## 8. Definition of Done (Testing/Quality)

A component is quality-complete when:

1. Required behavior tests exist and pass.
2. Accessibility semantics are verified in tests.
3. Edge states (`disabled`, `loading`, `error`) are covered.
4. Quality gates pass with no ignored failures.
5. Reviewer can validate behavior without inspecting implementation details.
