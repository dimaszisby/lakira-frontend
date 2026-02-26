# Decisions Log

## ADR-001 - Components Overhaul Tracking Structure (Accepted 2026-02-13)

Context:

We need a stable way to audit, plan, and track a multi-iteration UI components overhaul.

Decision:

- Track the initiative under `documents/development/ui/components-overhaul/`.
- Use an initiative kit with:
  - `README.md`
  - `components-overhaul-plan.md`
  - `components-overhaul-checklist.md`
  - `components-overhaul-tracker.md`
  - dated audit snapshots
  - `decisions.md`

Options considered:

1. Put all content under `documents/documentation/engineering/components/`
2. Use `documents/development/ui/components-overhaul/` and cross-link to standards docs

Consequences:

- Standards remain stable in `documents/documentation/engineering/components/`.
- Execution progress remains isolated in a time-bound initiative folder.
- Easier to show roadmap and delivery progress in PRs and portfolio walkthroughs.

## ADR-002 - Prioritized Phasing Model (Accepted 2026-02-13)

Context:

The components set has mixed maturity and limited dedicated test coverage.

Decision:

- Execute overhaul in phases:
  1. Foundation primitives
  2. Complex interaction components
  3. Display and utility components
  4. Quality hardening and closure

Options considered:

1. Big-bang full refactor
2. Phased rollout by component risk/impact

Consequences:

- Lower regression risk via smaller batches.
- Faster feedback loops and easier rollback.
- More predictable review and tracking.

## ADR-003 - Button Consolidation and PrimaryButton Deprecation Window (Superseded 2026-02-13)

Context:

`PrimaryButton` duplicated `Button` behavior with hard-coded colors and divergent API semantics.

Decision:

1. Migrate active usage to `Button` with `variant="primary"`.
2. Keep `PrimaryButton` as a temporary deprecated wrapper over `Button`.
3. Apply a deprecation window of two sprints, then remove `PrimaryButton` if there are no imports.

Options considered:

1. Remove `PrimaryButton` immediately and update all callers in one pass.
2. Keep both components indefinitely.
3. Use a short deprecation wrapper window.

Consequences:

- Immediate style/API convergence for the button family.
- Lower migration risk during transition.
- Decision superseded by ADR-004 due explicit immediate-removal directive.

## ADR-004 - Immediate PrimaryButton Removal (Accepted 2026-02-13)

Context:

The component was already fully migrated in runtime usage, and the remaining wrapper added avoidable maintenance surface.

Decision:

1. Remove `src/components/ui/PrimaryButton.tsx` completely.
2. Standardize all button usage on `src/components/ui/Button.tsx`.
3. Update overhaul documentation/tracker to reflect removal completion.

Options considered:

1. Keep temporary wrapper for two sprints.
2. Remove immediately now that no runtime imports remain.

Consequences:

- Single source of truth for button primitives.
- Reduced surface area and less migration overhead.
- Tracker metrics updated (`29` UI components, `14` client components).

## ADR-005 - Remove Unused FieldShell and Standardize on FormField (Accepted 2026-02-13)

Context:

`FieldShell` had no in-repo usage and duplicated responsibilities already covered by `FormField`.

Decision:

1. Remove `src/components/ui/FieldShell.tsx`.
2. Standardize field labeling/error wiring on `FormField`.
3. Keep improving `InputChrome`, `TextField`, and `TextArea` under the shared form field contract.

Options considered:

1. Keep `FieldShell` as dormant API surface.
2. Remove `FieldShell` and reduce duplicate primitives now.

Consequences:

- Lower component maintenance surface.
- Clearer form primitive stack (`FormField` + control components).
- Tracker metrics updated (`28` UI components, `6` components with dedicated tests).

## ADR-006 - CategorySelect Standardization and Default Alignment (Accepted 2026-02-13)

Context:

`CategorySelect` still used hard-coded defaults and non-semantic utility styling, which conflicted with the token-first component standard.

Decision:

1. Use semantic token classes for control/popover/list item states.
2. Align fallback and create defaults with `CATEGORY_DEFAULTS`.
3. Add dedicated `CategorySelect` unit tests for clear/select/create/loading behavior.

Options considered:

1. Keep existing implementation and defer changes to Phase 3.
2. Standardize now as a focused Phase 2 slice.

Consequences:

- Reduced style drift in a high-usage form component.
- Category creation defaults are now consistent across form paths.
- Tracker metrics updated (`7` components with dedicated tests, `1` hard-coded-hex offender remaining).

## ADR-007 - ColorField Tokenization and Hex Contract Hardening (Accepted 2026-02-14)

Context:

`ColorField` still had inline hard-coded color literals and inconsistent hex normalization behavior across text input, quick palette, and native picker interactions.

Decision:

1. Extract shared color defaults/presets into `src/constants/color-presets.ts`.
2. Standardize `ColorField` validation/normalization around one `toValidHex` contract (including shorthand `#RGB` support).
3. Replace hard-coded utility colors with semantic token classes for shell/popover/controls.
4. Add dedicated unit tests covering shorthand normalization, invalid revert, quick palette apply, and default placeholder behavior.

Options considered:

1. Keep color constants local to component and only patch blur behavior.
2. Standardize constants + validation + tests in one slice.

Consequences:

- Color defaults now have a reusable single source of truth.
- `ColorField` interaction behavior is predictable across entry paths.
- Hard-coded hex offender count in `src/components/ui` dropped to `0`.
- Tracker metrics updated (`8` components with dedicated tests).

## ADR-008 - Pagination Contract Rebuild and Accessibility Guardrails (Accepted 2026-02-14)

Context:

`Pagination` had an inconsistent API path for known-total vs cursor-mode navigation and included dead/broken helper code that increased regression risk.

Decision:

1. Rebuild `Pagination` with a single guarded `goToPage` path and explicit known-total/cursor-mode branches.
2. Keep the existing external prop contract (`page`, `pageSize`, `total`, `canPrev`, `canNext`, `onChange`) for compatibility.
3. Add dedicated accessibility-friendly nav labeling (`aria-current`, `aria-live`, disabled navigation guards).
4. Add unit tests for known-total rendering, cursor-mode behavior, clamped page bounds, and disabled-control no-op behavior.

Options considered:

1. Patch only the obvious dead helper component and keep existing flow.
2. Replace the component with a typed, explicit navigation model in one slice.

Consequences:

- Pager behavior is now deterministic across list modes.
- Disabled and out-of-range navigation paths no longer emit invalid page transitions.
- Tracker metrics updated (`9` components with dedicated tests).

## ADR-009 - ListModeToggle and SearchInput Interaction Hardening (Accepted 2026-02-14)

Context:

`ListModeToggle` and `SearchInput` are shared controls in high-traffic list pages and needed stronger semantics/tests to meet the component baseline.

Decision:

1. Upgrade `ListModeToggle` to explicit `radiogroup`/`radio` semantics with arrow/home/end keyboard support.
2. Keep `ListModeToggle` API stable (`value`, `onChange`, `className`) and add optional `ariaLabel`.
3. Align `SearchInput` loading/clear controls to semantic token styling and normalize clear contract (`onClear` executes without args, fallback to `onChange("")`).
4. Add dedicated unit tests for both components, covering keyboard/selection and clear/loading behavior.

Options considered:

1. Keep existing interaction model and only restyle visuals.
2. Standardize semantics, keyboard behavior, and test coverage in one slice.

Consequences:

- Toggle and search controls now have explicit accessibility behavior and regression coverage.
- Shared list-page interactions are more predictable across metrics and categories screens.
- Tracker metrics updated (`11` components with dedicated tests).

## ADR-010 - Card Primitive Contract Hardening (Accepted 2026-02-14)

Context:

`Card` is used widely across page layouts, but it lacked a semantic root override and had no dedicated test coverage for its primitive API.

Decision:

1. Keep the existing recipe-driven API (`size`, `variant`, `radius`, `elevation`) and add semantic root support via `as` (`div`/`section`/`article`/`aside`).
2. Add heading-level override for `CardTitle` via `as` (`h1`-`h6`) while keeping default heading behavior.
3. Standardize imports to the canonical `@/lib/cn` path.
4. Add dedicated `Card` unit tests for default data attributes, semantic root overrides, and subcomponent structure.

Options considered:

1. Keep `Card` as `div`-only and rely on caller wrappers for semantics.
2. Extend the primitive directly with semantic/heading overrides and tests.

Consequences:

- Card primitives can now express section-level semantics without wrapper churn.
- Heading hierarchy can be controlled at call sites while preserving default behavior.
- Tracker metrics updated (`12` components with dedicated tests).

## ADR-011 - Table Contract and Row-Interaction Guardrails (Accepted 2026-02-15)

Context:

`Table` is a shared desktop primitive across metrics/categories/logs and had inconsistent accessibility behavior for sorting states and clickable rows.

Decision:

1. Standardize table semantics with explicit `ariaLabel` and accurate header sort state mapping (`ascending`/`descending`/`none`).
2. Keep row-click behavior, but enforce interaction guardrails so nested interactive elements do not trigger row navigation.
3. Stabilize custom row rendering by keying `renderRow` output with `rowKey`.
4. Add `emptyMessage` override and dedicated tests for sort, row interaction, and empty-state behavior.
5. Normalize import path to canonical `@/lib/cn`.

Options considered:

1. Keep current behavior and only patch `aria-sort` in place.
2. Tighten the full primitive contract and add dedicated regression tests.

Consequences:

- Desktop table behavior is more predictable and easier to reuse safely.
- Sorting and row-click accessibility are now explicitly covered by tests.
- Tracker metrics updated (`13` components with dedicated tests).

## ADR-012 - Visualization URL-State Sync Hardening (Accepted 2026-02-15)

Context:

`Visualization` is a client component that binds picker state to URL query params, and needed stronger guards for invalid bucket input plus complete relative/absolute range syncing.

Decision:

1. Normalize imports to canonical feature aliases (`@/features/...`) for consistency.
2. Add explicit runtime guards and parsers for initial bucket/range values from URL params.
3. Sync query params for both relative (`-range`) and absolute (`-start`/`-end`) modes, clearing stale keys when modes change.
4. Add explicit empty-data UI state (separate from loading state).
5. Expand unit tests to mock `next/navigation` and verify router replace behavior for bucket/range transitions.

Options considered:

1. Keep existing relative-only URL sync and rely on picker-level validation.
2. Harden component-level parsing/sync behavior and validate with interaction tests.

Consequences:

- URL-driven visualization state is more resilient and predictable across page reload/sharing flows.
- Invalid granularity transitions are blocked at the component boundary.
- Visualization remains counted within tested components, with stronger regression coverage.

## ADR-013 - SwipeableCard Interaction and Client-Boundary Hardening (Accepted 2026-02-15)

Context:

`SwipeableCard` drives edit/delete actions on mobile list rows and needed stronger interaction guardrails for drag/tap/keyboard parity plus an explicit Next.js client boundary.

Decision:

1. Add `"use client"` to make runtime intent explicit for hook/framer-motion usage.
2. Harden open-state behavior with controlled/uncontrolled support (`open`, `defaultOpen`, `onOpenChange`) while keeping `onClose` compatibility.
3. Add outside-pointer close and `Escape` close behavior for accessibility parity.
4. Keep drag-based interaction and add protections against accidental tap-through during drag.
5. Add dedicated unit tests for action invocation, outside close, escape close, and open-card tap close behavior.

Options considered:

1. Keep existing minimal swipe implementation and rely on parent composition for close logic.
2. Consolidate close/state guardrails inside `SwipeableCard` and cover with component-level tests.

Consequences:

- Mobile swipe interactions are more predictable and safer across touch and keyboard flows.
- `SwipeableCard` now has explicit client semantics and dedicated regression coverage.
- Tracker metrics updated (`14` components with dedicated tests, `15` client components).

## ADR-014 - Slider Interaction Contract Hardening (Accepted 2026-02-15)

Context:

`Slider` is used for threshold configuration and needed tighter behavior guarantees around snapping, keyboard controls, and tokenized visuals.

Decision:

1. Keep controlled API contract while normalizing rendered value via clamp/snap logic to avoid out-of-range drift.
2. Standardize keyboard and stepper behavior (`Arrow`, `Home/End`, `PageUp/PageDown`, `onChangeEnd` callbacks).
3. Support label rendering for marks via `markLabel` and guard mark/percent math for zero-range edge cases.
4. Migrate hard-coded utility colors to semantic token classes.
5. Add dedicated unit tests for keyboard flow, allowed-value snapping, mark labels, and stepper bounds.

Options considered:

1. Keep existing slider behavior with only style-level cleanups.
2. Harden arithmetic + interaction semantics and validate via focused tests.

Consequences:

- Slider interactions are more predictable across pointer, keyboard, and steppers.
- Threshold-setting UX is now backed by explicit regression coverage.
- Tracker metrics updated (`15` components with dedicated tests).

## ADR-015 - Select Listbox Trigger Semantics and Keyboard Hardening (Accepted 2026-02-15)

Context:

`Select` is used in metric settings flows and needed stronger accessibility semantics and keyboard behavior, plus consistency with token-first styling standards.

Decision:

1. Implement `Select` as a button-trigger + `listbox` pattern (`aria-haspopup=listbox`, `aria-expanded`, `aria-controls`, `aria-activedescendant`) with explicit option semantics.
2. Harden keyboard navigation (`ArrowUp/ArrowDown`, `Home/End`, `Enter/Space`, `Escape`, `Tab`) and ensure disabled options are skipped.
3. Keep existing external contract (`value`, `onChange`, `options`, `renderOption`, add-ons, hidden `name` input) to avoid integration churn.
4. Normalize imports to canonical alias paths and migrate styles to semantic token classes.
5. Add dedicated unit tests for click selection, keyboard selection, escape-close, hidden input behavior, and disabled state.

Options considered:

1. Keep existing combobox-like trigger semantics and patch only styling.
2. Rebuild interaction semantics around a clear listbox-trigger model and validate via tests.

Consequences:

- Select interactions are now more predictable for keyboard users and assistive technology.
- Existing feature-level integrations remain compatible while behavior quality improves.
- Tracker metrics updated (`16` components with dedicated tests).

## ADR-016 - Modal Focus Management and Close-Behavior Hardening (Accepted 2026-02-15)

Context:

`Modal` was missing key accessibility and interaction guardrails (focus trap, focus restore, escape close, overlay close, body scroll lock), creating inconsistent behavior across form dialogs.

Decision:

1. Keep the existing external API (`title`, `description`, `isOpen`, `onClose`, `hideClose`, `size`, `variant`, `className`) for compatibility across existing form and sidebar callsites.
2. Add built-in focus management: trap `Tab` focus within dialog while open and restore focus to the previously active element on close.
3. Add close behavior guards: `Escape` closes dialog, overlay click closes dialog (with opt-out via `closeOnOverlayClick`), close button remains available by default.
4. Lock `document.body` scroll while modal is open and restore prior body overflow state on cleanup.
5. Add dedicated unit tests for render/close behavior, focus trap, focus restoration, and scroll-lock lifecycle.

Options considered:

1. Keep modal minimal and push focus/close behavior to each caller.
2. Centralize behavior in `Modal` primitive with test coverage.

Consequences:

- Dialog interactions are now consistent across all current modal callsites.
- Accessibility baseline improved without callsite refactors.
- Tracker metrics updated (`17` components with dedicated tests).

## ADR-017 - Toggle and SegmentedControl Interaction Hardening (Accepted 2026-02-16)

Context:

`Toggle` and `SegmentedControl` still used non-canonical imports, hard-coded visual classes, and had edge-case interaction issues (toggle double-activation risk and segmented null-value focus gaps).

Decision:

1. Normalize both components to canonical `@/lib/cn` imports and semantic token-driven styles.
2. Remove explicit keyboard-toggle handling from `Toggle` and rely on native button activation to prevent duplicate toggles, while preserving `role="switch"` semantics.
3. Harden `SegmentedControl` roving focus with fallback to first enabled option when value is null/invalid, and add keyboard wrap navigation (`Arrow`, `Home`, `End`) that skips disabled items.
4. Keep existing external contracts for both components to avoid feature-callsite churn.
5. Add dedicated unit tests for `Toggle` and `SegmentedControl` interaction paths and accessibility semantics.

Options considered:

1. Keep existing behavior and only restyle visuals.
2. Tighten semantics/keyboard behavior and add tests in the same slice.

Consequences:

- Toggle interactions no longer risk accidental double toggles from keyboard activation.
- Segmented controls now remain keyboard-focusable and predictable even when current value is null.
- Tracker metrics updated (`19` components with dedicated tests).

## ADR-018 - DateTimePicker Popover and Interaction Hardening (Accepted 2026-02-16)

Context:

`DateTimePicker` had non-canonical imports, hard-coded color classes, and weak popover semantics (combobox-style trigger without matching model, limited focus restore behavior).

Decision:

1. Normalize imports to canonical `@/lib/cn` and migrate styles to semantic token classes.
2. Use a button trigger with `aria-haspopup="dialog"` and explicit dialog labelling for the popover.
3. Harden close/focus behavior with outside-pointer close, escape close, and trigger focus restoration.
4. Keep existing external API (`mode`, `value`, `onChange`, `min`, `max`, `minuteStep`) to avoid callsite churn.
5. Add dedicated unit tests for key date and datetime interaction flows.

Options considered:

1. Keep existing implementation and apply only visual restyling.
2. Tighten semantics/behavior and validate via focused tests.

Consequences:

- Date picker behavior is more predictable for keyboard users and assistive technology.
- Styling is aligned with token-first standards used by other overhauled primitives.
- Tracker metrics updated (`20` components with dedicated tests).

## ADR-019 - Foundation Input Primitive Test Completion (Accepted 2026-02-16)

Context:

Phase 1 still had missing dedicated tests for `InputChrome`, `TextField`, and `TextArea`, leaving high-usage form primitives under-protected compared with other overhauled components.

Decision:

1. Add dedicated unit tests for `InputChrome`, `TextField`, and `TextArea`.
2. Validate critical interaction contracts:
   - `InputChrome`: shell/addon rendering and error/disabled states
   - `TextField`: registration+external `onChange` wiring, clearable behavior, password reveal toggle
   - `TextArea`: counter behavior, registration+external `onChange` wiring, addon rendering
3. Normalize these primitives to canonical `@/lib/cn` import paths.
4. Keep external props contracts unchanged to avoid callsite migration.

Options considered:

1. Defer primitive tests and continue only with display-tier components.
2. Close the Phase 1 testing gap now before moving deeper into Phase 3.

Consequences:

- Phase 1 primitive testing gap is closed.
- Form foundation components now have dedicated regression coverage aligned with portfolio-grade standards.
- Tracker metrics updated (`23` components with dedicated tests).

## ADR-020 - Display Utility Component Hardening and Test Coverage (Accepted 2026-02-16)

Context:

Several display-tier utilities (`ErrorMessage`, `EmptyDataIndicator`, `IconLabel`, `FullScreenSpinner`) still lacked dedicated tests and contained style/semantic inconsistencies.

Decision:

1. Standardize component internals on canonical utilities/imports and token-aligned styles.
2. Improve accessibility semantics:
   - `ErrorMessage`: explicit alert behavior only when message exists
   - `EmptyDataIndicator`: semantic empty-state section and non-tooltip misuse cleanup
   - `FullScreenSpinner`: `role="status"` with polite loading announcement
3. Keep existing external APIs stable to avoid feature-level churn.
4. Add dedicated unit tests for all four components.

Options considered:

1. Defer utility components and focus only on remaining naming cleanup.
2. Close display utility quality gaps now while momentum on tests is high.

Consequences:

- Display utilities now meet the same testability and semantics baseline as overhauled interaction primitives.
- Error/loading/empty-state presentation is more consistent with token-first standards.
- Tracker metrics updated (`27` components with dedicated tests).

## ADR-021 - Sort Controls and Skeleton Naming Standardization (Accepted 2026-02-16)

Context:

`SortChip` and `SortChipGroup` still had inconsistent styling/import patterns, and `SekeletonLoader` remained misspelled in file path and imports.

Decision:

1. Standardize `SortChip` with semantic token-based active/inactive states and explicit pressed semantics.
2. Standardize `SortChipGroup` with explicit group labeling and keep sortable-column-only chip rendering.
3. Rename `SekeletonLoader.tsx` to `SkeletonLoader.tsx` and migrate app callsites to the corrected path.
4. Add/refresh unit tests for sort controls and skeleton loader behavior.

Options considered:

1. Keep current sort controls and only rename the skeleton file.
2. Address sort controls and naming cleanup in a single Phase 3 closure slice.

Consequences:

- Sort controls now align with the same token/semantics baseline as other overhauled utilities.
- Naming inconsistency for skeleton loader is resolved across UI and app callsites.
- Tracker metrics updated (`28` components with dedicated tests).

## ADR-022 - DataLabel Closure and Canonical Import Cleanup (Accepted 2026-02-16)

Context:

`DataLabel` was the remaining tracker item in Phase 3, and a small set of UI primitives still used non-canonical `@/src/lib/cn` imports.

Decision:

1. Standardize `DataLabel` internals with canonical utility import and token-consistent title/value styling.
2. Ensure primitive value rendering is explicit for boolean values (`True`/`False`) to avoid React falsey-render ambiguity.
3. Clean remaining `@/src/lib/cn` imports in UI primitives (`Button`, `FormField`, `CategorySelect`, `ColorField`, `DataLabel`) to canonical `@/lib/cn`.
4. Keep public component APIs unchanged.

Options considered:

1. Mark `DataLabel` done without touching residual import drift.
2. Close `DataLabel` and resolve remaining style-consistency drift in the same slice.

Consequences:

- Phase 3 tracker now has no remaining component-level “Not Started” items.
- Canonical import consistency across UI primitives is improved.
- Test-count metrics remain unchanged (`28` components with dedicated tests).

## ADR-023 - Phase 4 Closure Gates and Tier Test Minimum (Accepted 2026-02-18)

Context:

All tracked UI components reached `Done` status, but initiative closure required explicit quality-gate evidence and a durable tier-based test minimum policy.

Decision:

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

Options considered:

1. Close initiative based only on tracker `Done` status.
2. Require explicit gate evidence and closure documentation.

Consequences:

- Closure status is auditable with concrete gate outputs.
- Test expectations remain clear for future component work.
- Initiative can transition cleanly from execution to maintenance mode.

## ADR-024 - MetricCategoryMobileCard Stale-Render Guard and Native Button Semantics (Accepted 2026-02-18)

Context:

`MetricCategoryMobileCard` used a custom `memo` comparator that only compared `category.id`, which could skip rerenders when other fields changed. It also implemented interactive behavior on a `div` with `role="button"`.

Decision:

1. Keep memoization, but remove the custom comparator and use default `memo` behavior.
2. Use a native `button` trigger for interaction semantics.
3. Keep current routing fallback and optional parent `onClick` contract.
4. Add regression tests for keyboard activation and same-id field updates.

Options considered:

1. Keep current comparator and patch around stale-state risks in parent callers.
2. Replace comparator and harden behavior directly in the component.

Consequences:

- Prevents stale name/color/count rendering for same-id updates.
- Improves semantic interaction behavior without API break.
- Locks behavior with dedicated tests.

## ADR-025 - MetricCategory Table Stack Contract and Test Hardening (Accepted 2026-02-18)

Context:

The metric category table stack (`MetricCategoryDesktopTable`, `MetricCategoryMobileTable`, `MetricCategoryTable`) had legacy alias drift, weak prop typing around sorting, and no dedicated regression tests.

Decision:

1. Standardize shared table config typing for sort contract:
   - `sortBy: keyof MetricCategoryVM`
   - `onSort: (column: keyof MetricCategoryVM) => void`
2. Harden desktop table behavior:
   - Add accessible color-cell text (`sr-only`) and date fallback guard for invalid timestamps.
   - Add explicit `ariaLabel` and empty-state message on table primitive.
3. Harden mobile table behavior:
   - Add semantic section/list structure.
   - Replace hard-coded action colors with token-based classes (`bg-status-info`, `bg-status-error`).
   - Add semantic empty-state status message.
4. Add dedicated tests for desktop table, mobile table, and composition wiring.

Options considered:

1. Keep the existing table stack and only patch visible styling.
2. Tighten contract, semantics, and regression coverage in one focused slice.

Consequences:

- Sort and callback contracts are clearer and easier to reuse safely.
- Mobile/desktop table semantics align with current accessibility/token standards.
- Feature-level component coverage improves with dedicated tests (`+3` suites, `+9` tests).

## ADR-026 - MetricCategoryForm Contract Cleanup and Flow Coverage (Accepted 2026-02-18)

Context:

`MetricCategoryForm` still carried legacy alias imports, non-tokenized style literals, and lacked dedicated regression tests for create/update/delete flow behavior.

Decision:

1. Add explicit client boundary and align imports with canonical aliases (`@/lib/cn`, hooks barrel path).
2. Tighten form typing to `MetricCategoryFormInput` and simplify submit wiring while preserving existing external props (`onClose`, `initialCategory`).
3. Remove console logging in mutation failure paths and rely on hook-provided error state for UI messaging.
4. Improve accessibility/semantics and UX copy:
   - Mode-aware modal titles (`Add Category` / `Edit Category`)
   - Correct domain CTA text (`Delete Category`)
   - Better icon placeholder and color field label
   - Valid layout containers instead of list-only wrappers
5. Add dedicated tests for:
   - create flow
   - update flow
   - delete flow
   - mutation error banner rendering
   - close/reset behavior

Options considered:

1. Keep existing form and defer testing until feature-level integration tests are added.
2. Harden the component now with direct unit-level regression coverage.

Consequences:

- Form behavior is more predictable and easier to audit at component level.
- Style/semantics are aligned with current token and accessibility standards.
- Feature-level component coverage improves (`+1` suite, `+5` tests).

## ADR-027 - CategoryChip Color/Contrast and Accessibility Hardening (Accepted 2026-02-18)

Context:

`CategoryChip` still depended on legacy alias imports, used a generic accessibility label, and had no direct regression tests. Its contrast logic used raw category color rather than the actual rendered tinted background.

Decision:

1. Standardize imports to canonical aliases (`@/features/...`, `@/lib/cn`).
2. Preserve external API and current variant contract (`primary`, `secondary`), but harden internals:
   - Convert category hex colors into explicit `rgba(...)` tinted backgrounds.
   - Compute text contrast against rendered background with `pickTextColor`.
3. Improve semantics:
   - Expose category-specific label (`Category <name>`)
   - Mark icon as decorative in primary variant.
4. Add dedicated component tests for variant behavior, tint rendering, fallback styling, and className merging.

Options considered:

1. Keep existing component and defer to future generic `Badge` primitive migration.
2. Harden current `CategoryChip` now, then migrate later if needed.

Consequences:

- Category chips are more predictable in contrast behavior and accessibility naming.
- Legacy alias drift is reduced in metric-category feature components.
- Feature-level component coverage improves (`+1` suite, `+5` tests).

## ADR-028 - MetricLog Table Stack Contract and Accessibility Hardening (Accepted 2026-02-18)

Context:

The metric-log table stack (`LogDesktopTable`, `LogMobileTable`, `LogMobileCard`, `LogTable`) still used legacy alias imports, string-typed sort props, hard-coded swipe action colors, and lacked dedicated component-level regression tests. `LogMobileCard` also contained a broken `aria-label` reference to an undefined variable.

Decision:

1. Standardize log-table sort contract in shared config:
   - `sortBy: keyof MetricLogVM`
   - `onSort: (column: keyof MetricLogVM) => void`
   - include `mobileClassName` directly in shared table props.
2. Harden desktop table behavior:
   - Add invalid-date fallback handling.
   - Add explicit `ariaLabel` and empty-state message.
3. Harden mobile table behavior:
   - Use semantic `section` + list structure.
   - Replace hard-coded action colors with semantic token classes.
   - Add semantic empty-state status message.
4. Harden `LogMobileCard`:
   - Use native button semantics.
   - Fix `aria-label` bug to use formatted `loggedAt`.
   - Normalize display names.
5. Add dedicated tests for desktop table, mobile card, mobile table, and composition wiring.

Options considered:

1. Patch only the `aria-label` bug and defer broader refactor.
2. Harden the entire log-table stack in one cohesive slice.

Consequences:

- Log table behavior is more consistent with existing component standards.
- Mobile log actions and card interactions now align with tokenized semantics.
- Feature-level component coverage improves (`+4` suites, `+11` tests).

## ADR-029 - Metrics Table Stack Contract and Regression Hardening (Accepted 2026-02-26)

Context:

The metrics table stack (`MetricDesktopTable`, `MetricMobileTable`, `MetricLibraryMobileCard`, `MetricTable`) still had legacy alias drift, weak sort typing, and hard-coded mobile action colors. `MetricLibraryMobileCard` also used a custom memo comparator that could skip rerenders when same-id fields changed.

Decision:

1. Standardize sort contract in shared metrics table config:
   - `sortBy: keyof MetricPreviewVM`
   - `onSort: (column: keyof MetricPreviewVM) => void`
   - use `METRIC_SORT_KEYS` as sortable-key source.
2. Harden desktop table behavior:
   - Add explicit `ariaLabel` and empty-state message.
   - Keep className forwarding consistent with shared table primitive.
3. Harden mobile table behavior:
   - Use semantic `section` + `ul/li` structure.
   - Replace hard-coded action colors with semantic token classes.
   - Add semantic empty-state status message.
4. Harden `MetricLibraryMobileCard`:
   - add explicit `"use client"` boundary.
   - use native button semantics for interaction.
   - remove custom memo comparator and use default `memo` behavior.
5. Add/refresh dedicated tests for desktop/mobile/composition wiring and same-id rerender regression.

Options considered:

1. Patch only type issues and defer semantics/tests to later slices.
2. Harden metrics table stack end-to-end in one cohesive slice.

Consequences:

- Metrics table components now align with existing token, accessibility, and typing standards.
- Same-id stale-render risk is removed from mobile metric cards.
- Feature-level component coverage improves (`+3` new suites, refreshed card regression tests).

## ADR-030 - MetricForm and Dialog Standardization (Accepted 2026-02-26)

Context:

`MetricForm` still carried non-canonical imports, console logging in mutation catch paths, and layout/styling drift from the updated feature-form baseline. Duplicate-name validation also used `watch` directly and triggered compiler/lint warnings. `MetricFormDialog` had no dedicated unit coverage for modal-close navigation behavior.

Decision:

1. Standardize `MetricForm` imports and semantics:
   - canonical imports (`@/lib/cn`, `@/features/metrics/hooks`)
   - dynamic form modal title (`Add Metric` / `Edit Metric`)
   - responsive form spacing and tokenized input shell (`bg-surface2`)
2. Harden duplicate-name validation:
   - use `useWatch` + debounced value instead of direct `watch`
   - preserve edit-mode self-id conflict exclusion
3. Remove console logging from submit/delete catch branches and rely on hook error state for UI messaging.
4. Keep `MetricFormDialog` close flow (`back()` then deferred `refresh()`), but stabilize callback handling.
5. Add dedicated `MetricFormDialog` unit tests for prop passthrough and close navigation behavior.

Options considered:

1. Patch only lint/compiler warnings and leave form semantics unchanged.
2. Align form + dialog behavior with the same standards used in other overhauled feature forms.

Consequences:

- Metrics form behavior now aligns with the established feature-form baseline.
- Duplicate-check logic avoids compiler warning paths and remains functionally equivalent.
- Dialog close behavior is now covered by targeted regression tests (`+1` suite, `+2` tests).
