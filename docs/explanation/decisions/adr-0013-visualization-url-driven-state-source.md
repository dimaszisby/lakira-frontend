# ADR-0013 — Visualization URL-Driven State Source

- **Status:** Accepted
- **Date:** 2026-03-02
- **Origin:** `ADR-053` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Visualization` controls used local state initialized from URL params, which could drift when query params changed externally after initial render.

## Decision

1. Use URL params as source-of-truth for control state:
   - derive `bucket` and `range` directly from `useSearchParams`
   - remove local state + sync-effect state path
2. Keep picker interaction contract unchanged:
   - picker changes still update query via `router.replace(...)`
3. Add regression coverage for post-initial URL param changes.

## Options considered

1. Keep local state and synchronize from URL in effects.
2. Make URL query the canonical visualization control state.

## Consequences

- Visualization control state now tracks navigation/query changes reliably.
- Reduced local state complexity and removed effect-driven sync churn risk.
