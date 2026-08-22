# ADR-0006 — Card Primitive Contract Hardening

- **Status:** Accepted
- **Date:** 2026-02-14
- **Origin:** `ADR-010` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Card` is used widely across page layouts, but it lacked a semantic root override and had no dedicated test coverage for its primitive API.

## Decision

1. Keep the existing recipe-driven API (`size`, `variant`, `radius`, `elevation`) and add semantic root support via `as` (`div`/`section`/`article`/`aside`).
2. Add heading-level override for `CardTitle` via `as` (`h1`-`h6`) while keeping default heading behavior.
3. Standardize imports to the canonical `@/lib/cn` path.
4. Add dedicated `Card` unit tests for default data attributes, semantic root overrides, and subcomponent structure.

## Options considered

1. Keep `Card` as `div`-only and rely on caller wrappers for semantics.
2. Extend the primitive directly with semantic/heading overrides and tests.

## Consequences

- Card primitives can now express section-level semantics without wrapper churn.
- Heading hierarchy can be controlled at call sites while preserving default behavior.
- Tracker metrics updated (`12` components with dedicated tests).
