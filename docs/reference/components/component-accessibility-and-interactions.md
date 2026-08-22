# Component Accessibility and Interaction Guidelines

This document defines non-negotiable accessibility and interaction standards for Lakira UI components.

For broader project rules, also use:

- `docs/reference/accessibility-baseline.md`

---

## 1. Baseline Standard

Targets:

- WCAG 2.1 AA minimum
- WCAG 2.2 improvements where practical
- WAI-ARIA APG behavior for composite widgets

Rule:

- Accessibility is part of component API design, not a post-implementation patch.

---

## 2. Universal Requirements for Interactive Components

Each interactive component must have:

1. Correct semantic element (`button`, `a`, `input`, etc.).
2. Accessible name (visible label, `aria-label`, or `aria-labelledby`).
3. Keyboard operability (`Tab`, `Enter`, `Space`, arrows where applicable).
4. Visible focus indicator (`focus-visible` styling).
5. State exposure (`disabled`, `aria-disabled`, `aria-invalid`, `aria-expanded`, etc.).

---

## 3. Pattern Standards by Component Type

### 3.1 Buttons

Rules:

- Use `<button>` for actions, `<a>`/`Link` for navigation.
- Icon-only buttons must provide an accessible name.
- Loading buttons must expose busy state and prevent duplicate action.

### 3.2 Form Controls

Rules:

- Every input/select/textarea needs a label relationship.
- Invalid fields must expose error state via `aria-invalid` and associated error text.
- Helper text and error text should be wired via `aria-describedby`.

### 3.3 Modal/Dialog

Rules:

- Dialog container uses proper dialog semantics.
- Focus moves into dialog on open.
- Focus returns to trigger on close.
- Escape closes dialog unless explicitly disallowed.
- Background content is not interactable while modal is open.

### 3.4 Select/Listbox/Combobox

Rules:

- Keyboard navigation must follow APG pattern expectations.
- Active option state and selected state are communicated semantically.
- Disabled options are skipped correctly in keyboard navigation.

---

## 4. Native vs Headless Libraries (Two Approaches)

### Approach A: Native + Light Custom Logic

Use when:

- Component behavior is simple.
- Native semantics cover most requirements.

Pros:

- Lower dependency surface.
- High semantic reliability.

Cons:

- Complex widgets become hard to implement correctly.

### Approach B: Headless Accessibility Library (Ariakit)

Use when:

- Building advanced widgets (combobox, menu, dialog stack, composite navigation).
- You need battle-tested ARIA and keyboard behavior.

Pros:

- Strong accessibility defaults and patterns.
- Reduced risk for complex interactions.

Cons:

- Additional abstraction to learn.

Default recommendation:

- Use native-first for simple controls.
- Use Ariakit for complex composite widgets.

---

## 5. Keyboard Interaction Baseline

Minimum expectations:

- `Tab`/`Shift+Tab`: move focus between interactives.
- `Enter`/`Space`: activate buttons and selectable items.
- `Escape`: close transient overlays/dialogs.
- Arrow keys: navigate listbox/menu/tab patterns where relevant.

Rule:

- Keyboard behavior must be intentionally tested for every custom widget.

---

## 6. Focus Management

Rules:

- Never remove focus outline without equivalent visible replacement.
- Use `focus-visible` for keyboard-first signal quality.
- Do not trap focus unless component pattern requires it (e.g., modal).
- Restore user context after dismissal actions (dialogs, popovers).

---

## 7. Announcements and Live Regions

Use live announcements sparingly:

- Success/error toast updates.
- Async loading status changes when needed for screen readers.

Rules:

- Prefer semantic elements and state attributes first.
- Avoid chatty live regions that create noise.

---

## 8. Touch Target and Input Ergonomics

Rules:

- Hit targets should satisfy WCAG 2.2 guidance for target size where feasible.
- Avoid tiny icon-only tap areas.
- Maintain enough spacing between adjacent interactive controls.

---

## 9. Accessibility Test Expectations

Each reusable component should be verified by:

1. Screen-reader-name check for controls.
2. Keyboard path check for all actions.
3. Focus visibility check.
4. Basic automated a11y checks (Testing Library + jest-dom + aXe when available).

---

## 10. Definition of Done (A11y and Interaction)

A component is accessibility-complete when:

1. Semantic role is correct by default.
2. Accessible naming is guaranteed.
3. Keyboard behavior matches pattern expectations.
4. Focus flow is intentional and tested.
5. State and errors are programmatically exposed.
