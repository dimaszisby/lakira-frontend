# ADR-0005 — Pagination Contract Rebuild and Accessibility Guardrails

- **Status:** Accepted
- **Date:** 2026-02-14
- **Origin:** `ADR-008` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Pagination` had an inconsistent API path for known-total vs cursor-mode navigation and included dead/broken helper code that increased regression risk.

## Decision

1. Rebuild `Pagination` with a single guarded `goToPage` path and explicit known-total/cursor-mode branches.
2. Keep the existing external prop contract (`page`, `pageSize`, `total`, `canPrev`, `canNext`, `onChange`) for compatibility.
3. Add dedicated accessibility-friendly nav labeling (`aria-current`, `aria-live`, disabled navigation guards).
4. Add unit tests for known-total rendering, cursor-mode behavior, clamped page bounds, and disabled-control no-op behavior.

## Options considered

1. Patch only the obvious dead helper component and keep existing flow.
2. Replace the component with a typed, explicit navigation model in one slice.

## Consequences

- Pager behavior is now deterministic across list modes.
- Disabled and out-of-range navigation paths no longer emit invalid page transitions.
- Tracker metrics updated (`9` components with dedicated tests).
