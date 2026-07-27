# Component Styling with Tailwind and Tokens

This document defines how to build scalable, maintainable styles for Lakira UI components.

---

## 1. Core Principle: Token-First Styling

Rules:

- Use semantic design tokens (`--bg`, `--text`, `--ring`, component tokens) as styling source of truth.
- Avoid hard-coded hex/RGB values inside JSX.
- Map visual states (`hover`, `active`, `disabled`, `focus`) via tokens or semantic utilities.

Reason:

- Tokenized styles improve consistency, theming, and maintainability.

---

## 2. Tailwind Class Construction Rules

Rules:

- Keep class names statically discoverable by Tailwind.
- Avoid dynamic interpolation such as `bg-${color}-500`.
- Use explicit variant maps/objects for conditional classes.
- Use `cn()` for class composition and conflict resolution.

Example pattern:

```tsx
const variantClass: Record<Variant, string> = {
  primary: "text-ink-inverted bg-brand-primary",
  secondary: "text-brand-primary border border-brand-primary",
};

className={cn("inline-flex items-center", variantClass[variant], className)}
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
- Use `data-*` attributes or explicit class maps to apply variant/size styles.

Current Lakira-aligned approach:

- `data-variant` + `data-size` + tokenized recipe classes (as in `Button`).

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
- Keep durations and easing consistent with design tokens.
- Respect reduced-motion preferences for non-essential animation.

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
