# ADR-0008 — Visualization URL-State Sync Hardening

- **Status:** Accepted
- **Date:** 2026-02-15
- **Origin:** `ADR-012` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Visualization` is a client component that binds picker state to URL query params, and needed stronger guards for invalid bucket input plus complete relative/absolute range syncing.

## Decision

1. Normalize imports to canonical feature aliases (`@/features/...`) for consistency.
2. Add explicit runtime guards and parsers for initial bucket/range values from URL params.
3. Sync query params for both relative (`-range`) and absolute (`-start`/`-end`) modes, clearing stale keys when modes change.
4. Add explicit empty-data UI state (separate from loading state).
5. Expand unit tests to mock `next/navigation` and verify router replace behavior for bucket/range transitions.

## Options considered

1. Keep existing relative-only URL sync and rely on picker-level validation.
2. Harden component-level parsing/sync behavior and validate with interaction tests.

## Consequences

- URL-driven visualization state is more resilient and predictable across page reload/sharing flows.
- Invalid granularity transitions are blocked at the component boundary.
- Visualization remains counted within tested components, with stronger regression coverage.
