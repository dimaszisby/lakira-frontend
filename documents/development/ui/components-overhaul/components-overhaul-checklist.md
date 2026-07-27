# Components Overhaul Checklist

## Phase 0: Baseline and Governance

- [x] Create overhaul folder and documentation kit
- [x] Record baseline audit (`components-overhaul-audit-2026-02-13.md`)
- [x] Create component tracker with phase assignments
- [x] Define deprecation policy for replaced components
- [x] Define test minimum per component tier

## Phase 1: Foundation Primitives

- [x] Consolidate and fully remove `PrimaryButton` in favor of `Button`
- [x] Align button props contract and accessibility behavior
- [x] Normalize input primitives (`FormField`, `InputChrome`, `TextField`, `TextArea`) and remove unused `FieldShell`
- [x] Remove hard-coded colors from button foundation primitives
- [x] Add or update unit tests for foundation primitives

## Phase 2: Complex Interactions

- [x] Audit and harden `Modal` keyboard/focus behavior
- [x] Audit and harden `Select` ARIA and keyboard interactions
- [x] Audit and harden `CategorySelect` (Ariakit combobox) semantics and default-create behavior
- [x] Audit and harden `ColorField` (hex normalization, token styling, shared presets)
- [x] Audit and harden `Toggle` and `SegmentedControl` semantics
- [x] Audit `DateTimePicker` interaction/a11y patterns
- [x] Add tests for core interaction paths

## Phase 3: Display and Utility Components

- [x] Standardize `Table`, `Pagination`, `Card`, `SearchInput`, `Visualization`
- [x] Standardize `Table` (sort semantics, row interaction guardrails, empty-state API)
- [x] Standardize `Pagination` (known-total and cursor-mode a11y behavior)
- [x] Standardize `ListModeToggle` (radiogroup semantics and arrow-key behavior)
- [x] Standardize `SearchInput` (tokenized loading/clear controls and escape/clear behavior)
- [x] Standardize `Card` primitive contract (semantic root support and heading override)
- [x] Standardize `Visualization` (bucket/range query sync and empty-data state behavior)
- [x] Standardize `SwipeableCard` (drag state, outside-close, and keyboard close behavior)
- [x] Standardize `Slider` (snapping math, keyboard parity, and tokenized visuals)
- [x] Resolve naming issue for `SekeletonLoader`
- [x] Remove residual style inconsistencies
- [x] Add missing tests for high-usage display components

## Phase 4: Quality Hardening and Closure

- [x] Run component review scorecard on all Tier 1 and Tier 2 components
- [x] Ensure docs and migration notes are updated
- [x] Validate lint, unit tests, and CSS lint pass after overhaul changes
- [x] Publish final summary and residual backlog
