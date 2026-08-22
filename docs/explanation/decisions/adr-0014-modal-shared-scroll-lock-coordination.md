# ADR-0014 — Modal Shared Scroll-Lock Coordination

- **Status:** Accepted
- **Date:** 2026-03-12
- **Origin:** `ADR-062` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Modal` locked and restored body scroll per instance. In stacked modal flows, closing one modal could restore body scroll while another modal remained open.

## Decision

1. Add module-level body-scroll lock coordination:
   - lock counter for active open modals
   - tracked original body overflow value before first lock
2. Lock on modal open and decrement on close.
3. Restore body overflow only when lock counter returns to zero.
4. Add regression test for stacked modal open/close behavior.

## Options considered

1. Keep instance-level overflow save/restore.
2. Coordinate body scroll lock across all open modal instances.

## Consequences

- Body scroll lock now remains correct for stacked modal scenarios.
- Existing modal API and focus behavior remain unchanged.
- Regression tests guard against premature overflow restoration.
