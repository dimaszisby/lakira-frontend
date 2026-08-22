# ADR-0007 — Table Contract and Row-Interaction Guardrails

- **Status:** Accepted
- **Date:** 2026-02-15
- **Origin:** `ADR-011` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Table` is a shared desktop primitive across metrics/categories/logs and had inconsistent accessibility behavior for sorting states and clickable rows.

## Decision

1. Standardize table semantics with explicit `ariaLabel` and accurate header sort state mapping (`ascending`/`descending`/`none`).
2. Keep row-click behavior, but enforce interaction guardrails so nested interactive elements do not trigger row navigation.
3. Stabilize custom row rendering by keying `renderRow` output with `rowKey`.
4. Add `emptyMessage` override and dedicated tests for sort, row interaction, and empty-state behavior.
5. Normalize import path to canonical `@/lib/cn`.

## Options considered

1. Keep current behavior and only patch `aria-sort` in place.
2. Tighten the full primitive contract and add dedicated regression tests.

## Consequences

- Desktop table behavior is more predictable and easier to reuse safely.
- Sorting and row-click accessibility are now explicitly covered by tests.
- Tracker metrics updated (`13` components with dedicated tests).
