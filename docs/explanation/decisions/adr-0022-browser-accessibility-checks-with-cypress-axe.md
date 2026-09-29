# ADR-0022 — Browser accessibility checks run through `cypress-axe`, with `axe-core` pinned

- **Status:** Proposed
- **Date:** 2026-09-29
- **Origin:** `D-02` in the cypress-a11y-e2e kit — [`decisions.md`](../../internal/initiatives/cypress-a11y-e2e/decisions.md)

---

## Context

Automated accessibility coverage was lint plus `jest-axe`. jsdom has no layout and evaluates no
colour contrast, so ADR-0017's measured button failures passed every suite and dark mode was never
checked at all. Cypress needs axe injected into the page under test to fill that gap.
`cypress-axe` 1.7.0 supports Cypress 10 to 15 and declares `axe-core` 3 or 4 as a peer; this
repository had `axe-core` only transitively, through `jest-axe` and `eslint-plugin-jsx-a11y`.

## Decision

Add `cypress-axe` (`^1.7.0`) and `axe-core` as dev dependencies. Pin `axe-core` to an exact version
(`4.13.0`) and bump it only in its own change: a new version can add rules and fail CI on a PR that
changed nothing, the reason Lighthouse is pinned too (`.claude/rules/performance.md`).

All use goes through one command, `cy.checkPageA11y()` in `cypress/support/a11y.ts`, which runs the
WCAG 2.0 and 2.1 A and AA rules and fails on any violation. Its exclusions live in that file and
each cites an ADR or a WCAG criterion.

## Options considered

- **`axe-core` alone and a hand-written command.** One dependency fewer, but it re-implements the
  injection and result handling `cypress-axe` already tests, for about twenty lines saved.
- **Lighthouse's accessibility score**, already run nightly. Rejected: a score of 90 or more still
  passes with violations, and it covers three public routes.
- **A caret range on `axe-core`.** Rejected for the reason in the decision.

## Consequences

- Colour contrast is measured in a real browser, in both themes. The first run found three defects
  on the signed-in pages that no suite had seen, fixed in the same change (kit D-08, D-09, and the
  bottom-navigation overlap), and one logotype exempted (kit D-07).
- Neither package has an install script, so ADR-0019's `allowScripts` is unchanged.
- Two dev dependencies to keep current, and `axe-core`'s version now decides which rules the E2E
  layer applies, separately from `jest-axe`'s bundled copy.
- Where the checks run is kit D-01, stated in `.claude/rules/testing.md` § E2E: public pages in CI,
  signed-in pages only in the local stack suite.

## References

- ADR-0017, ADR-0019
- `.claude/rules/accessibility.md` § Current tooling gaps
- [`docs/how-to/testing/run-stack-e2e.md`](../../how-to/testing/run-stack-e2e.md)
