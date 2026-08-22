# ADR-0010 — Modal Focus Management and Close-Behavior Hardening

- **Status:** Accepted
- **Date:** 2026-02-15
- **Origin:** `ADR-016` in the components-overhaul kit — [`decisions.md`](../../internal/initiatives/components-overhaul/decisions.md)

---

## Context

`Modal` was missing key accessibility and interaction guardrails (focus trap, focus restore, escape close, overlay close, body scroll lock), creating inconsistent behavior across form dialogs.

## Decision

1. Keep the existing external API (`title`, `description`, `isOpen`, `onClose`, `hideClose`, `size`, `variant`, `className`) for compatibility across existing form and sidebar callsites.
2. Add built-in focus management: trap `Tab` focus within dialog while open and restore focus to the previously active element on close.
3. Add close behavior guards: `Escape` closes dialog, overlay click closes dialog (with opt-out via `closeOnOverlayClick`), close button remains available by default.
4. Lock `document.body` scroll while modal is open and restore prior body overflow state on cleanup.
5. Add dedicated unit tests for render/close behavior, focus trap, focus restoration, and scroll-lock lifecycle.

## Options considered

1. Keep modal minimal and push focus/close behavior to each caller.
2. Centralize behavior in `Modal` primitive with test coverage.

## Consequences

- Dialog interactions are now consistent across all current modal callsites.
- Accessibility baseline improved without callsite refactors.
- Tracker metrics updated (`17` components with dedicated tests).
