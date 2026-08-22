# ADR-0003 — Remove Unused FieldShell and Standardize on FormField

- **Status:** Accepted
- **Date:** 2026-02-13
- **Origin:** `ADR-005` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`FieldShell` had no in-repo usage and duplicated responsibilities already covered by `FormField`.

## Decision

1. Remove `src/components/ui/FieldShell.tsx`.
2. Standardize field labeling/error wiring on `FormField`.
3. Keep improving `InputChrome`, `TextField`, and `TextArea` under the shared form field contract.

## Options considered

1. Keep `FieldShell` as dormant API surface.
2. Remove `FieldShell` and reduce duplicate primitives now.

## Consequences

- Lower component maintenance surface.
- Clearer form primitive stack (`FormField` + control components).
- Tracker metrics updated (`28` UI components, `6` components with dedicated tests).
