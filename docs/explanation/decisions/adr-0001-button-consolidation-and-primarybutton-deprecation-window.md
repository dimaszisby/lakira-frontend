# ADR-0001 — Button Consolidation and PrimaryButton Deprecation Window

- **Status:** Superseded
- **Date:** 2026-02-13
- **Related:** superseded by [ADR-0002](./adr-0002-immediate-primarybutton-removal.md)
- **Origin:** `ADR-003` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`PrimaryButton` duplicated `Button` behavior with hard-coded colors and divergent API semantics.

## Decision

1. Migrate active usage to `Button` with `variant="primary"`.
2. Keep `PrimaryButton` as a temporary deprecated wrapper over `Button`.
3. Apply a deprecation window of two sprints, then remove `PrimaryButton` if there are no imports.

## Options considered

1. Remove `PrimaryButton` immediately and update all callers in one pass.
2. Keep both components indefinitely.
3. Use a short deprecation wrapper window.

## Consequences

- Immediate style/API convergence for the button family.
- Lower migration risk during transition.
- Decision superseded by ADR-0002 due explicit immediate-removal directive.
