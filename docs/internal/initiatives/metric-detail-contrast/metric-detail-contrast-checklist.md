# Contrast on the metric detail page — Checklist

Approved by the owner on 2026-10-08, before any code.

## Phase 0 — the spec, against the unfixed code

- [x] `cypress/e2e/stack/metric-to-dashboard.cy.ts` — creates a metric through the form, finds its
      card on the dashboard, logs a value, sees it in the log list; checks the metric detail page
      with axe in both themes
- [x] Run against the unfixed build first; the failures recorded under Evidence

## Phase 1 — the fix

- [x] `src/app/(app)/metrics/[metricId]/_components/Breadcrumbs.tsx` — the current item is
      `text-ink` and carries `aria-current="page"`
- [x] `src/app/(app)/metrics/[metricId]/_components/MetricDetailTabs.tsx` — the active tab's label
      is `text-ink`

## Phase 2 — docs

- [x] `docs/how-to/testing/run-stack-e2e.md` names the new spec
- [x] `SAAS-BASE-CHECKLIST.md` — the end-to-end row says which half is covered

## Discovered

- [x] Found: in the dark theme every `text-ink-tertiary` text on a card fails 1.4.3. Dark
      `--text-tertiary` is `gray-400`, 3.64:1 on `--surface` (`gray-800`); it passes only on
      `--bg` (5.74). `.text-caption`, `.text-overline`, `.text-footer`, `.text-tooltip` and
      `small` all apply it (`src/styles/tokens/typography.css`). On this page: the breadcrumb's
      links and the "Created at / Updated at" row in `MetricHeaderSection.tsx:76`. It needs a
      semantic token changed, so work stopped here for the owner to choose → in scope, D-02:
      `src/styles/tokens/semantic.css`

## Acceptance

A small sweep has no plan, so the criteria are stated here.

- [x] **AC-1** — The breadcrumb's current item and the active tab's label meet 4.5:1 in the light
      and dark themes (WCAG 1.4.3). _Method:_ cypress-axe `color-contrast` ·
      `cypress/e2e/stack/metric-to-dashboard.cy.ts`
- [x] **AC-2** — That spec fails on the unfixed code and passes on the fixed code. _Method:_ both
      runs, recorded under Evidence
- [x] **AC-3** — A browser test creates a metric, logs a value, sees the value in the log list and
      finds the metric's card on the dashboard. _Method:_ the same spec
- [x] **AC-4** — The spec asserts no dashboard count, and says which record unparks them.
      _Method:_ read
- [x] **AC-5** — The breadcrumb's current item has `aria-current="page"`. _Method:_ asserted in
      the spec

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — 943
- [x] integration — 125; run because `MetricDetailComposite.int.test.tsx` renders both components
- [x] spec drift — `api:spec:check`, immediately before handover
- [x] `security:audit` — immediately before handover
- [x] build
- [x] e2e — 18
- [x] e2e (csp) — 7
- [x] e2e (stack) — 27
- e2e (csp, stack) — not run: no policy, proxy or layout change

## Evidence

Node 24.21.0. Production build on `127.0.0.1:3000`, backend on `:8001`, Mailpit on `:8025`,
2026-10-08.

- **AC-2, unfixed code** — 2 of 5 passed. axe on the metric overview, light: the breadcrumb's
  current item at 2.15:1 (`#e896a3` on `#f9fafb`) and the active tab's label at 1.78:1 (on
  `#ebe3e4`). Dark: the current item at 3.93:1, and four `text-ink-tertiary` elements at 3.64:1
  (`#a6a6a6` on `#4a4a4a`). The journey test failed on the missing `aria-current`.
- **AC-2, after Phase 1 only** — 4 of 5. Light passed; dark still failed on the four tertiary
  elements, which is the Discovered item and D-02.
- **AC-2, after D-02** — 5 of 5, and again after the last edit to the spec.
- **AC-1** — the axe figures above are measured in the browser; the ratios in `decisions.md` are
  computed from the token files and differ in the second decimal.
- **The rest of the dark theme** — the eleven cases of `app-pages.a11y.cy.ts` pass with the new
  token, five pages in each theme.
- `api:spec:check` and `security:audit` passed at 10:13 UTC.
- **Review** — self-review of the diff; no agent.
