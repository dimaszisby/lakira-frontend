# ADR-0009 — Select Listbox Trigger Semantics and Keyboard Hardening

- **Status:** Accepted
- **Date:** 2026-02-15
- **Origin:** `ADR-015` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Select` is used in metric settings flows and needed stronger accessibility semantics and keyboard behavior, plus consistency with token-first styling standards.

## Decision

1. Implement `Select` as a button-trigger + `listbox` pattern (`aria-haspopup=listbox`, `aria-expanded`, `aria-controls`, `aria-activedescendant`) with explicit option semantics.
2. Harden keyboard navigation (`ArrowUp/ArrowDown`, `Home/End`, `Enter/Space`, `Escape`, `Tab`) and ensure disabled options are skipped.
3. Keep existing external contract (`value`, `onChange`, `options`, `renderOption`, add-ons, hidden `name` input) to avoid integration churn.
4. Normalize imports to canonical alias paths and migrate styles to semantic token classes.
5. Add dedicated unit tests for click selection, keyboard selection, escape-close, hidden input behavior, and disabled state.

## Options considered

1. Keep existing combobox-like trigger semantics and patch only styling.
2. Rebuild interaction semantics around a clear listbox-trigger model and validate via tests.

## Consequences

- Select interactions are now more predictable for keyboard users and assistive technology.
- Existing feature-level integrations remain compatible while behavior quality improves.
- Tracker metrics updated (`16` components with dedicated tests).
