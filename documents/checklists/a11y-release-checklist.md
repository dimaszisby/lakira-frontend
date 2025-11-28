# Accessibility Release Checklist – Lakira Frontend

Use this checklist before a **release** (or major UI/UX change) to ensure Lakira continues to meet its accessibility goals.

It ties together:

- [Accessibility Guidelines](../documentation/accessibility-guidelines.md)
- [Integration A11y Checklist](../tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md)
- [E2E A11y Checklist](../tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md)

---

## 0. Preconditions

Before running this checklist:

- [ ] All tests are green:
  - [ ] Unit + integration tests
  - [ ] E2E smoke suite
- [ ] Any new UI is considered stable (no major redesign expected before release).
- [ ] No **known critical accessibility regressions** are currently open without a plan.

This checklist focuses specifically on **a11y**.

---

## 1. Key Pages & Flows in Scope

At minimum, the following **must** be checked:

- [ ] **Authentication**
  - Login page
  - Registration page (if present)
- [ ] **Dashboard**
  - Main overview screen
- [ ] **Metrics**
  - Metrics list/library page
  - Metric detail page (including chart + logs)
  - Metric create/edit flow
- [ ] **Logging**
  - Metric logging form
- [ ] **Settings / Profile** (if present)

If there are new or heavily-changed pages, add them to this list.

---

## 2. Automated Checks – Integration Level

Confirm that integration tests cover the key pieces:

- [ ] For each **core form** (auth, metric create/edit, log, settings):
  - [ ] Integration tests use `getByLabelText` / accessible queries.
  - [ ] Validation errors are displayed and associated with inputs.
  - [ ] At least one `jest-axe` test exists for:
    - [ ] Login form (or main auth form).
    - [ ] A primary metric form (create/edit).
    - [ ] A main layout or page (e.g., dashboard or metric detail).

- [ ] Any `jest-axe` violations that remain are:
  - [ ] Documented in comments or issues.
  - [ ] Accepted only as temporary with a plan.

See:

- [Integration A11y Checklist](../tests-plans-and-logs/3-integration-tests/a11y-testing-checklist.md)

---

## 3. Automated Checks – E2E Level

Verify E2E a11y coverage for full pages:

- [ ] `cypress-axe` or equivalent is configured and running.
- [ ] At least the following have `cy.checkA11y()` (or equivalents):
  - [ ] Login page
  - [ ] Dashboard
  - [ ] One metrics page (list or detail)
  - [ ] One main form flow (e.g., metric create or log metric)

- [ ] E2E a11y tests are passing in **staging / test environment** matching the release.

Any remaining violations:

- [ ] Are explicitly triaged:
  - [ ] Marked as acceptable _for now_,
  - [ ] with GitHub issues / TODOs for fixes.

See:

- [E2E A11y Checklist](../tests-plans-and-logs/4-end-to-end-tests/a11y-e2e-checklist.md)

---

## 4. Manual Keyboard Testing

Run manual keyboard-only passes on:

- [ ] Login page
- [ ] Dashboard
- [ ] Metrics list/library
- [ ] Metric detail (including chart, logs, and settings)
- [ ] Metric create/edit flow
- [ ] Metric log flow
- [ ] Settings/profile (if present)

For each:

- [ ] All interactive elements are reachable by `Tab` / `Shift+Tab`.
- [ ] Focus order is logical (follows visual layout).
- [ ] No keyboard traps (can always reach the browser chrome / address bar again).
- [ ] Primary actions can be activated via keyboard:
  - Buttons: `Enter` or `Space`.
  - Links: `Enter`.

For modals/dialogs:

- [ ] Focus moves into the modal when opened.
- [ ] ESC (if supported) closes the modal.
- [ ] Focus returns to the trigger when closed.
- [ ] Background content is not focusable while modal is open.

---

## 5. Screen Reader / Semantic Sanity Checks

On at least:

- Login,
- Dashboard,
- A metrics page,
- A main form,

do a light screen-reader check (NVDA/JAWS/VoiceOver, whichever you have):

- [ ] Page has a clear main heading that matches the visual title (e.g., “Dashboard”).
- [ ] Landmarks (`main`, `nav`, `header`) are present and sensibly named.
- [ ] Form fields are announced with useful labels and statuses:
  - Name + required state.
  - Error message when invalid.
- [ ] Navigation items are announced with:
  - clear names,
  - active state via `aria-current="page"` where appropriate.

Even a short sanity pass catches major structural issues.

---

## 6. Color, Contrast & Visual States

Verify visually (using design tokens and tools if needed):

- [ ] Text contrast on key pages meets **WCAG 2.1 AA**:
  - Normal text ≥ 4.5:1
  - Large text ≥ 3:1
- [ ] Buttons, links, and key icons are distinguishable against background.
- [ ] Color is **not the only** way to convey meaning:
  - Errors include icons/text, not just red color.
  - Success and warning states similarly have non-color signifiers.

Focus states:

- [ ] All focusable elements have a visible focus indicator.
- [ ] Focus rings are not removed without a usable replacement.

---

## 7. Dynamic Content & Notifications

For toasts, alerts, and other dynamic updates:

- [ ] Important notifications use appropriate roles (`role="status"`, `role="alert"`) so screen readers announce them.
- [ ] Success/error messages after actions (e.g. metric saved, log added) are:
  - visible long enough to read,
  - accessible to assistive technologies.

Charts and visualizations:

- [ ] Each chart has:
  - a title or label,
  - a textual summary of key information (e.g., current value, trend).
- [ ] Users who cannot see the chart can still understand their data from text/numbers.

---

## 8. Known Issues & Exceptions

Before release:

- [ ] All known a11y issues are:
  - [ ] documented in an issue tracker,
  - [ ] referenced from PRs where relevant,
  - [ ] categorized by severity:
    - Blocker – must fix before release.
    - High – should be prioritized, consider blocking if user-impacting.
    - Medium/Low – acceptable with clear remediation plan.

- [ ] Any **exceptions** (e.g. third-party components that are partially inaccessible) have:
  - [ ] a technical note or workaround,
  - [ ] an issue logged for future improvement.

---

## 9. Final Accessibility Gate

The release is **a11y-approved** if:

- [ ] All automated a11y tests (integration + E2E) pass.
- [ ] Core flows are keyboard-accessible and screen-reader sane.
- [ ] Contrast and focus states meet guidelines on key pages.
- [ ] No unresolved _critical_ a11y regressions exist compared to previous release.
- [ ] Any remaining issues are:
  - [ ] documented,
  - [ ] accepted with clear follow-up actions.

If any of the above are not true, release should:

- [ ] Be delayed until fixed, or
- [ ] Proceed only with explicit sign-off and a clear plan to address issues.
