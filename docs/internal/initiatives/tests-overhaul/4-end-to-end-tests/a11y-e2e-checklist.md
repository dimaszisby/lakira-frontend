# Accessibility E2E Test Checklist – Lakira Frontend

This checklist defines how we apply **accessibility (a11y) checks** at the **end-to-end (E2E)** level using Cypress (or Playwright) and `cypress-axe` (or equivalent).

Use it when:

- Creating/updating E2E specs for **core flows** (auth, dashboard, metrics, logging, settings).
- Preparing a **release** where automated a11y checks should run on real pages.

> High-level guidelines live in `docs/reference/accessibility-baseline.md`.  
> Integration-level checks are in `3-integration-tests/a11y-testing-checklist.md`.  
> This file focuses on **what we do at full-page, real-browser level**.

---

## 0. Preconditions

Before adding E2E a11y checks:

- [ ] `cypress-axe` (or equivalent) is installed and configured.
- [ ] Global Cypress support file:
  - [ ] Imports `cypress-axe`.
  - [ ] Defines commands like `cy.injectAxe()` and `cy.checkA11y()`.
- [ ] The E2E environment runs the **real app**:
  - [ ] Real routing/layout, not isolated components.
  - [ ] Real theme and design system loaded.

<!-- SPECIAL NOTE: Document actual file paths once stable, e.g.:
     - `cypress/support/e2e.ts`
     - `cypress/support/commands.ts` for axe helpers. -->

---

## 1. Where to Run a11y Checks in E2E

To keep tests fast and meaningful, we run E2E a11y checks on **key pages/flows**:

- [ ] Login page.
- [ ] Dashboard.
- [ ] Metrics list/library page.
- [ ] Metric detail page (with chart + logs rendered).
- [ ] A primary data-entry form (e.g. “create metric”, “log metric”, “settings”).
- [ ] Any critical modal/dialog-based flows (if not adequately covered via integration tests).

We usually **don’t** run axe on every single route to avoid slow suites; we aim for **broad coverage of main layouts**.

---

## 2. Page-Level Semantics & Landmarks

For each target page under E2E a11y scrutiny:

- [ ] After the page has fully rendered (no major loaders), we call `cy.injectAxe()` and `cy.checkA11y()` on:
  - [ ] The **entire page** (`cy.checkA11y()` with no filter)  
         _or_
  - [ ] A main container (e.g. `main` region) to scope checks.

- [ ] We expect:
  - [ ] No critical violations.
  - [ ] Any known exceptions documented via comments in the spec.

Additionally (by assertions if needed):

- [ ] A `<main>` region exists and contains the majority of page content.
- [ ] Key navigation landmarks (`<nav>`, `<header>`, `<footer>`) are present where relevant.

---

## 3. Navigation & Focus Flow

E2E is the right layer to check **global navigation and focus** across pages:

- [ ] **Tab order** is sensible for main flows:
  - [ ] Starting from the browser’s focus, pressing `Tab` cycles through interactive elements in a logical order on at least:
    - login page,
    - dashboard,
    - a main form page.

- [ ] **Route-to-route focus**:
  - [ ] When navigating to a new page (via link, redirect, or programmatic navigation):
    - Focus is moved to a main landmark or top-level heading (if implemented),
    - Or at least not left on a hidden/irrelevant element.

- [ ] **Keyboard triggering of actions**:
  - [ ] For key interactive elements (primary buttons/links in flows), we can:
    - Trigger them via `Enter`/`Space` using `cy.realPress` or equivalent (if available),
    - And assert expected navigation or UI change.

If full keyboard coverage becomes too expensive, at minimum:

- [ ] Ensure that **primary flows** (login, main form submit, dashboard navigation) can be driven entirely by keyboard.

---

## 4. Forms & Error Handling (Full-App Context)

For core forms (auth, metric create/edit, log create, settings) when tested end-to-end:

- [ ] Labels & errors:
  - [ ] Same form label expectations as integration tests, but in real page context.
  - [ ] When validation errors occur (client/server), visible error messages are readable with axe and screen-reader tools.

- [ ] Live regions (if used):
  - [ ] If success/error messages are implemented as alerts, they use appropriate ARIA roles (`role="alert"` or similar).

- [ ] Focus on error:
  - [ ] For the most critical forms (e.g. login), after submit with invalid data:
    - Focus moves to the first invalid field or error summary (if such behaviour is intended),
    - Or at least, error messages are clearly associated with problem fields.

These behaviours may be partially asserted in integration tests, but E2E ensures they hold **with real routing and global layout**.

---

## 5. Modals, Dialogs & Overlays

When E2E tests cover flows using modals/dialogs:

- [ ] Opening a modal:
  - [ ] Sets focus inside the dialog on a meaningful element (heading or first interactive field).
  - [ ] Background content is inert or not focusable (if following modal pattern).

- [ ] Closing the modal:
  - [ ] ESC key closes the modal (if design requires it).
  - [ ] Focus returns to the trigger element or another sensible target.

In E2E tests, where possible:

- [ ] Simulate opening/closing via keyboard and mouse.
- [ ] Use `cy.checkA11y()` either when the modal is open **or** when it’s closed (or both if necessary).

---

## 6. Running axe in E2E – Usage Pattern

For each key E2E spec where a11y is in scope:

- [ ] Use a consistent helper, e.g.:

  ```ts
  it("login page has no detectable a11y violations", () => {
    cy.visit("/login");

    cy.injectAxe();

    // Optionally wait for any async content/loaders to settle
    // cy.get("[data-test=page-ready]").should("exist");

    cy.checkA11y(); // Or scoped selector like "main"
  });
  ```
