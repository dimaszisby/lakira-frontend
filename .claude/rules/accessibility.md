---
paths:
  - src/components/**
  - src/features/**/components/**
  - src/app/**
  - "**/*.int.test.tsx"
---

# Accessibility

Canonical baseline: [`docs/reference/accessibility-baseline.md`](../../docs/reference/accessibility-baseline.md). Release gate: [`docs/how-to/releases/a11y-release-checklist.md`](../../docs/how-to/releases/a11y-release-checklist.md).

Target is **WCAG 2.1 AA**, with 2.2 criteria where practical.

## Build on Ariakit

`@ariakit/react` is the accessible-primitive foundation — Modal, Select, DateTimePicker, SegmentedControl, and so on. **Reach for it before hand-rolling any interactive widget.** Focus management, ARIA wiring, and keyboard interaction are the hard parts, and a hand-rolled dropdown gets them wrong in ways that unit tests do not catch.

If Ariakit has no primitive for what you need, the widget needs a documented keyboard model before it needs styling.

What is built on it today: Modal (`Dialog`), Select, DateTimePicker (`Popover` plus a `role="grid"` `Composite`), ColorField (`Popover`), SegmentedControl and ListModeToggle (`RadioGroup`), CategorySelect (`Combobox`). Slider stays hand-rolled on the WAI-ARIA slider pattern. See [ADR-0016](../../docs/explanation/decisions/adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md).

- **Render Ariakit radios as native inputs.** Ariakit only selects a radio on arrow-key focus when it is a real `<input type="radio">`. Rendered as a `<button>`, arrow keys move focus without changing the value. Wrap the input in a `<label>` and style the label.

## Structure

- **Exactly one `<main>` per route** under `src/app/`.
- Landmarks for the shell: `<header>`, `<nav>`, `<main>`, `<footer>`. `src/components/layout/` owns these.
- Heading hierarchy descends without skipping. A page has one `<h1>`.
- Links navigate; buttons act. A `<div onClick>` is neither — it is invisible to keyboard and screen reader users.

## Every interactive element

- Reachable and operable by keyboard, in a sensible tab order.
- Has a visible focus indicator: a `--focus-ring-width` outline in `--ring` with `--focus-ring-offset`. For Ariakit composite items, style `[data-focus-visible]` too. Do not remove outlines without replacing them.
- Has an accessible name: visible text, `aria-label` or `aria-labelledby`. When there is visible text, the accessible name must contain it (WCAG 2.5.3); do not override a visible label with a different `aria-label`.
- Has a pointer target of at least 24×24 CSS px (WCAG 2.2 AA; `--target-min`). Icon buttons inside fields use `--target-icon-button`. A smaller visual, such as a slider thumb, gets its hit area from a pseudo-element.
- Uses `disabled` or `aria-disabled` for its disabled state, matching the `button.recipe.css` selector `:disabled, [aria-disabled="true"]`.
- Never depends on dragging alone (WCAG 2.5.7). A swipe or drag action needs a single-pointer and keyboard alternative, like SwipeableCard's "More actions" button.
- Respects `prefers-reduced-motion`. Recipes turn transitions off under it, and framer-motion animations use `useReducedMotion`.

## Content

- Every `<img>` has `alt`. Decorative images get `alt=""`. This is the one `jsx-a11y` rule currently enabled, so lint catches it — but only this one.
- Form inputs have associated `<label>`s. A placeholder is not a label.
- Error messages are associated with their field via `aria-describedby` and announced, not only coloured red.
- Colour is never the sole carrier of meaning. Status needs an icon or text alongside the token colour.
- Contrast meets AA against the **semantic** tokens in both themes. Check dark mode explicitly — `semantic.css` overrides surfaces and text independently, so a pairing that passes in light can fail in dark.

## Testing

**Every `*.int.test.tsx` asserts no axe violations:**

```tsx
const { container } = renderWithProviders(<MetricsPageClient />);
expect(await axe(container)).toHaveNoViolations();
```

`toHaveNoViolations` is registered globally in `jest.setup.ts`, so it is available in unit tests too — use it on any component that owns interactive structure, not just at the page level.

jsdom has no layout and no `inert`, so `jest.setup.ts` shims `Element.checkVisibility` (Ariakit uses it to find tabbable elements) and `HTMLElement.inert`. Two consequences for tests:

- Ariakit dialogs portal into `document.body`. Query them with `screen` and run axe on `document.body`.
- jsdom does not apply `inert` to keyboard navigation, so Tab cannot be shown to wrap inside a modal. Assert that the rest of the page is `inert`, which is the mechanism browsers enforce.

Queries in tests should be by role and accessible name. `getByRole("button", { name: /save/i })` failing is usually a real accessibility defect, not a test that needs a `data-testid`.

## Current tooling gaps

Know these so you do not mistake a passing lint run for a passing a11y check:

- **`eslint-plugin-jsx-a11y` is installed but only `alt-text` is enabled.** The recommended ruleset is not spread in, so label association, ARIA validity, and keyboard handlers are all unchecked by lint.
- **`npm run check-accessibility` was removed on 2026-08-27.** It ran `npm install axe-core && echo` and asserted nothing. It was not replaced: all 16 integration suites already carry `toHaveNoViolations`, so a dedicated script would be an exact alias for `npm run test:integration`, which gates CI. Run that.
- There is no `cypress-axe`, so E2E accessibility is not covered. `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/a11y-e2e-checklist.md` describes the intent.

Until those close, `jest-axe` in integration tests is the only automated coverage — and axe catches roughly a third of real issues. Keyboard-test anything you build by hand.
