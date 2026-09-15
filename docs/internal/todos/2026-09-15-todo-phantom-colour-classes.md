# Phantom colour classes

**Purpose:** fix Tailwind colour utilities naming colours the theme does not define, found while
scoping ticket 8.
**Owner:** hardini
**Branch:** `fix/error-boundary-phantom-classes` off `dev`

## What a phantom class is, and why it is silent

`tailwind.config.mjs` **replaces** Tailwind's palette rather than extending it, so `theme.colors`
is the complete set of colour names. A class naming anything else generates **no CSS at all** — no
warning, no error, no fallback. The element renders unstyled.

Lint cannot catch it: `bg-destructive/5` is well-formed, and the linter has no idea `destructive`
does not exist. The opacity-tint rule from ticket 8 would have walked straight past it.

## Four phantom colours, six sites

| Class | Where | Effect |
| --- | --- | --- |
| `bg-destructive/5`, `border-destructive/20`, `text-destructive` | `dashboard/error.tsx`, `metrics/[metricId]/error.tsx` | **both error boundaries rendered with no error styling at all** — no red border, no tint, no red heading |
| `text-destructive` | `DashboardContent.tsx` `ErrorState` | error message rendered in body colour |
| `text-muted-foreground` (a shadcn leftover) | `DashboardContent.tsx`, `MetricCardFromBatch.tsx` | secondary text rendered at full ink |
| `text-ink-600` | `(auth)/layout.tsx` footer | footer rendered at full ink |
| `bg-card` | `DashboardContent.tsx`, `dashboard/loading.tsx` | skeleton and grid cards had no background |

Verified against the built stylesheet, not inferred: every occurrence of `destructive` in the CSS is
a **button token variable** (`--button-destructive-bg` and friends). No `.bg-destructive`,
`.border-destructive` or `.text-destructive` rule is generated. Same for `muted-foreground`,
`ink-600` and `card`.

PR #17 swept `text-ink-muted` and `bg-muted`; these six survived. The error boundaries are the worst
of them — they render only when something has already gone wrong, so nobody sees them in normal use.

## The fix

Real tokens throughout, no tints:

- Error panels: `border-status-error` + `bg-surface`, heading `text-ink-error`.
  `--text-error` is the contrast-verified token from PR #17 — `vividcoral-700` (4.68:1) in light,
  `vividcoral-100` in dark. `bg-status-error-bg` was **not** used: it is `vividcoral-100` in both
  themes, which would be a light coral panel in a dark UI.
- `text-muted-foreground`, `text-ink-600` → `text-ink-secondary`.
- `bg-card` → `bg-surface`.

## The guard

`src/styles/__tests__/colour-classes.test.ts` parses `theme.colors` out of the Tailwind config,
collects the semantic type classes the token CSS defines (`.text-body1`, `.text-nav-item` — these
share the `text-` prefix but are not colours, which is also why `no-custom-classname` is off), and
asserts no `.tsx` names anything else.

**Proven to fail:** planting `bg-destructive` and `text-muted-foreground` in `dashboard/loading.tsx`
makes it fail naming both; reverting makes it pass. It also asserts it parsed a non-empty key set, so
a broken parse cannot pass vacuously — the failure mode from the 2026-08-17 `boundaries` lesson.

## Verification

| Gate | Result |
| --- | --- |
| `lint` | 0 errors, 17 warnings — the `dev` baseline |
| `lint:css` | clean |
| `typecheck` | clean |
| `test:unit` | 78 suites, 648 tests (was 77 / 646) |
| `test:integration` | 18 suites, 92 tests |

Dashboard checked in the browser: the `avg / min / max / n` line that carried
`text-muted-foreground` now renders in secondary ink.

The error boundaries themselves were **not** rendered in the browser — forcing a route error
boundary needs a deliberate throw. The class-resolution guard is what covers them.

## Follow-up

Ticket 8 continues separately: widen the opacity-tint and inline-style rules to `src/features`,
`src/app` and `src/components/layout`, and move the four real tints in `MetricDetailTabs` plus the
five dynamic inline styles into recipes.
