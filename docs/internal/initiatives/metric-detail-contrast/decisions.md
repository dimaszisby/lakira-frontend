# Contrast on the metric detail page — Decisions

## D-01 — The breadcrumb's current item and the active tab label use the text colour

- **Status:** Accepted
- **Date:** 2026-10-08

**Context.** Two labels on the metric detail page are `text-brand-primary`, `#e897a3`: the
breadcrumb's current item on `--surface`, and the active tab's label on `--tab-active-bg` (a 10%
tint of the brand colour over `--bg`). Computed from `src/styles/tokens/palette.css` and
`src/styles/tokens/semantic.css`, against 4.5:1 for WCAG 1.4.3:

| Element                 | Light | Dark |
| ----------------------- | ----- | ---- |
| Breadcrumb current item | 2.12  | 3.96 |
| Active tab label        | 1.77  | 5.17 |

Found by a draft end-to-end spec on 2026-10-07. No browser test had opened this page before: every
signed-in spec used a new account, which has no metric.

**Decision.** Chosen by the owner on 2026-10-08. Both labels render in `text-ink`, as
[`cypress-a11y-e2e` D-08](../cypress-a11y-e2e/decisions.md) did for the bottom navigation. The
active tab keeps `--tab-active-bg`, so the brand accent stays on it. Computed ratios for `text-ink`:
13.25 and 11.07 in light, 7.92 and 10.34 in dark.

**Options considered.**

- _Keep the pink labels and record a deviation_, as ADR-0017 does for buttons. Rejected: the
  failure stays for every user, on the name of the thing they are looking at.
- _A darker brand step, `sakurapink-700`._ Rejected: 3.59 and 3.00 in light, 2.34 on the dark
  surface. It fails too, and would need a new semantic token.

**Consequences.** The breadcrumb's current item is told apart by a darker text colour and
`aria-current="page"`, no longer by hue. The active tab is told apart by weight, tint and shape.
`text-brand-primary` remains on the header wordmark, an excluded logotype (`cypress-a11y-e2e`
D-07), and on the active bottom-navigation icon (D-08).

## D-02 — Dark `--text-tertiary` maps to `gray-300`

- **Status:** Accepted
- **Date:** 2026-10-08

**Context.** The first dark-theme run of `cypress/e2e/stack/metric-to-dashboard.cy.ts` failed
`color-contrast` on four elements of the metric overview: the breadcrumb's links and the "Created
at / Updated at" row. All are `text-ink-tertiary`. Dark `--text-tertiary` is `gray-400` `#a6a6a6`:
5.74:1 on `--bg`, 3.64:1 on `--surface` and 2.75:1 on `--surface-2`, against 4.5:1 (WCAG 1.4.3).
It fails wherever tertiary text sits on a card, and `.text-caption`, `.text-overline`,
`.text-footer`, `.text-tooltip` and `small` all apply it. The signed-in pages checked until now
put their tertiary text on the page background, which is why nothing had reported it.
[`cypress-a11y-e2e` D-09](../cypress-a11y-e2e/decisions.md) fixed the same token for the light
theme and left dark unchanged.

**Decision.** Chosen by the owner on 2026-10-08, at the stop the checklist's approval set for a
token change. Dark `--text-tertiary` becomes `gray-300` `#d9d9d9`: 9.89:1 on `--bg`, 6.28:1 on
`--surface`, 4.74:1 on `--surface-2`.

**Options considered.**

- _Move this page's two elements to `text-ink-secondary`._ Rejected: every other caption on a dark
  card stays failing until a spec happens to visit it.
- _Check the metric pages in the light theme only and file the rest._ Rejected: the failure would
  ship knowingly.

**Consequences.** Dark tertiary and dark secondary text are now the same grey, as they have been
in light since D-09, so the two tokens differ in name only. Small grey text is lighter on every
dark page, and so is a hovered input's border, which reads the same token
(`--input-border-hover`). No palette value changes.
