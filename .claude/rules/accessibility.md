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

## Structure

- **Exactly one `<main>` per route** under `src/app/`.
- Landmarks for the shell: `<header>`, `<nav>`, `<main>`, `<footer>`. `src/components/layout/` owns these.
- Heading hierarchy descends without skipping. A page has one `<h1>`.
- Links navigate; buttons act. A `<div onClick>` is neither — it is invisible to keyboard and screen reader users.

## Every interactive element

- Reachable and operable by keyboard, in a sensible tab order.
- Has a visible focus indicator. The `--ring` token exists for this; do not remove outlines without replacing them.
- Has an accessible name — visible text, `aria-label`, or `aria-labelledby`.
- Disabled state uses `disabled` or `aria-disabled`, matching the `button.recipe.css` selector `:disabled, [aria-disabled="true"]`.

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

Queries in tests should be by role and accessible name. `getByRole("button", { name: /save/i })` failing is usually a real accessibility defect, not a test that needs a `data-testid`.

## Current tooling gaps

Know these so you do not mistake a passing lint run for a passing a11y check:

- **`eslint-plugin-jsx-a11y` is installed but only `alt-text` is enabled.** The recommended ruleset is not spread in, so label association, ARIA validity, and keyboard handlers are all unchecked by lint.
- **`npm run check-accessibility` was removed on 2026-08-27.** It ran `npm install axe-core && echo` and asserted nothing. It was not replaced: all 16 integration suites already carry `toHaveNoViolations`, so a dedicated script would be an exact alias for `npm run test:integration`, which gates CI. Run that.
- There is no `cypress-axe`, so E2E accessibility is not covered. `docs/internal/initiatives/tests-overhaul/4-end-to-end-tests/a11y-e2e-checklist.md` describes the intent.

Until those close, `jest-axe` in integration tests is the only automated coverage — and axe catches roughly a third of real issues. Keyboard-test anything you build by hand.
