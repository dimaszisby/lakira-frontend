# ADR-0040 — A category chip is an opaque tint on a fixed base

- **Status:** Accepted
- **Date:** 2026-10-23
- **Related:** the styling contract's rule that a user's colour reaches CSS as a custom property
  (`.claude/rules/styling.md`); WCAG 1.4.3
- **Origin:** kit `category-chip-contrast`, D-01 — [`decisions.md`](../../internal/initiatives/category-chip-contrast/decisions.md); debt register row F-56

---

## Context

A category's colour is user data, so no token can hold it and no single pairing can be checked
once. `CategoryChip` painted it as a translucent `rgba(colour, 0.2)` over whatever the chip sat on,
and picked its text with `pickTextColor`, which composites over white whatever the theme.

In the dark theme the metrics table's body is `--surface-2` (gray-700, `#5c5c5c`). The default
colour `#D9D9D9` composites to `#757575` there, under the dark ink `#f2f2f2`: 4.11:1, under WCAG
1.4.3's 4.5:1 (register row F-56, measured by `cypress-axe` on 2026-10-17). It is not one colour's
problem. Over a 5,832-colour grid, a 20 % tint on gray-700 is at worst 3.70:1 against the dark
ink, and no text colour fixes a translucent chip there.

## Decision

The owner chose on 2026-10-23 (O-12) an opaque tint on a fixed base per theme, with the theme's
ink as the text:

- `semantic.css` defines `--tint-base`: `--gray-white` in light, `--gray-900` in dark.
- `.category-color-bg` is `color-mix(in srgb, var(--category-color) 20%, hsl(var(--tint-base)))`.
  The chip receives the user's colour as picked, and the recipe does the tinting.
- The chip's text is `text-ink` always; the JS picker no longer runs for it. A colour that is not
  a hex value gets the fallback's token styling, as the white "Uncategorized" chip does.

Worst case over the grid, against the theme's `--text`: **8.70:1 in light, 6.54:1 in dark.**
`src/styles/__tests__/category-chip-contrast.test.ts` computes this from the token files on every
unit run, so a change to `--tint-base` or `--text` that breaks it fails the gate.

## Options considered

- **Keep the translucent tint and pick the text against the real surface.** Rejected: on gray-700
  neither ink reaches 4.5:1 for light colours, and the chip cannot know its surface.
- **Base gray-800, the dark card surface.** Dark chips would change less, but the worst case is
  4.54:1, with no margin for a later token change.
- **The full colour, with black or white text per colour.** At least about 4.5:1 in both themes,
  but a much larger visual change, and the palette has no black text token.

## Consequences

- In dark, chips are darker than before, a gray-900 well on a gray-800 card or a gray-700 row.
- In light they are slightly lighter: the base is white where they used to show gray-50 or
  gray-100 through, at most 11 of 255 per channel.
- `color-mix()` enters the recipes. Browsers without it, from before 2023, drop the declaration,
  so the chip shows no tint and its ink on the surface beneath.
- A new chip-like surface for user colour should reuse `--tint-base` and the same mix, not a
  translucent overlay.
