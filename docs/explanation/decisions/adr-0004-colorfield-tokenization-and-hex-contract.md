# ADR-0004 — ColorField Tokenization and Hex Contract Hardening

- **Status:** Accepted
- **Date:** 2026-02-14
- **Origin:** `ADR-007` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`ColorField` still had inline hard-coded color literals and inconsistent hex normalization behavior across text input, quick palette, and native picker interactions.

## Decision

1. Extract shared color defaults/presets into `src/constants/color-presets.ts`.
2. Standardize `ColorField` validation/normalization around one `toValidHex` contract (including shorthand `#RGB` support).
3. Replace hard-coded utility colors with semantic token classes for shell/popover/controls.
4. Add dedicated unit tests covering shorthand normalization, invalid revert, quick palette apply, and default placeholder behavior.

## Options considered

1. Keep color constants local to component and only patch blur behavior.
2. Standardize constants + validation + tests in one slice.

## Consequences

- Color defaults now have a reusable single source of truth.
- `ColorField` interaction behavior is predictable across entry paths.
- Hard-coded hex offender count in `src/components/ui` dropped to `0`.
- Tracker metrics updated (`8` components with dedicated tests).
