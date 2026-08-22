# Your first component

Build a `Badge` primitive that is themed entirely by design tokens, has variants driven by data
attributes, and ships with passing unit and accessibility tests.

Start from a working app — finish [Getting started](./getting-started.md) first.

`src/components/ui/Card.tsx` and its token pair are the reference implementation. Open them
alongside this.

## The pattern

A primitive with its own visual identity gets **three** files:

| File                                            | Layer               | Holds                                        |
| ----------------------------------------------- | ------------------- | -------------------------------------------- |
| `src/styles/tokens/components/badge.tokens.css` | `@layer base`       | Variant → palette mapping. Variables only.   |
| `src/styles/tokens/components/badge.recipe.css` | `@layer components` | The `.badge` class and its `[data-*]` rules. |
| `src/components/ui/Badge.tsx`                   | React               | Props → `data-*` attributes. No colours.     |

The split is the point. The component never names a colour; it names a _variant_, and CSS resolves
that to a token. Changing the palette then requires touching no TSX at all.

## 1. Tokens

`src/styles/tokens/components/badge.tokens.css`:

```css
@layer base {
  :root {
    --badge-neutral-bg: var(--surface);
    --badge-neutral-fg: var(--text);
    --badge-neutral-border: var(--border);

    --badge-success-bg: var(--status-success-bg);
    --badge-success-fg: var(--status-success-emphasis);
    --badge-success-border: var(--status-success);

    --badge-danger-bg: var(--status-error-bg);
    --badge-danger-fg: var(--status-error-emphasis);
    --badge-danger-border: var(--status-error);
  }
}
```

These reference the **semantic** layer, not the palette. That is what makes the badge follow the
theme automatically — semantic variables are already redefined under `:root[data-theme="dark"]`.

## 2. Recipe

`src/styles/tokens/components/badge.recipe.css`:

```css
@layer components {
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding-inline: var(--space-2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--badge-neutral-border);
    background: var(--badge-neutral-bg);
    color: var(--badge-neutral-fg);
  }

  .badge[data-variant="success"] {
    border-color: var(--badge-success-border);
    background: var(--badge-success-bg);
    color: var(--badge-success-fg);
  }

  .badge[data-variant="danger"] {
    border-color: var(--badge-danger-border);
    background: var(--badge-danger-bg);
    color: var(--badge-danger-fg);
  }

  .badge[data-size="sm"] {
    height: 1.25rem;
    font-size: 0.75rem;
  }

  .badge[data-size="md"] {
    height: 1.5rem;
    font-size: 0.875rem;
  }
}
```

Spacing and radius come from `scales.css`. Never write a raw `px` value where a scale token exists.

## 3. Register the layers

Both files must be imported in `src/styles/globals.css`, tokens **before** recipe, and both before
the `@tailwind` directives:

```css
@import url("./tokens/components/card.tokens.css");
@import url("./tokens/components/card.recipe.css");
@import url("./tokens/components/badge.tokens.css");
@import url("./tokens/components/badge.recipe.css");

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Get the order wrong and the recipe references variables that do not exist yet. The property is
silently dropped — no error, just an unstyled badge.

## 4. The component

`src/components/ui/Badge.tsx`:

```tsx
import type { HTMLAttributes } from "react";
import React from "react";

import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "success" | "danger";
export type BadgeSize = "sm" | "md";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "neutral", size = "md", className, ...rest }, ref) => (
    <span
      ref={ref}
      className={cn("badge", className)}
      data-variant={variant}
      data-size={size}
      {...rest}
    />
  ),
);

Badge.displayName = "Badge";

export default Badge;
```

Four rules are doing work here:

- **Arrow function.** `react/function-component-definition` errors on `function` declarations.
- **`cn()`, never string concatenation.** `cn()` is clsx plus tailwind-merge; concatenating defeats
  the conflict resolution that lets a caller override a utility.
- **Variants are `data-*`, not classes.** CSS owns the mapping.
- **`displayName` on a `forwardRef`.** Without it the component shows as `Anonymous` in tests and
  DevTools.

If you wrap this in `memo()`, name the component first and wrap at export —
`export default memo(() => …)` is a lint error under three separate `no-restricted-syntax` selectors.

## 5. Tests

`src/components/ui/__tests__/Badge.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import Badge from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders with default recipe data attributes", () => {
    render(<Badge data-testid="badge">Active</Badge>);

    const badge = screen.getByTestId("badge");

    expect(badge).toHaveClass("badge");
    expect(badge).toHaveAttribute("data-variant", "neutral");
    expect(badge).toHaveAttribute("data-size", "md");
  });

  it("applies variant and size overrides", () => {
    render(
      <Badge data-testid="badge" variant="danger" size="sm">
        Overdue
      </Badge>,
    );

    const badge = screen.getByTestId("badge");

    expect(badge).toHaveAttribute("data-variant", "danger");
    expect(badge).toHaveAttribute("data-size", "sm");
  });

  it("merges a caller className without dropping the recipe class", () => {
    render(
      <Badge data-testid="badge" className="mt-2">
        Active
      </Badge>,
    );

    expect(screen.getByTestId("badge")).toHaveClass("badge", "mt-2");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Badge>Active</Badge>);

    expect(await axe(container)).toHaveNoViolations();
  });
});
```

Assert on `data-*` attributes and the recipe class, not on computed colours. Jest maps CSS through
`identity-obj-proxy`, so no real styles are loaded — asserting a colour would test nothing.

`toHaveNoViolations` is registered globally in `jest.setup.ts`; you do not need to extend the
matcher yourself.

## 6. Run them

```bash
npx jest --config jest.unit.config.ts src/components/ui/__tests__/Badge.test.tsx
```

Then the full gate:

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run test:unit
```

`lint:css` is the one people forget. Stylelint covers `src/**/*.{css,pcss}`, so a malformed recipe
fails there rather than at runtime.

**The filename decides the suite.** `Badge.test.tsx` runs under unit; `*.int.test.tsx` runs only
under integration. Never put both kinds in one file — one of them will be silently skipped.

## Where to go next

- [`../reference/components/`](../reference/components/) — the full component standards, in the read
  order that README gives.
- [`../reference/design-tokens.md`](../reference/design-tokens.md) — all six token layers.
- [`../reference/accessibility-baseline.md`](../reference/accessibility-baseline.md) — the WCAG 2.1
  AA criteria this app holds itself to.
