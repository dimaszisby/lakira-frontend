# Accessibility Guidelines – Lakira Frontend

These guidelines define how we design and implement accessible UI for the Lakira frontend.

They are the **spec** that informs:

- Integration a11y tests  
  → `docs/internal/initiatives/tests-overhaul/3-integration-tests/a11y-testing-checklist.md`
- E2E a11y tests  
  → `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/a11y-e2e-checklist.md`
- Release review  
  → `docs/how-to/releases/a11y-release-checklist.md`

Lakira aims for **WCAG 2.1 AA** compliance as the baseline (and adopts WCAG 2.2 recommendations where practical).

---

## 1. Principles & Standards

We follow these high-level principles:

1. **Perceivable** – All information is available in text or other perceivable forms.
2. **Operable** – All functionality is usable via keyboard; no keyboard traps.
3. **Understandable** – Interface and copy are predictable, consistent, and clear.
4. **Robust** – Markup works well with assistive technologies (AT).

Baseline standards:

- WCAG 2.1 AA
- WAI-ARIA Authoring Practices (used **sparingly and correctly**)

---

## 2. Semantic HTML & Document Structure

### 2.1 Landmarks

Each “page” (route) must define clear landmarks:

- Use `<main>` for primary content.
- Use `<header>` / `<footer>` / `<nav>` where relevant.
- Avoid multiple `<main>` elements on the same page.

Guideline:

- Every route rendered under `/app` should have **exactly one** `<main>` container.

<!-- SPECIAL NOTE: Once layout shell is finalized, document component path, e.g.:
     - `src/app/(app)/layout.tsx` wraps pages with `<main>`. -->

### 2.2 Headings

- Each page should have **one primary heading** (`<h1>`) that describes the page (e.g., “Dashboard”, “Metric Library”).
- Use nested headings (`<h2>`, `<h3>`, …) in logical order; do not skip levels for visual styling reasons only.
- Do not rely on styled `<div>` for headings – use real heading elements plus CSS classes.

---

## 3. Links, Buttons & Interactive Controls

### 3.1 Buttons vs Links

- Use `<button>` for actions that **change state** in the app (submit form, open modal, toggle visibility).
- Use `<a>` with `href` for navigation to different routes/URLs.
- Never use clickable `<div>` or `<span>` for primary actions.

### 3.2 Accessible Names

All interactive controls must have accessible names:

- Text content (e.g. “Save metric”) is usually enough.
- Icon-only controls must have:
  - `aria-label`, or
  - visually hidden text (e.g., screen-reader-only class).

<!-- SPECIAL NOTE: Document the actual SR-only utility class once defined,
     e.g. `.sr-only` in `globals.css` or Tailwind’s `sr-only` class. -->

Examples:

- Close icon for modal → `aria-label="Close"`.
- Icon button for “Add metric” → visually hidden text “Add metric”.

---

## 4. Keyboard Interaction & Focus Management

### 4.1 Global Expectations

- All interactive elements must be reachable via `Tab` and operable via keyboard:
  - Buttons: `Enter`/`Space`.
  - Links: `Enter`.
- Do not remove `outline` without providing a visible focus style.
- Keyboard focus should be **visible** at all times.

Guideline:

- Use consistent focus styles defined in design tokens (e.g., focus ring using semantic colors).

<!-- SPECIAL NOTE: Link to focus style tokens once defined (e.g., `--focus-ring`, Tailwind classes). -->

### 4.2 Dialogs / Modals / Drawers

When using modal-like components:

- When opened:
  - Focus moves inside the dialog (ideally to the title or first interactive element).
- When closed:
  - Focus returns to the trigger element.
- Background content should not be focusable (using ARIA `aria-modal="true"` and proper dialog patterns, or equivalent).

If we simulate ESC-to-close:

- ESC key must close modal and restore focus.

### 4.3 Custom Widgets

If components behave like:

- Tabs
- Accordions
- Menus
- Comboboxes

…they should follow WAI-ARIA Authoring Practices for:

- roles (`tablist`, `tabpanel`, `menu`, etc.),
- ARIA attributes (`aria-selected`, `aria-expanded`, etc.),
- keyboard patterns (arrow keys, home/end).

Avoid reinventing these from scratch; prefer:

- Simpler native controls when possible, or
- Well-maintained accessible headless UI libraries (if adopted later).

---

## 5. Forms & Validation

### 5.1 Labels & Descriptions

- Every form control must have a visible `<label>` or an accessible name via `aria-label`/`aria-labelledby`.
- Use `placeholder` only as a hint, not the **only** label.
- For additional instructions, use helper text associated via `aria-describedby`.

### 5.2 Errors & Validation

- Indicate invalid fields via:
  - text error message near the field, and
  - `aria-invalid="true"` (or equivalent state in custom components),
  - optionally `aria-describedby` linking input to error element.

- For forms with multiple errors, consider:
  - An error summary at the top,
  - OR focusing the first invalid field after submit.

### 5.3 Grouped Controls

When a group of inputs share a common label (e.g. radio group):

- Use `<fieldset>` and `<legend>` when appropriate.
- Ensure each option is individually reachable and labelled.

### 5.4 Autocomplete & Types

- Use appropriate `type` attributes (`email`, `number`, `date`, etc.).
- Use `autocomplete` attributes where applicable (`email`, `name`, `new-password`, etc.).

---

## 6. Color, Contrast & Visual Design

Color decisions are implemented via Lakira’s **design tokens**.

### 6.1 Contrast

- Text and interactive elements must meet **WCAG 2.1 AA**:
  - Normal text: 4.5:1 contrast ratio.
  - Large text (≥ 18pt or ≥ 14pt bold): 3:1.
  - Icons and important UI indicators: treat as text for contrast purposes.

Guideline:

- New color combinations must be checked against the token palette.

<!-- SPECIAL NOTE: Add explicit link/reference to `color-palette.md` and any contrast checks you perform (e.g., tooling or Figma plugins). -->

### 6.2 Don’t Use Color Alone

- Never rely on color alone to convey meaning (e.g., “red means error”).
- Combine color with:
  - text labels (“Error”, “Success”),
  - icons (error/warning/info),
  - or patterns/shape distinctions where appropriate.

### 6.3 States

For interactive components:

- Define consistent styles for:
  - default,
  - hover,
  - active/pressed,
  - focus,
  - disabled.

Disabled state must use actual `disabled` attribute or `aria-disabled`, not just a faded color.

---

## 7. Components & Patterns

### 7.1 Navigation & Sidebar

- Use `<nav>` for main navigation regions.
- Provide labels using `aria-label` or `aria-labelledby` if there are multiple navs:
  - e.g. `<nav aria-label="Main navigation">`.

- Active/selected state of navigation items should be:
  - conveyed via more than color alone (underline, icon, bold text),
  - and announced via attributes (`aria-current="page"` where logical).

<!-- SPECIAL NOTE: Once navigation layout is finalized, add component path and any helper hooks for active state. -->

### 7.2 Tables & Data Grids

For data tables (e.g., metric categories, logs):

- Use `<table>`, not arbitrary `<div>` grids.
- Use `<th>` for header cells with `scope="col"` or `scope="row"` as appropriate.
- Provide caption or context for the table contents.

If you use custom virtualized lists or grids:

- Ensure roles (`grid`, `row`, `gridcell`) are used correctly.
- Only introduce ARIA grid roles if necessary; otherwise prefer simple tables.

### 7.3 Charts & Graphs

Charts (e.g., metric visualizations) must have:

- A programmatic label/heading describing what the chart shows.
- A **textual summary** of key insights:
  - e.g. “Last 7 days: average value 72, min 60, max 90.”

We do **not** rely solely on the visual chart; we provide numeric/text data accessible via screen readers.

Implementation ideas:

- Provide a list/table under the chart summarizing data points or aggregates.
- Use `aria-label` or `aria-describedby` for the canvas/chart container.

<!-- SPECIAL NOTE: After you finalize the Chart.js wrapper component, document its path and any built-in a11y helpers used. -->

### 7.4 Toasts & Notifications

- Toasts that communicate important information should be announced with:
  - `role="status"` or `role="alert"` depending on urgency.
- Avoid toasts that auto-dismiss too quickly; allow enough time to read.

---

## 8. Motion, Animation & Transitions

Lakira uses subtle animation (e.g. via Framer Motion).

Guidelines:

- Avoid large, constant animations or parallax on core screens.
- Respect the user’s **reduced motion** preferences:
  - Use the `prefers-reduced-motion` media query to:
    - reduce transition durations, or
    - disable non-essential animations.

- Do not animate properties that cause significant layout thrash in ways that may confuse users (e.g., rapid position/size changes on essential content).

---

## 9. Responsive Layout & Zoom

Lakira must remain usable on:

- Desktop
- Tablet
- Mobile

Guidelines:

- Content must not be cut off or require two-dimensional scrolling on small screens for core flows.
- All text must remain readable and functional with up to **200% zoom** without horizontal scrolling on typical phone widths (where possible).
- Components should wrap or stack appropriately at defined breakpoints.

<!-- SPECIAL NOTE: Reference actual responsive breakpoints used in Tailwind once finalized. -->

---

## 10. Dynamic Content & Live Updates

When content updates without a full page reload (React behavior):

- If the update is **purely decorative** (e.g., chart animating between states), no special announcement is needed.
- If the update is **important to the user** (success/error, new log entry, etc.):
  - announce via an ARIA live region (`role="status"` / `aria-live="polite"`),
  - or ensure focus is moved appropriately when triggered by explicit user action.

Examples:

- After successfully logging a metric:
  - Show success toast with `role="status"` and keep focus on the submit button or next logical element.

---

## 11. Testing & Review Workflow

Accessibility is enforced through:

1. **Design & implementation**
   - Designers and developers follow this guideline from the start.
   - New components are built with semantics and keyboard usage in mind.

2. **Automated tests**
   - Integration a11y checks via `jest-axe` on key components/pages.
   - E2E a11y checks via `cypress-axe` on full pages (login, dashboard, metrics, main forms).

3. **Manual checks**
   - Keyboard-only navigation on primary flows.
   - Screen reader smoke tests (at least on login + dashboard).
   - Visual checks for focus states and contrast.

---

## 12. Exceptions & Documentation

If a component or page cannot fully meet these guidelines due to:

- third-party library limitations, or
- temporary design constraints,

Then:

- Document the exception in:
  - relevant test file comments, and/or
  - a dedicated section in `a11y-release-checklist.md` or an issue tracker.
- Prefer **targeted exceptions** (e.g. ignoring one specific axe rule on one selector) over broad disables.
- Add a TODO or issue link explaining how/when it should be fixed.

---

## 13. Ownership & Maintenance

- Any new feature or major refactor touching UI must consider:
  - this guideline,
  - associated integration/E2E a11y checklists.
- When a bug related to accessibility is found:
  - Fix it,
  - Add or adjust tests/checklists to prevent regressions,
  - Update this document if the guideline itself needs clarification.

This document should evolve with the product and should be reviewed periodically (e.g. yearly or when large design-system changes happen).
