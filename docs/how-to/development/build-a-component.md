# Component Implementation Playbook

This playbook is the execution flow for building or refactoring UI components in Lakira.

---

## 1. Build Flow (Checklist)

1. Define component category
   - Primitive, composite, or feature component.
2. Define API contract
   - Required props, optional props, controlled/uncontrolled behavior.
3. Define accessibility behavior
   - Semantic element, keyboard paths, focus behavior, ARIA state.
4. Choose styling strategy
   - Primitives in `ui/`: a token + recipe pair. Feature components: semantic utilities.
5. Implement states
   - Default, hover, active, focus-visible, disabled, loading/error.
6. Add tests
   - Behavior and accessibility semantics first.
7. Run quality gates
   - Lint, CSS lint, unit tests.
8. Score with review scorecard
   - Resolve any critical failures before merge.

---

## 2. Standard Component Brief Template

Before coding, fill this brief in PR description or issue:

```md
## Component Brief

- Name:
- Category: Primitive | Composite | Feature
- Primary use cases:
- Required interactions:
- Accessibility requirements:
- Controlled props:
- Uncontrolled fallback:
- Variant and size model:
- Styling strategy:
- Test plan:
```

---

## 3. Implementation Skeleton (TypeScript)

```tsx
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary";

export type ExampleButtonProps = ComponentProps<"button"> & {
  size?: Size;
  variant?: Variant;
  loading?: boolean;
};

export const ExampleButton = ({
  ref,
  children,
  size = "md",
  variant = "primary",
  loading = false,
  className,
  disabled,
  ...rest
}: ExampleButtonProps) => (
  <button
    ref={ref}
    type="button"
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    data-size={size}
    data-variant={variant}
    className={cn("example-button", className)}
    {...rest}
  >
    {children}
  </button>
);
```

Notes:

- `ref` is a prop (React 19), exports are named, and there is no `"use client"` because the file
  has no hooks or handlers. See [ADR-0016](../../explanation/decisions/adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md).
- Every variant, size and state style lives in `example-button.recipe.css`, keyed by the `data-*`
  attributes. Nothing visual is decided in TSX.
- An interactive widget beyond a button (dialog, listbox, popover, radio group) is built on Ariakit,
  not by hand.

---

## 4. Refactor Priorities for Current Codebase

Suggested order:

1. Button family standardization
   - Keep `Button` as the only shared button primitive contract.
2. Input family consistency
   - Align `TextField`, `TextArea`, `Select` with shared field semantics.
3. Modal and overlay hardening
   - Focus trap/restore, escape handling, inert background.
4. Token migration cleanup
   - Remove hard-coded utility colors from shared primitives.

---

## 5. PR Requirements for Component Work

Every PR touching shared UI components should include:

1. Component brief.
2. Before/after behavior summary.
3. Accessibility notes (keyboard + naming).
4. Test evidence (new/updated test cases).
5. Any migration notes for downstream usage.
