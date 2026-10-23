# Category chip contrast — Decisions

## D-01 — A category chip is an opaque tint on a fixed base per theme

> **Promoted to [ADR-0040](../../../explanation/decisions/adr-0040-a-category-chip-is-an-opaque-tint-on-a-fixed-base.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-23

**Context.** Register row F-56, from `2026-10-17-todo-axe-pages-with-data.md`. The chip painted a
translucent 20 % tint over whatever it sat on and picked its text as if over white. In the dark
metrics table (`--surface-2`, gray-700) the default `#D9D9D9` measured 4.11:1 under the dark ink.
Worst case over a 5,832-colour grid, a 20 % tint against the theme's ink, by base:

| Base                    | Light  | Dark   |
| ----------------------- | ------ | ------ |
| white                   | 8.70:1 |        |
| gray-50                 | 8.27:1 |        |
| gray-900                |        | 6.54:1 |
| gray-800                |        | 4.54:1 |
| gray-700, today's table |        | 3.70:1 |

**Decision.** The owner answered O-12 on 2026-10-23: an opaque tint on a fixed base, white in
light and gray-900 in dark, as a new semantic token `--tint-base`; the recipe mixes 20 % of the
colour into it with `color-mix`; the text is `text-ink` always. A colour that is not a hex value
gets the fallback styling.

**Options considered.** The translucent tint with a smarter text pick: no text passes on gray-700.
Base gray-800: 4.54:1, no margin. The full colour with black or white text: a larger change, and no
black text token.

**Consequences.** Dark chips are darker. Light chips are at most 11 of 255 per channel lighter:
0.8 x 7 over gray-50 and 0.8 x 13 over gray-100. The guarantee is computed from the tokens by
`category-chip-contrast.test.ts`; with the dark base at gray-700 it fails at 3.70:1, checked
2026-10-23.
