# ADR-0011 — Sort Controls and Skeleton Naming Standardization

- **Status:** Accepted
- **Date:** 2026-02-16
- **Origin:** `ADR-021` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`SortChip` and `SortChipGroup` still had inconsistent styling/import patterns, and `SekeletonLoader` remained misspelled in file path and imports.

## Decision

1. Standardize `SortChip` with semantic token-based active/inactive states and explicit pressed semantics.
2. Standardize `SortChipGroup` with explicit group labeling and keep sortable-column-only chip rendering.
3. Rename `SekeletonLoader.tsx` to `SkeletonLoader.tsx` and migrate app callsites to the corrected path.
4. Add/refresh unit tests for sort controls and skeleton loader behavior.

## Options considered

1. Keep current sort controls and only rename the skeleton file.
2. Address sort controls and naming cleanup in a single Phase 3 closure slice.

## Consequences

- Sort controls now align with the same token/semantics baseline as other overhauled utilities.
- Naming inconsistency for skeleton loader is resolved across UI and app callsites.
- Tracker metrics updated (`28` components with dedicated tests).
