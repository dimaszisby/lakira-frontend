# Components Overhaul 2026

This folder tracks the UI components overhaul and optimization program for Lakira frontend.

## Objective

Raise reusable UI components to an industry-standard, portfolio-ready baseline for:

- API design consistency
- Accessibility behavior
- Token-driven styling
- Test coverage and quality gates
- Performance-aware client boundaries

## Scope

- Primary scope: `src/components/ui/*.tsx`
- Supporting references:
  - `documents/documentation/engineering/components/README.md`
  - `documents/documentation/dev-documentation-guidelines.md`
  - `documents/documentation/accessibility-guidelines.md`
  - `documents/documentation/performance-budget.md`

## Snapshot

Initial baseline at kickoff (2026-02-13):

- Total UI components: `30`
- Components with dedicated unit tests: `4`
- Components using `"use client"`: `14`
- Components with hard-coded hex colors detected: `3`

Current status at closure checkpoint (2026-02-18):

- Total UI components: `28`
- Components with dedicated unit tests: `28`
- Components using `"use client"`: `15`
- Components with hard-coded hex colors detected: `0`

See:

- `components-overhaul-audit-2026-02-13.md`
- `components-overhaul-tracker.md`
- `tier1-tier2-scorecard-2026-02-18.md`
- `components-overhaul-final-summary-2026-02-18.md`

## Working Docs

1. `components-overhaul-plan.md`
2. `components-overhaul-checklist.md`
3. `components-overhaul-tracker.md`
4. `components-overhaul-audit-2026-02-13.md`
5. `decisions.md`
6. `tier1-tier2-scorecard-2026-02-18.md`
7. `components-overhaul-final-summary-2026-02-18.md`
8. `feature-components-follow-up.md`

## Delivery Rule

Each component is only marked complete when:

1. It passes the component review scorecard standard.
2. Required tests are added/updated.
3. Accessibility keyboard/focus behavior is verified.
4. Styling uses semantic tokens or approved recipe strategy.

## Post-Closure Follow-Up

Core `src/components/ui` overhaul is complete. Additional component hardening in feature domains is tracked in:

- `feature-components-follow-up.md`
