# Component Styling with Tailwind and Tokens

This document defines how to build scalable, maintainable styles for Lakira UI components.

---

## 1. Core Principle: Token-First Styling

Rules:

- Use semantic design tokens (`--bg`, `--text`, `--ring`, component tokens) as styling source of truth.
- No raw colour values anywhere but `src/styles/tokens/palette.css`.
- Map visual states (`hover`, `active`, `disabled`, `focus`) in recipe CSS.

Reason:

- Tokenized styles improve consistency, theming, and maintainability.

The full styling contract — which decision lives in which file — and the lint rules that enforce it
are in [`.claude/rules/styling.md`](../../../.claude/rules/styling.md). The decision record is
[ADR-0016](../../explanation/decisions/adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md).

---

## 2. Tailwind Class Construction Rules

Rules:

- Keep class names statically discoverable by Tailwind.
- Avoid dynamic interpolation such as `bg-${color}-500`.
- In `src/components/ui`, do not build variant class maps. Set `data-*` attributes and let the recipe
  map them.
- Use `cn()` for class composition and conflict resolution.
- In `src/components/ui`, ESLint rejects arbitrary values (`z-[60]`), colour utilities with an
  opacity modifier (`bg-brand-primary/15`) and inline `style` keys that are not custom properties.

Example pattern:

```tsx
<span data-variant={variant} data-size={size} className={cn("badge", className)} />
```

```css
.badge[data-variant="danger"] {
  --badge-bg: var(--badge-danger-bg);
}
```

A runtime value, such as a user-picked colour, passes through a custom property that the recipe
reads:

```tsx
<span className="color-swatch" style={{ "--swatch": hex } as CSSProperties} />
```

---

## 3. Recommended Styling Strategies (Choose by Complexity)

### Strategy A: Utility-Only (Simple Components)

Use when:

- Component has low variant/state complexity.
- Styling is local and unlikely to be shared.

Pros:

- Fast iteration.
- Minimal CSS files.

Cons:

- Can become noisy when variants/states grow.

### Strategy B: Utility + Token Recipe Classes (Default for Shared Primitives)

Use when:

- Component has multiple variants/sizes/states.
- Component is reused across many screens.
- Theme support and semantic stability matter.

Pros:

- Scales better.
- Fits current Lakira token architecture.

Cons:

- Requires maintaining token and recipe layers.

### Strategy C: CSS Module (or scoped CSS) for Complex Visual Logic

Use when:

- Layout/animation logic is too complex for clean utility composition.
- You need detailed selectors that reduce JSX noise.

Pros:

- Better readability for advanced visual behavior.

Cons:

- Can drift from token system if not disciplined.

Default recommendation:

- Use Strategy B for primitive UI components.

---

## 4. Variant and Size API Patterns

Rules:

- Variant names should be semantic (`primary`, `secondary`, `destructive`, `ghost`).
- Size names should be abstract (`sm`, `md`, `lg`), not pixel-specific.
- Use `data-*` attributes to apply variant/size styles.

Current Lakira-aligned approach:

- `data-variant` + `data-size` + tokenized recipe classes (as in `Button`).
- Ariakit state attributes (`data-active-item`, `data-focus-visible`, `aria-selected`) for
  interactive state.

### Consistency spec

Every primitive draws these from `src/styles/tokens/scales.css` and `semantic.css`:

| Dimension               | Token                                                                           | Value                                          |
| ----------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------- |
| Control height sm/md/lg | `--control-h-*`                                                                 | 40 / 48 / 56 px                                |
| Control radius          | `--control-radius-*`                                                            | `--radius-sm` / `-md` / `-lg`, matching Button |
| Elevation               | `--elevation-control` / `-popover` / `-dialog`                                  | `--shadow-xs` / `-md` / `-md`                  |
| Layering                | `--z-sticky` / `-dropdown` / `-modal` / `-popover` / `-blocking`                | ordered scale                                  |
| Focus                   | `--focus-ring-width`, `--focus-ring-offset`, colour `--ring`                    | 2px outline, 2px offset                        |
| Disabled                | `--disabled-opacity`                                                            | 0.5, plus real `disabled` / `aria-disabled`    |
| Hover / selected        | `--interactive-hover`, `--interactive-selected-bg`, `--interactive-selected-fg` | `surface-2`; brand tint with dark text         |
| Motion                  | `--duration-fast`, `--duration-normal`, `--ease-standard`                       | 150 / 200 ms; off under reduced motion         |
| Icons                   | `--icon-xs` / `-sm` / `-md` / `-lg`                                             | 14 / 16 / 20 / 24 px                           |
| Target size             | `--target-min`, `--target-icon-button`                                          | 24 px minimum; 32 px for in-field icon buttons |

### Shared recipes

| Recipe                                                                                                 | Used by                                                                                         |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `input` (`.input-shell`, `.input-control`, …)                                                          | TextField, TextArea, SearchInput, Select / DateTimePicker / ColorField triggers, CategorySelect |
| `popover` (`.popover`, `.listbox`, `.listbox-item`)                                                    | Select, DateTimePicker, ColorField, CategorySelect                                              |
| `dialog`                                                                                               | Modal (content keeps `.card`)                                                                   |
| `feedback` (`.spinner`, `.skeleton`, `.empty-state`, …)                                                | Spinner, FullScreenSpinner, SkeletonLoader, EmptyDataIndicator, IconLabel, DataLabel            |
| `segmented`                                                                                            | SegmentedControl, ListModeToggle, ThemeSwitcher                                                 |
| `switch`, `slider`, `chip`, `pager`, `table`, `calendar`, `color-field`, `swipe-card`, `field-message` | one primitive each                                                                              |

---

## 5. State Styling Standards

Each interactive component must define:

1. Default
2. Hover
3. Active/pressed
4. Focus-visible
5. Disabled
6. Loading (if supported)
7. Invalid/error (for form controls)

Rules:

- Focus styles must be visible and high-contrast.
- Disabled state must use real disabled semantics plus visual styling.
- Do not rely on color alone for status communication.

---

## 6. Theming and Color Modes

Rules:

- Theme changes should be token swaps, not component-level class rewrites.
- Use semantic token names in components (`text-ink-secondary`, `bg-surface`), not palette token names.
- Dark mode and future themes must be opt-in at token layer.

---

## 7. Layout and Spacing

Rules:

- Use spacing scale tokens/utilities consistently.
- Avoid one-off magic numbers unless necessary and documented.
- Prefer container/layout primitives for repeated patterns.

---

## 8. Animation and Motion

Rules:

- Use motion to clarify state transitions, not as decoration.
- Keep durations and easing consistent with design tokens (`--duration-*`, `--ease-standard`).
- Respect reduced-motion preferences: recipes turn transitions off under
  `prefers-reduced-motion: reduce`, and framer-motion animations use `useReducedMotion`.

---

## 9. Anti-Patterns to Avoid

- Hard-coded color values in reusable primitives.
- Variant explosion without token abstraction.
- Dynamic class name construction that Tailwind cannot detect.
- Mixing multiple style strategies in one component without reason.
- Unbounded `className` overrides that can break semantic states.

---

## 10. Definition of Done (Styling)

A component is styling-complete when:

1. Uses semantic token-driven styling.
2. Variant and size behavior is explicit and scalable.
3. All interaction states are defined and consistent.
4. No Tailwind dynamic-class pitfalls are introduced.
5. Theming support is preserved by design.
