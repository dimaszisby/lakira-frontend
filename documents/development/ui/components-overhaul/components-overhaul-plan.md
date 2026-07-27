# Components Overhaul Plan

## Context and Goals

The UI layer includes legacy and newer component patterns. This plan aligns all shared components to the current frontend standards in:

- `documents/documentation/engineering/components/`

Primary goals:

1. Unified component API contracts
2. Accessibility-first interaction behavior
3. Token-driven styling consistency
4. Improved test confidence on reusable primitives

## Success Metrics

1. Duplicate primitive patterns removed (`PrimaryButton` fully replaced by `Button`).
2. No hard-coded palette values in shared primitives unless justified.
3. All Tier 1 and Tier 2 components pass the component review scorecard.
4. Component test coverage for `src/components/ui` materially increased from current baseline.

## Tier-Based Test Minimum (Accepted 2026-02-18)

These minimums define completion criteria per component tier for this initiative.

### Tier 1 (Foundation Primitives)

Minimum per component:

1. Semantic render and accessible name coverage.
2. Primary interaction coverage (`click`, `typing`, keyboard where applicable).
3. Disabled/loading/error behavior coverage where relevant.
4. Callback/value contract coverage.

### Tier 2 (Complex Interactions)

Minimum per component:

1. All Tier 1 minimums.
2. Keyboard navigation path coverage.
3. Focus handoff/restore coverage.
4. Overlay/outside-close or escape-close coverage where relevant.
5. Controlled/uncontrolled state transition coverage where supported.
6. Edge-guard coverage (invalid selection, disabled option, out-of-range action).

### Tier 3 (Display and Utility Components)

Minimum per component:

1. Semantic render and state labeling coverage.
2. Core behavior coverage for primary interaction path.
3. Empty/error/edge-state coverage where relevant.

## Phases and Milestones

### Phase 0: Baseline and Governance

- Finalize audit and tracker
- Define priorities and acceptance criteria per component family
- Confirm migration policy for deprecated components

### Phase 1: Foundation Primitives

- Button family (`Button` as single source)
- Form/input shell primitives (`FormField`, `InputChrome`, `TextField`, `TextArea`)
- Remove API and style inconsistencies

### Phase 2: Complex Interactions

- `Modal`, `Select`, `Toggle`, `SegmentedControl`, `DateTimePicker`
- Keyboard/focus behavior hardening
- Route and form integration compatibility checks

### Phase 3: Display and Utility Components

- `Table`, `Pagination`, `Card`, `SearchInput`, `Visualization`, supporting display primitives
- Style consistency and render optimization cleanup

### Phase 4: Test and Quality Hardening

- Fill component test gaps for critical primitives
- Add targeted integration tests for high-risk interactions
- Final pass with review scorecard

## Risks and Trade-offs

1. Refactoring primitives can introduce widespread regressions if done in large batches.
   - Mitigation: small incremental PRs per component family.
2. API unification may require migration updates across feature components.
   - Mitigation: temporary adapter wrappers and staged deprecation.
3. Raising test coverage can slow short-term delivery.
   - Mitigation: prioritize tests for high-impact primitives first.

## Open Questions

1. Should we standardize complex widgets on Ariakit primitives where available?

Resolved:

- Deprecation window policy is accepted in `decisions.md` (ADR-003): two sprints for wrapper-based compatibility before removal.
