# Component Architecture and API Guidelines

This document standardizes how reusable UI components are structured and exposed in Lakira.

---

## 1. Component Categories

Use categories to prevent over-engineering:

1. Primitive UI components
   - Example: `Button`, `TextField`, `Card`, `Modal`.
   - Stable API, reusable across features.
2. Composite UI components
   - Combine primitives for repeated patterns.
   - Example: `SearchInput`, `FormField`, `CategorySelect`.
3. Feature components
   - Feature-scoped UI with business coupling.
   - Should not leak feature-specific assumptions into primitives.

Rule:

- Promote to primitive only after repeated, stable usage.

---

## 2. API Design Contract

### 2.1 Props Shape

Rules:

- Extend native element props when appropriate (`ButtonHTMLAttributes`, `InputHTMLAttributes`).
- Keep prop names behavior-first and semantic (`loading`, `variant`, `size`, `invalid`).
- Avoid prop names that encode visual tokens directly (`greenBg`, `roundedBig`).
- Keep required props minimal.

Recommended ordering:

1. Controlled state props (`value`, `open`, `checked`)
2. Change events (`onChange`, `onOpenChange`)
3. Content slots (`children`, `leftIcon`, `rightAddon`)
4. Visual variant props (`size`, `variant`, `tone`)
5. Native passthrough props (`...rest`)

### 2.2 Controlled vs Uncontrolled

Rules:

- Provide one clear contract per component.
- If both are supported, controlled props win.
- Use `default*` props only for uncontrolled mode.
- Never switch between controlled and uncontrolled behavior silently.

Pattern:

- Controlled: `value` + `onChange`
- Optional uncontrolled: `defaultValue` + internal state

### 2.3 Event Semantics

Rules:

- Preserve native event signatures when possible.
- Do not invent custom payloads unless native event data is insufficient.
- For custom select-like components, return both raw value and selected option only when needed.

Example:

- Good: `onChange(event)` for inputs.
- Good: `onChange(nextValue, option)` for custom `Select`.
- Avoid: `onValuePicked(meta)` without clear value semantics.

---

## 3. Next.js Server/Client Boundaries

Rules:

- Default to Server Components.
- Add `"use client"` only where state/effects/browser APIs are required.
- Keep client boundaries as low as possible in the tree to reduce JS bundle cost.
- Props crossing server -> client boundaries must be serializable.

Practical standard:

- Feature pages/layouts stay server by default.
- Reusable interactive primitives are client components.
- Data fetching remains server-side unless client interactivity requires otherwise.

---

## 4. `ref` Strategy

**`ref` is an ordinary prop.** React 19 passes it through like any other prop, so primitives do not
use `forwardRef` or set `displayName`. Decided in
[ADR-0016](../../explanation/decisions/adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md).

```tsx
export type ToggleProps = ComponentProps<"button"> & { checked: boolean };

export const Toggle = ({ ref, checked, className, ...props }: ToggleProps) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={checked}
    className={cn("switch", className)}
    {...props}
  />
);
```

Rules:

- Type props with `ComponentProps<"element">`, which already includes `ref`.
- When a component also needs its own ref to the same node, merge them with `composeRefs` from
  `src/lib/compose-refs.ts`. Never overwrite the caller's ref.
- Because `ref` is a prop, a React Hook Form registration spreads straight onto a field:
  `<TextField {...register("name")} />`. Primitives never import form-library types.

---

## 5. Composition Patterns

### 5.1 Preferred Composition

- Prefer explicit slots (`leftIcon`, `rightAddon`, `footer`) over deep prop drilling.
- Use composition for structure, variants for style differences.
- Keep branch count inside render small and obvious.

### 5.2 `asChild` / Polymorphism

Use only when necessary.

Valid use case:

- Reusing button styles on links where semantic element must change.

Rules:

- Polymorphism must preserve accessibility semantics.
- Avoid polymorphism when a simple wrapper component is clearer.

---

## 6. State and Effects

Rules:

- Derive values during render when possible; avoid redundant state.
- `useEffect` is for external synchronization, not local derivations.
- Keep local state minimal and colocated.
- Memoize only for measured bottlenecks or stable referential contracts.

Anti-patterns:

- Duplicating derived props into state.
- Effects used to compute pure values.
- Premature blanket use of `useMemo`/`useCallback`.

---

## 7. File and Export Conventions

Recommended file shape for primitives:

1. `"use client"`, only if the file uses hooks, event handlers or browser APIs
2. Types
3. Internal constants
4. Component implementation, exported by name
5. Named subcomponents, if any

Rules:

- **Named exports only in `src/components/ui`.** No default exports, no `*Base` + `memo` pairs, no
  barrel file. Import each primitive from its own file: `import { Button } from "@/ui/Button"`.
  Feature folders keep their existing default-export convention.
- Wrap in `memo` only where a profile shows a benefit.
- One primary component per file.
- Co-locate tests with component in `__tests__`.
- Keep helpers in nearby `*.helpers.ts` only when logic is substantial.

Suggested folder example:

```text
src/components/ui/Button.tsx
src/components/ui/__tests__/Button.test.tsx
```

---

## 8. Deprecation and Migration

Rules:

- Mark legacy components with `@deprecated` in type docs.
- Add migration notes in PR description and changelog/docs.
- Prefer adapter wrappers for transition periods.

Current status in this repo:

- Duplicate button primitives have been consolidated to a single `Button` contract.

---

## 9. Definition of Done (Architecture/API)

A component is architecture-complete when:

1. API contract is minimal, typed, and predictable.
2. Controlled/uncontrolled behavior is explicit.
3. Server/client boundary choice is intentional.
4. Ref strategy is consistent with current team standard.
5. No feature-specific coupling leaks into primitive API.
