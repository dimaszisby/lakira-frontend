# Map --space-1..7 to Tailwind spacing

**Purpose:** ticket 9 from the UI-refactor follow-ups.
**Owner:** hardini
**Branch:** `refactor/map-space-tokens-to-tailwind` off `dev`

`theme.extend.spacing` now resolves `1`–`7` through the scale tokens, so changing `--space-4` in
`scales.css` moves `p-4`, `gap-4`, `mt-4` and `w-4` with it. Before this, the tokens were used only
inside recipe CSS while every Tailwind utility carried a hard-coded rem.

## The warned-about hazard does not apply

The follow-up note flagged that `*-7` changes app-wide, 1.75rem → 2rem. Checked before changing
anything:

| | |
| --- | --- |
| `--space-1` … `--space-6` | **byte-identical** to Tailwind's defaults |
| `--space-7` | 2rem against Tailwind's 1.75rem — the only difference |
| `*-7` utilities in the codebase | **none** — the sole `-7` match in `src` is the string `"metric-7"` in a test fixture |

Confirmed again from the build: no `*-7` spacing utility is generated at all, while `.w-8` is. So
the one token that differs from the default is provably unused, and this change moves no pixel.

## It extends rather than replaces

`extend.spacing` merges with Tailwind's scale, so `8`, `12`, `0.5`, `px` and the rest keep their
defaults. Replacing `theme.spacing` outright would have deleted every value outside 1–7.

Verified in the built CSS:

```
.p-4{padding:var(--space-4)}      <- token-backed
.gap-4{gap:var(--space-4)}        <- token-backed
.p-8{padding:2rem}                <- untouched default
.py-2\.5{padding-top:.625rem;…}   <- untouched default
.-mb-px{margin-bottom:-1px}       <- untouched default
```

And resolved in the browser, which is what proves the custom properties are actually reachable at
the point of use — a `var()` naming an undefined property would silently collapse the box:

| Utility | Computed |
| --- | --- |
| `p-4` | 16px |
| `gap-6` | 24px |
| `mt-2` | 8px |
| `w-5 h-5` | 20 × 20px |
| `w-8 h-8` | 32 × 32px (untouched) |

`w-5` resolving through spacing is expected: Tailwind's `width` and `height` scales inherit from
`spacing`, and the values are identical either way.

## Verification

| Gate | Result |
| --- | --- |
| `lint` | 0 errors, 17 warnings — the `dev` baseline |
| `lint:css` | clean |
| `typecheck` | clean |
| `test:unit` | 78 suites, 648 tests |
| `test:integration` | 18 suites, 92 tests |
| `build` | passes |

The categories page was compared before and after: identical.

## Note on JIT

A dynamically-created probe element using `w-7` rendered unstyled, which looked alarming for a
moment. It is a Tailwind JIT artifact: classes absent from the source are never generated, so a
class invented at runtime has no rule. It is also independent confirmation that nothing uses `*-7`.
