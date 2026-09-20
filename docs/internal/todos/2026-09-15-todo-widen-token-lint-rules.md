# Widen the token lint rules

**Purpose:** ticket 8 from the UI-refactor follow-ups.
**Owner:** hardini
**Branch:** `refactor/widen-token-lint-rules` off `dev`

## Scope, as decided

The `ui/`-only block held three rules. They were not all widened, because they do not all protect the
same thing:

| Rule                              | New scope                         | Why                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| opacity tints                     | `ui`, `layout`, `features`, `app` | An ad-hoc tint produces a colour that exists in no token: nothing can check its contrast, and dark mode cannot override it independently.                                                                                                                                                                                                     |
| non-custom-property inline styles | `ui`, `layout`, `features`, `app` | Puts styling in the markup where no recipe can reach it.                                                                                                                                                                                                                                                                                      |
| `tailwindcss/no-arbitrary-value`  | **unchanged — `ui/` only**        | The five uses outside `ui/` are `min-h-[50vh]`, `max-h-[80vh]`, `grid-rows-[auto_1fr_auto]` and two scrollbar-hiding properties: viewport units, grid templates and raw CSS the token system does not model. They are not bypasses — there is no token they could have used. A primitive is different; it should never need the escape hatch. |

`src/components/layout` was added beyond the ticket's stated scope: it had `bg-ink/40` and
`bg-bg/95` doing exactly what the rule forbids, and a rule meant to prevent drift with a known hole
in it is not much of a rule.

## The 11 violations, all fixed

**Six tints → recipes.** Four in `MetricDetailTabs` (`metric-tabs.tokens.css` / `.recipe.css`), two
in the app shell (`app-chrome.*` — the mobile bottom bar and the sidebar scrim). The tints are
preserved exactly; they moved from class strings into named tokens, which is what the rule asks for.
Appearance is unchanged by design.

**Five inline styles → custom properties.** Three category swatches take `--category-color` via
`categoryColorStyle()` and `.category-color-bg`; two chart containers take `--chart-height` via
`chartHeightStyle()` and `.chart-box`. Same shape as `ColorField`'s existing `--swatch`.

`chartHeightStyle` writes the unit explicitly. React appends `px` to a bare number given to
`style={{ height }}`, but a custom property is an opaque string to React and would reach CSS as
`260`, which is invalid for `height`.

## Proof the widening works

Planted a file containing `bg-ink/25` and `style={{ backgroundColor: "red" }}` in each of
`src/app`, `src/features` and `src/components/layout`. Both rules fired in all three. Files removed.

## Two tests were asserting the old mechanism

- `CategoryChip.test.tsx` asserted `toHaveStyle({ backgroundColor })`. jsdom loads no stylesheet, so
  once the colour came from a recipe there was nothing to compute. Now asserts the custom property
  and the class — the actual contract.
- `MetricDetailComposite.int.test.tsx` asserted `toHaveClass("bg-brand-primary/10")`, i.e. the tint
  itself. Now asserts `metric-tab-active`: the class names the state, the recipe owns the colour.

## Verification

| Gate                      | Result                                                      |
| ------------------------- | ----------------------------------------------------------- |
| `lint`                    | 0 errors, 17 warnings — the `dev` baseline                  |
| `lint:css`                | clean (stylelint required `%` alpha notation, not decimals) |
| `typecheck`               | clean                                                       |
| `test:unit`               | 78 suites, 648 tests                                        |
| `test:integration`        | 18 suites, 92 tests                                         |
| `coverage:check --strict` | all goals met                                               |
| `build`                   | passes                                                      |

Checked in the browser: the metric detail tab rail renders with the active tab tinted exactly as
before, and the category swatches resolve — `--category-color: #D9D9D9` computing to
`rgb(217, 217, 217)`. Both seeded categories really are `#D9D9D9`, confirmed against the API, so the
grey swatches are the data rather than a regression.

**Not checked visually:** the mobile bottom bar and the sidebar scrim, which need a narrow viewport.
Their tints moved verbatim into `app-chrome.tokens.css`, so the values are unchanged, but nobody has
looked at them.

## Note

`eslint --fix src` again autofixed five files with no connection to this ticket — the same
pre-existing import-order and `sonarjs` warnings in `useRouteSync`, `sanitizeErrorMessage`,
`cursorSort.test` and two metric-category route files. Reverted again. They are worth clearing in a
change of their own; that is now twice they have tried to ride along.
