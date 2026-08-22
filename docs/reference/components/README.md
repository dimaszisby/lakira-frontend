# Component UI Guidelines – Lakira Frontend

This folder defines the engineering standard for UI components in the Lakira frontend.

Scope:

- Next.js `app` router component architecture.
- React component API and state design.
- Tailwind + token-driven styling conventions.
- Accessibility and interaction behavior.
- Testing and release quality gates.

Primary audience:

- Engineers implementing reusable UI primitives and feature-level UI.
- Reviewers validating quality and consistency.

---

## 1. Baseline Stack (Current)

- Next.js `16.x` + React `19.x`
- Tailwind CSS `3.4.x`
- TypeScript `5.x`
- `clsx` + `tailwind-merge` (`cn` helper)
- Token-based CSS architecture (`src/styles/tokens/**`)
- Ariakit available for accessible headless primitives

These guidelines are optimized for this stack today, while keeping migration paths open.

---

## 2. What “Industry-Standard + Portfolio-Worthy” Means Here

A component is considered done when it is:

1. Predictable: clear API contract, no hidden behavior.
2. Accessible: keyboard + screen reader support is intentional and tested.
3. Tokenized: visual styles use semantic tokens, not ad-hoc hex values.
4. Performant: client JS and render work are minimized.
5. Testable: behavior is covered by meaningful tests.
6. Maintainable: variants and states scale without class-name entropy.

---

## 3. Document Map

1. `component-architecture-and-api.md`
2. `component-styling-tailwind-and-tokens.md`
3. `component-accessibility-and-interactions.md`
4. `component-testing-and-quality-gates.md`
5. `component-review-scorecard.md`
6. `component-implementation-playbook.md`

Read in this order for onboarding and implementation.

Execution references for the 2026 UI overhaul:

1. `docs/internal/initiatives/components-overhaul/README.md`
2. `docs/internal/initiatives/components-overhaul/components-overhaul-tracker.md`
3. `docs/internal/initiatives/components-overhaul/tier1-tier2-scorecard-2026-02-18.md`
4. `docs/internal/initiatives/components-overhaul/components-overhaul-final-summary-2026-02-18.md`

---

## 4. How To Use These Guidelines

1. Start with architecture/API before writing JSX.
2. Pick styling strategy using the decision matrix.
3. Implement accessibility behavior with keyboard semantics first.
4. Add tests before polishing variants.
5. Run review scorecard before PR.

For cross-domain standards, also reference:

- `docs/reference/accessibility-baseline.md`
- `docs/reference/performance-budget.md`
- `docs/reference/style/color-palette.md`
- `docs/reference/style/typography.md`

---

## 5. Iteration Strategy (Recommended)

Apply standards incrementally, not via full rewrite.

1. New components must follow these guidelines immediately.
2. Existing components are upgraded when touched by feature work.
3. High-impact primitives (`Button`, `TextField`, `Modal`, `Select`) are prioritized.
4. Deprecated components are marked and migrated with small PRs.

---

## 6. External References (Primary Sources)

- Next.js docs (App Router, client/server boundaries, assets, fonts)
  - https://nextjs.org/docs/app/getting-started/server-and-client-components
  - https://nextjs.org/docs/messages/no-img-element
  - https://nextjs.org/docs/pages/api-reference/components/image
  - https://nextjs.org/docs/pages/api-reference/components/link
  - https://nextjs.org/docs/pages/api-reference/components/font
- React docs (API and optimization guidance)
  - https://react.dev/reference/react/forwardRef
  - https://react.dev/reference/react/useMemo
- Tailwind docs (utility strategy and class practices)
  - https://tailwindcss.com/docs/detecting-classes-in-source-files
  - https://tailwindcss.com/docs/reusing-styles
  - https://tailwindcss.com/docs/functions-and-directives
- W3C/WAI accessibility patterns
  - https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  - https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Testing Library guiding principles
  - https://testing-library.com/docs/guiding-principles
- Ariakit docs
  - https://ariakit.org/
