# Accessibility Integration Test Checklist – Lakira Frontend

This checklist defines how we apply **accessibility (a11y) checks** at the **integration test** level using React Testing Library and `jest-axe` (or equivalent).

Use it when:

- Writing/maintaining integration tests for **forms, major layouts, and navigation components**.
- Reviewing PRs that introduce **new user-facing UI**.

> High-level guidelines live in `documents/documentation/accessibility-guidelines.md`.  
> This file focuses on **what we assert in tests**.

---

## 0. Preconditions

Before adding a11y assertions:

- [x] `jest-axe` (or equivalent) is installed and configured.
- [x] There is a shared test utility to:
  - [x] render components with providers (`renderWithProviders`), and
  - [ ] optionally wrap `axe` invocation.

<!-- SPECIAL NOTE: Add actual helper paths once they exist, e.g.:
     - `src/tests/utils/renderWithProviders.tsx`
     - `src/tests/utils/axeHelper.ts`. -->

---

## 1. When to Add a11y Checks in Integration Tests

We don’t run `axe` on every tiny component to keep tests fast.  
We **do** add a11y checks for:

- [x] Auth forms (login baseline implemented).
- [ ] Primary data-entry forms (metric create/edit, log create, settings).
- [ ] Main layouts:
  - [x] Dashboard page.
  - [x] Metric detail page.
- [ ] Reusable “shell” components:
  - [ ] Main navigation / sidebar.
  - [ ] Modal / dialog components.

For smaller leaf components (buttons, icons, chips), we mainly rely on:

- semantic HTML,
- design-system reviews,
- E2E + manual audits.

---

## 2. Basic Semantic & Structure Checks

For any component/page under test:

- [ ] Root elements use appropriate **landmarks** where applicable:
  - [ ] `<main>` for main content area.
  - [ ] `<header>` / `<nav>` / `<footer>` where meaningful.

- [ ] Headings use a **logical hierarchy**:
  - [ ] A single `<h1>` per page (or clear top-level heading).
  - [ ] Subsections use `<h2>`, `<h3>`, etc. in order (no random jumps).

- [ ] Interactive elements use semantic HTML:
  - [ ] Clickable actions are `<button>` or `<a>` (with `href`), not generic `<div>`/`<span>` with `onClick`.
  - [ ] Icons used as interactive controls have button/link semantics and accessible names.

In tests, you can assert:

- [ ] `getByRole("main")` finds the main region (if applicable).
- [ ] `getByRole("heading", { level: 1 })` finds exactly one main heading (for page-level tests).

---

## 3. Forms & Labels

For every **form-type** component under integration testing:

- [ ] Each input has an associated **label**:
  - [ ] `getByLabelText` works for all primary inputs (text, select, textarea, etc.).
  - [ ] If visual label isn’t possible (icon-only, search icon button, etc.), use `aria-label` or `aria-labelledby`.

- [ ] Form control groupings are clear:
  - [ ] Radio/checkbox groups use `<fieldset>` + `<legend>` where logical.

- [ ] Error messages are associated with controls:
  - [ ] When an error is shown, input is linked via `aria-describedby` (or equivalent).
  - [ ] Screen-reader users can understand **which** field has which error.

In tests:

- [ ] Use `getByLabelText` instead of `getByTestId` for form interactions.
- [ ] When simulating errors, assert that:
  - [ ] error message is visible,
  - [ ] `input` has `aria-invalid="true"` or equivalent state where applicable,
  - [ ] `aria-describedby` points to error element (if implemented).

<!-- SPECIAL NOTE: Once form components are stable, add concrete examples:
     - paths to shared `FormField` components,
     - any custom a11y props wrappers, etc. -->

---

## 4. Keyboard & Focus Behaviour (Component-Level)

Integration tests won’t simulate every keyboard pattern (E2E/manual still needed), but we should cover key patterns when feasible:

For components providing complex interaction (modals, dropdowns, menus, tab lists):

- [ ] **Focus management**:
  - [ ] When a modal/dialog opens, focus moves to an appropriate element inside.
  - [ ] When it closes, focus returns to a sensible element (trigger or similar).

- [ ] **Keyboard accessibility**:
  - [ ] Actions can be triggered via keyboard (e.g. `Enter`/`Space` on buttons).
  - [ ] Components that behave like tabs, menus, or accordions respond to arrow keys if implemented.

In tests (where it’s reliable):

- [ ] Use `userEvent.tab()` to move focus and check `document.activeElement`.
- [ ] Use `userEvent.keyboard()` to simulate basic key interactions (e.g. ESC to close modal).

If full keyboard testing is too complex for integration, note:

- [ ] Covered instead in:
  - E2E tests (`a11y-e2e-checklist.md`), or
  - Manual QA.

---

## 5. Color & Contrast (Logic-Level Hooks)

Color contrast is primarily a **design token** and manual/audit concern.  
Integration tests can still assert a few **logic-level a11y behaviours**:

- [ ] When “disabled” state is applied to a control:
  - [ ] It uses proper `disabled` attribute or `aria-disabled="true"` (not just faded color).
- [ ] Visually hidden text for icons is implemented via proper CSS techniques (e.g. `sr-only` class), not `display: none`.

We generally do **not** assert raw color values in integration tests (design-level concern), but we can:

- [ ] Assert that theme tokens are applied via appropriate classes/props (if they affect semantics, e.g. `cursor-not-allowed`, `pointer-events-none`).

---

## 6. Running `axe` in Integration Tests

For selected components/pages:

- [ ] `axe` is run after rendering is stable (no major async pending state), e.g.:

  ```ts
  import { axe } from "jest-axe";

  it("has no basic accessibility violations", async () => {
    const { container } = renderWithProviders(<MyComponent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  ```
