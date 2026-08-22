# ADR-0002 — Immediate PrimaryButton Removal

- **Status:** Accepted
- **Date:** 2026-02-13
- **Related:** supersedes [ADR-0001](./adr-0001-button-consolidation-and-primarybutton-deprecation-window.md)
- **Origin:** `ADR-004` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

The component was already fully migrated in runtime usage, and the remaining wrapper added avoidable maintenance surface.

## Decision

1. Remove `src/components/ui/PrimaryButton.tsx` completely.
2. Standardize all button usage on `src/components/ui/Button.tsx`.
3. Update overhaul documentation/tracker to reflect removal completion.

## Options considered

1. Keep temporary wrapper for two sprints.
2. Remove immediately now that no runtime imports remain.

## Consequences

- Single source of truth for button primitives.
- Reduced surface area and less migration overhead.
- Tracker metrics updated (`29` UI components, `14` client components).
