---
paths:
  - src/styles/**
  - tailwind.config.mjs
  - "**/*.css"
  - "**/*.pcss"
  - src/components/**
  - src/features/**/components/**
---

# Styling and Design Tokens

Canonical references: [`docs/reference/style/color-palette.md`](../../docs/reference/style/color-palette.md), [`docs/reference/style/typography.md`](../../docs/reference/style/typography.md), [`docs/reference/components/component-styling-tailwind-and-tokens.md`](../../docs/reference/components/component-styling-tailwind-and-tokens.md). Decision record: [ADR-0016](../../docs/explanation/decisions/adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md).

Tailwind 3 (not v4) with a six-layer CSS-variable token system.

## The layers

Import order in `src/styles/globals.css` is load-bearing. A token file imported out of order gets overridden by the layer that should have been beneath it.

```
palette → semantic → scales → typography → component tokens → component recipes
→ @tailwind base/components/utilities
```

1. **`tokens/palette.css`**: raw brand colours, with no UI meaning.
   - Stored as **bare HSL bodies** (`348 69% 86%`, no `hsl()` wrapper), so Tailwind can apply `<alpha-value>`.
   - The **only** file allowed to hold colour values.
2. **`tokens/semantic.css`**: UI meaning, theme-switched.
   - Surfaces: `--bg`, `--surface`, `--surface-2`.
   - Text: `--text`, `--text-emphasis` (equal to `--text`), `--text-secondary`, `--text-tertiary`, `--text-inverted`, `--text-error`, `--text-info`, `--text-placeholder`.
   - Borders and focus: `--border`, `--border-control`, `--ring`.
   - Interaction: `--input-bg`, `--overlay`, `--interactive-hover`, `--interactive-selected-bg`, `--interactive-selected-fg`, `--on-brand-fg`.
   - Status triads: `--status-error`, `-bg`, `-emphasis`, and the same for success, warning and info.
   - Defined for `:root, :root[data-theme="light"]` and overridden under `:root[data-theme="dark"]`. Status colours deliberately inherit.
3. **`tokens/scales.css`**:
   - space: `--space-1..7`;
   - radius: `--radius-xs..lg`, `--radius-full`;
   - elevation: `--shadow-xs..md`, `--elevation-control|popover|dialog`;
   - layering: `--z-*`;
   - the control scale: `--control-h|px|gap|radius-sm|md|lg`;
   - interaction: `--focus-ring-width`, `--focus-ring-offset`, `--disabled-opacity`, `--overlay-opacity`, `--selected-tint-alpha`, `--selected-border-alpha`;
   - motion: `--duration-fast|normal`, `--ease-standard`;
   - icons and targets: `--icon-xs..lg`, `--target-min`, `--target-icon-button`;
   - Button aliases of the control scale.
4. **`tokens/typography.css`**: font smoothing, base element defaults, and the semantic text classes (`.text-body1`, `.text-caption`, `.text-button`, `.text-link`, …).
5. **`tokens/components/<x>.tokens.css`**: a component's mapping onto semantic and scale tokens, in `@layer base`.
6. **`tokens/components/<x>.recipe.css`**: the `.x` class and its `[data-variant]` / `[data-size]` / `[data-state]` selectors, in `@layer components`.

## Styling contract

| Decision | Lives only in | Never in a component as |
| --- | --- | --- |
| Raw colour values | `palette.css` | hex, `rgb()`, `bg-white`, `ring-black/5` |
| Colour meaning | `semantic.css` | a palette variable or palette name |
| Size, radius, elevation, z-index, focus, disabled, motion, icon size | `scales.css`, `<x>.tokens.css` | an arbitrary value such as `z-[60]` or `w-[22rem]` |
| Variant, size and state styling, including tint strength | `<x>.recipe.css` | a class map, or a tint such as `bg-brand-primary/15` |
| Runtime values (user-picked colour, slider position) | TSX `style` as a **custom property** only, read by a recipe | `style={{ backgroundColor }}` |
| Layout (flex, grid, gap, position, truncate, sr-only) | TSX utilities | n/a |

A one-off semantic utility such as `text-ink-secondary` on a caption is still fine in TSX: it resolves to a central token.

## Hard rules

These are mechanically enforced:

- **Only token colours exist.** `tailwind.config.mjs` defines `theme.colors` in place of Tailwind's palette, so `bg-white` or `text-gray-400` generates no CSS at all.
- **No raw colours in CSS outside `palette.css`.** Stylelint enforces `color-no-hex`, `color-named: "never"` and `function-disallowed-list: ["rgb", "rgba"]`; `scales.css` may use `rgb()` for shadow colours.
- **In `src/components/ui/**`,** ESLint rejects:
  - arbitrary values (`tailwindcss/no-arbitrary-value`, which also checks strings passed to `cn()`);
  - colour utilities with an opacity modifier;
  - inline `style` keys that are not CSS custom properties.
  An exception needs a disable comment with a reason, like SwipeableCard's framer-motion `x`.

These are enforced by review:

- **Never reference a palette variable from a component.** Components consume layer 2 or layer 5. If no semantic token expresses what you need, add one to `semantic.css`, defined for both themes.
- **Never write an arbitrary font size.** Use the named scale: `text-h3`, `text-body1`, `text-caption`. In recipe CSS, read it with `theme("fontSize.caption")` rather than repeating the value.
- **New values must match the current look.** Add a token that reproduces an existing value instead of silently restyling. The brand identity is fixed input: palette values, brand mapping, Button colour tokens, fonts and type scale.
- **Theme switching** is `data-theme` on `<html>` (`darkMode: ["class", '[data-theme="dark"]']`, driven by `next-themes` and `src/app/ThemeScript.tsx`). A bare `.dark` class does nothing.
- **Merge classes with `cn()`** from `src/lib/cn.ts`. Never concatenate class strings. `cn` knows the named type scale, so `cn("text-caption", "text-ink-secondary")` keeps both classes.

## Adding a component's styles

Follow the two-file pattern:

```
src/styles/tokens/components/badge.tokens.css   → @layer base, component → semantic/scale tokens
src/styles/tokens/components/badge.recipe.css   → @layer components, .badge + [data-variant]
```

1. **Register both** in `globals.css`, after the existing component files and before `@tailwind`.
2. **Drive variants and state with attributes:** `data-variant`, `data-size`, `data-state`, or Ariakit's `data-active-item` / `data-focus-visible` / `aria-*`. Not conditional class strings.
3. **Use the fallback-chain pattern** from `button.recipe.css`:

```css
.badge { background: hsl(var(--badge-bg, var(--surface)) / 100%); }
.badge[data-variant="danger"] { --badge-bg: var(--badge-danger-bg); }
```

4. **Reuse the shared recipes before writing a new one:**
   - `.input-shell` (fields and picker triggers);
   - `.popover` / `.listbox` / `.listbox-item`;
   - `.spinner` and `.skeleton`;
   - `.color-swatch`.
5. **Order state rules by ascending specificity,** or Stylelint's `no-descending-specificity` fails: base, then `:focus-visible` / `:disabled`, then `:hover:not(...)`.

## Known token-system defects

- **The spacing scale is not wired to Tailwind.** `--space-1..7` exist in `scales.css`, but `tailwind.config.mjs` has no `spacing` key, so `p-4` is Tailwind's default `1rem`, not `var(--space-4)`. The values match for 1–6; mapping `7` would change every `*-7` utility app-wide (1.75rem becomes 2rem).
- **Button colour tokens fail WCAG AA in light mode:** primary and secondary 1.96:1, destructive 3.13:1, tertiary 2.68:1. Changing them is a brand decision, not a refactor.
- `palette.css` carries two "Current vs Figma" drift comments (`matchagreen-100`, `goldenyellow-100`). The CSS is authoritative until someone reconciles them.
- `src/styles/output.css` is generated by `build:css` and is not part of the normal build. Do not import it.

## Fonts

`display` = Quicksand, `ui` = Plus Jakarta Sans, both loaded via `next/font/google` in `src/app/layout.tsx` with `display: "swap"`. Do not add a font without a performance justification; see `.claude/rules/performance.md`.

## CSS lint

`npm run lint:css` runs Stylelint over `src/**/*.{css,pcss}` as a separate CI gate. `format-on-edit.sh` runs `stylelint --fix` after every CSS edit.
