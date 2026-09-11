# ADR-0016 — UI Primitives: Component Conventions, Ariakit, and Centralised Styling

- **Status:** Accepted
- **Date:** 2026-09-11
- **Origin:** [`docs/internal/todos/2026-09-11-todo-ui-components-refactor.md`](../../internal/todos/2026-09-11-todo-ui-components-refactor.md)
- **Supersedes:** [ADR-0009](./adr-0009-select-listbox-trigger-semantics.md), [ADR-0010](./adr-0010-modal-focus-management-and-close-behaviour.md), [ADR-0014](./adr-0014-modal-shared-scroll-lock-coordination.md). It also replaces the "keep `forwardRef` until a migration RFC" guidance in [`component-architecture-and-api.md`](../../reference/components/component-architecture-and-api.md).

---

## Context

`src/components/ui` held 28 primitives written to different conventions:

- **Exports and refs:** default exports, named exports and `*Base` + `memo` pairs; `forwardRef` in some files and hand-rolled ref merging in others.
- **Hand-rolled interaction:** Modal, Select, DateTimePicker, ColorField and SegmentedControl each implemented their own focus trap, scroll lock, outside-click and Escape handling.
- **Styling inside components:**
  - 4 default-palette colours;
  - 17 ad-hoc opacity tints;
  - 21 arbitrary values;
  - variant class maps in TSX;
  - three class names with no token behind them;
  - an undefined `--text-emphasis`.
    Nothing mechanical prevented any of it.
- **Inconsistent control geometry:** heights, radii, focus rings, disabled opacity and hover states varied from one primitive to the next.
- **Accessibility gaps:**
  - 40 of 68 semantic token pairs failed WCAG AA;
  - SwipeableCard had no alternative to swiping;
  - the sort arrows were text glyphs;
  - an ARIA role was invalid on a `div`.
- **Layer inversions:** two feature components (`CategorySelect`, `Visualization`) lived in `ui/` and imported feature hooks.

## Decision

### 1. Component shape

- **Refs:** React 19 `ref` as a prop, typed through `ComponentProps<"el">`. No `forwardRef`, no `displayName`.
- **Exports:** named exports only in `ui/`, with no default exports, no `*Base` exports and no barrel file. Feature folders keep their existing default-export convention.
- **`memo`** only where a profile shows a benefit.
- **Prop names mirror native attributes:** `aria-label`, `invalid` (which also sets `aria-invalid`), `open`, `children`.
- **No form-library types in primitives:** fields accept a spread `{...register("x")}`, which works because `ref` is a prop.
- **`"use client"`** only in files that use hooks, event handlers or browser APIs.

### 2. Accessible primitives come from Ariakit

| Primitive                        | Ariakit building block                                         |
| -------------------------------- | -------------------------------------------------------------- |
| Modal                            | `Dialog` rendered through `Card`                               |
| Select                           | `Select`, `SelectPopover`, `SelectItem`                        |
| DateTimePicker                   | `Popover` plus a `role="grid"` `Composite` with `CompositeRow` |
| ColorField                       | `Popover`                                                      |
| SegmentedControl, ListModeToggle | `RadioGroup` with **native** radios inside labels              |

- **Why native radios:** Ariakit only selects a radio on arrow-key focus when it is a real `<input type="radio">`.
- **Slider** stays hand-rolled, following the WAI-ARIA slider pattern.
- **SwipeableCard** gains a visible "More actions" button, so no action depends on swiping.

### 3. Styling contract

| Decision                                                                                  | Lives only in                                                                                 |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Raw colour values                                                                         | `src/styles/tokens/palette.css`                                                               |
| Colour meaning, light and dark                                                            | `tokens/semantic.css`                                                                         |
| Control size, radius, elevation, z-index, focus, disabled, motion, icon size, target size | `tokens/scales.css`                                                                           |
| Per-component token mapping                                                               | `tokens/components/<x>.tokens.css`                                                            |
| Variant, size and state styling, including tint strength                                  | `tokens/components/<x>.recipe.css`, keyed by `data-*` attributes and Ariakit state attributes |
| Runtime values (user-picked colour, slider position)                                      | TSX `style` as a CSS custom property only, read by a recipe                                   |

- **What TSX may still contain:** layout utilities, plus one-off semantic colour utilities such as `text-ink-secondary`.
- **Font sizes in recipes** come from `theme("fontSize.<name>")`, so the named type scale in `tailwind.config.mjs` stays the single source.

### 4. Enforcement

- **Tailwind:** `tailwind.config.mjs` defines `theme.colors` in place of the default palette, so `bg-white` or `text-gray-400` generates no CSS.
- **ESLint,** scoped to `src/components/ui/**`:
  - `tailwindcss/no-arbitrary-value` (with `cn` registered as a class callee);
  - a ban on opacity tints in class strings;
  - a ban on non-custom-property `style` keys.
- **Stylelint:** `color-no-hex`, `color-named: "never"` and `function-disallowed-list: ["rgb", "rgba"]` everywhere except `palette.css` (and `rgb()` in `scales.css` for shadows).
- Each rule was proven to fire on a planted violation before it was accepted.

### 5. Contrast fixes

The owner approved these. Each uses an existing palette step.

| Fix                                                                 | Light                                | Dark                  |
| ------------------------------------------------------------------- | ------------------------------------ | --------------------- |
| Focus ring                                                          | `origamiblue-700`                    | `origamiblue-100`     |
| Error text                                                          | `vividcoral-700`                     | `vividcoral-100`      |
| Info text                                                           | `info-700`                           | `info-500`            |
| Selected-state text on the brand tint (`--interactive-selected-fg`) | `--text` (`gray-900`)                | `--text` (`gray-100`) |
| Text on a solid brand fill (`--on-brand-fg`)                        | `gray-900`                           | `gray-900`            |
| Tertiary text and placeholders                                      | secondary grey where tertiary failed | same                  |
| Control borders (`--border-control`)                                | `gray-500`                           | `gray-400`            |

Success and warning text render as neutral text with a coloured status icon, because no step in those ramps passes.

### 6. Identity guardrails

These stay unchanged:

- palette values;
- the brand mapping (`--core-primary`, `--core-secondary`, `--core-accent`);
- Button colour tokens;
- fonts;
- the named type scale;
- `typography.css`.

`--text-emphasis` is defined as equal to `--text`, which is how h5/h6 already rendered.

### 7. Layer boundaries

`CategorySelect` moved to `src/features/metric-categories/components/` and `Visualization` to `src/features/data-visualizations/components/`. The ESLint quarantine shrinks from six files to four.

## Options considered

1. **Keep `forwardRef` and default exports**, and fix only styling defects. Rejected: this left three competing conventions in place.
2. **Class-variance maps (`cva`) in TSX.** Rejected: the repo's token and recipe layers already exist, and the goal was to take styling decisions out of components.
3. **shadcn/ui on Radix.** Rejected: Ariakit is already the primitive layer, and mixing two headless libraries adds weight and conflicting patterns.
4. **Document the styling rules without enforcing them.** Rejected: unenforced rules are how the drift accumulated (see `.claude/lessons.md`).

## Consequences

- **Visible changes are intentional and bounded.** The list lives in the PR description.
  - Controls share one height, radius, focus-ring and disabled treatment.
  - Selected states use one tint.
  - The new focus ring, border and error colours are easier to see.
- **Tests assert behaviour and ARIA, not class names.** `jest.setup.ts` adds two jsdom shims:
  - `Element.checkVisibility`, which Ariakit uses to find tabbable elements;
  - `HTMLElement.inert`, which avoids Ariakit's focus-patching polyfill colliding with user-event.
- **`Modal` portals with React, not Ariakit.** Ariakit's portal renders the dialog in place for one commit and then moves it into a new node, which remounts the content. Under StrictMode that silently broke react-hook-form watched values in `MetricSettingsForm`. `Modal` renders through `createPortal` into a long-lived `#dialog-root` with Ariakit `portal={false}`. Integration tests for forms inside a modal should render under `<StrictMode>`, because `next dev` does and jsdom otherwise hides remount bugs.
- **Tab wrapping inside a modal** cannot be simulated in jsdom. The test asserts that the rest of the page becomes `inert`, the mechanism browsers enforce.
- **Known gaps, left as follow-ups:**
  - Button colour tokens still fail AA in light mode (primary and secondary 1.96:1, destructive 3.13:1, tertiary 2.68:1); changing them is an identity decision.
  - Arbitrary values and opacity tints outside `ui/` are not yet linted.
  - `--space-1..7` are not mapped to Tailwind spacing, although the styling rule claimed they were.
