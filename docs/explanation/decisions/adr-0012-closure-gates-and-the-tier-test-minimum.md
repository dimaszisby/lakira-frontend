# ADR-0012 — Phase 4 Closure Gates and Tier Test Minimum

- **Status:** Accepted
- **Date:** 2026-02-18
- **Origin:** `ADR-023` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

All tracked UI components reached `Done` status, but initiative closure required explicit quality-gate evidence and a durable tier-based test minimum policy.

## Decision

1. Adopt a minimum test matrix by tier:
   - Tier 1: at least 4 behavior tests per component.
   - Tier 2: at least 6 behavior tests per component.
   - Tier 3: at least 3 behavior tests per component.
2. Run and record closure quality gates for UI components:
   - `npx eslint src/components/ui --ext .tsx`
   - `npx jest src/components/ui/__tests__ --runInBand`
   - `npm run lint:css`
3. Publish final initiative artifacts:
   - `tier1-tier2-scorecard-2026-02-18.md`
   - `components-overhaul-final-summary-2026-02-18.md`

## Options considered

1. Close initiative based only on tracker `Done` status.
2. Require explicit gate evidence and closure documentation.

## Consequences

- Closure status is auditable with concrete gate outputs.
- Test expectations remain clear for future component work.
- Initiative can transition cleanly from execution to maintenance mode.
