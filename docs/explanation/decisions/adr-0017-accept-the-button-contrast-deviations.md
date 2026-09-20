# ADR-0017 — Accept the Button contrast deviations

- **Status:** Accepted
- **Date:** 2026-09-20
- **Origin:** `D-03` in the theme-switching kit — [`decisions.md`](../../internal/initiatives/theme-switching/decisions.md)

---

## Context

Button colour tokens fail two WCAG 2.1 AA criteria. This was known in outline — a single bullet
under "Known token-system defects" in [`.claude/rules/styling.md`](../../../.claude/rules/styling.md)
recorded three light-mode ratios — but the note was wrong about the scope, and the cheap fix it
implied does not work. Adding a theme switcher (see the kit) makes light mode a destination a user
picks deliberately rather than one their OS picks for them, so the deviation needed a decision
rather than another year of silence.

Every pairing was recomputed from `src/styles/tokens/palette.css`,
`src/styles/tokens/semantic.css` and `src/styles/tokens/components/button.tokens.css`.

### WCAG 1.4.3 Contrast (Minimum) — label against button fill, requires 4.5:1

| Theme | Variant     | State        | Foreground      | Background             | Ratio         |
| ----- | ----------- | ------------ | --------------- | ---------------------- | ------------- |
| light | primary     | rest / hover | `--gray-white`  | matchagreen 500 / 700  | 1.95 / 3.12   |
| light | primary     | disabled     | `--gray-800`    | `--gray-400`           | 3.64          |
| light | secondary   | rest / hover | matchagreen 500 | white / softwhite 700  | 1.95 / 1.61   |
| light | destructive | rest         | `--gray-white`  | vividcoral 500         | 3.16          |
| light | tertiary    | rest / hover | `--gray-white`  | softlavender 500 / 700 | 2.64 / 4.39   |
| dark  | primary     | rest / hover | `--gray-900`    | matchagreen 500 / 700  | 7.15 ✓ / 4.47 |
| dark  | secondary   | rest         | matchagreen 500 | `--gray-900`           | 7.15 ✓        |
| dark  | destructive | rest         | `--gray-white`  | vividcoral 500         | 3.16          |
| dark  | tertiary    | rest / hover | `--gray-900`    | softlavender 500 / 700 | 5.29 ✓ / 3.18 |

The worst case is the **secondary button's hover state in light mode at 1.61:1** — its label is
close to invisible against its own hover fill.

### WCAG 1.4.11 Non-text Contrast — button boundary against the surface, requires 3:1

Not previously recorded anywhere. It matters most for the secondary/outline variant, whose border is
its only affordance: `--button-secondary-bg` is `--gray-white`, so without the border there is no
button.

| Surface behind the button     | primary | destructive | tertiary | secondary border |
| ----------------------------- | ------- | ----------- | -------- | ---------------- |
| light `--bg` (#ebebeb)        | 1.64    | 2.65        | 2.21     | 1.64             |
| light `--surface` (#f8f9fa)   | 1.85    | 3.00        | 2.50     | 1.85             |
| light `--surface-2` (#f2f2f2) | 1.74    | 2.82        | 2.36     | 1.74             |
| dark `--bg` (#2c2c2c)         | 7.15 ✓  | 4.42 ✓      | 5.29 ✓   | 7.15 ✓           |
| dark `--surface` (#4a4a4a)    | 4.54 ✓  | 2.80        | 3.36 ✓   | 4.54 ✓           |

Every button boundary fails in light mode, against every surface token. Dark mode passes except
destructive on `--surface`.

Three things the previous record got wrong:

1. **It is not light-mode-only.** `--button-destructive-fg` is never overridden under
   `:root[data-theme="dark"]`, so destructive fails 1.4.3 in dark too, as do two dark hover states.
2. **The ratios were slightly off** (1.96 / 3.13 / 2.68 against 1.95 / 3.16 / 2.64), and the hover
   and disabled states were absent entirely.
3. **1.4.11 was missing.** Half the problem was not written down.

## Decision

**Accept both deviations. Change no Button colour token.**

[`.claude/rules/styling.md`](../../../.claude/rules/styling.md) treats palette values, brand mapping
and Button colour tokens as fixed input: a consistency pass unifies how primitives use the identity,
it never changes the identity. Any fix that reaches AA here is a palette change, which is an owner's
decision about the brand and not a refactor. Recording the deviation is what this ADR does instead.

This is a deviation from [`.claude/rules/accessibility.md`](../../../.claude/rules/accessibility.md)
§ Content, which requires contrast to meet AA against the semantic tokens **in both themes**.

### What would reverse it

New darker steps on the `matchagreen`, `vividcoral` and `softlavender` ramps, or a per-state
foreground inversion — either one being an owner decision on the brand. Until then the deviation
stands and this record is where it is written down.

## Options considered

- **Repoint each token to a different step of the ramp it already uses.** The approach PR #17's
  contrast pass took for focus rings, error text and control borders, and the assumed cheap fix
  going into this work. **Rejected because it does not reach AA.** Each hue has only three steps —
  100, 500, 700 — and the 700 step under white text gives matchagreen 3.12:1 and softlavender
  4.39:1. Both still short of 4.5:1. Measuring it is what ruled it out.
- **Darken the foreground instead, which is what dark mode already does.** Fixes the rest states —
  primary goes 1.95 → 7.15 with `--gray-900` — but breaks hover, because hover is the _darker_ ramp
  step: primary hover with `--gray-900` is 2.84:1. Rest and hover want opposite foregrounds, so no
  single foreground token works for both.
- **Darken the fills enough to keep white text.** White text needs a background at relative
  luminance ≤ 0.183. The brand hues sit at 0.28–0.49, so every one would have to go near-black.
  That is a redesign, not a contrast pass.
- **Change nothing and record nothing.** The status quo. Rejected: this deviation had already been
  rediscovered once and mis-scoped when it was, which is the cost of leaving it implicit.

## Consequences

- The app ships a known AA failure on its most common interactive element, in light mode for every
  variant and in dark mode for destructive.
- It is now documented with the criterion, the measurements, the rejected options and the reversal
  condition, so the next person to find it starts from data rather than re-deriving it.
- `npm run test:integration` asserts `toHaveNoViolations` across 19 suites and does **not** catch
  this: `jest-axe` runs in jsdom, which has no layout and no computed colour, so colour-contrast
  checks do not run. Nothing in CI will fail because of this, which is precisely why it needs a
  written record.
- Any future contrast pass over Button tokens must supersede this record rather than edit it.

## References

- [ADR-0016](./adr-0016-ui-primitives-conventions-ariakit-and-centralised-styling.md) — the overhaul
  that centralised these tokens
- [`docs/reference/style/color-palette.md`](../../reference/style/color-palette.md)
- [`docs/reference/accessibility-baseline.md`](../../reference/accessibility-baseline.md) §6.1
- [WCAG 2.1 SC 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) ·
  [SC 1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
