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

## ADR-031 - TimeRangePicker State and Validation Hardening (Accepted 2026-02-26)

Context:

`TimeRangePicker` still held duplicated local mode state, had brittle relative input handling for invalid/partial values, and lacked dedicated unit regression coverage for mode transitions and absolute date updates.

Decision:

1. Remove duplicated local mode state and treat range mode as controlled by `value.mode`.
2. Keep relative input free-typing UX, but harden emitted values:
   - normalize (`trim` + lowercase) before emit
   - emit only when matching `RelativeLast` contract
   - reset invalid draft on blur to current/fallback valid value
3. Standardize mode switching behavior:
   - relative->absolute emits a default rolling 30-day absolute range
   - absolute->relative emits validated relative fallback (`30d`)
4. Add safe datetime-local conversion helpers for absolute start/end updates.
5. Add dedicated component tests for relative validation, mode transitions, and absolute field updates.

Options considered:

1. Keep current implementation and only clean class/style markup.
2. Harden interaction/state contract and cover behavior with dedicated tests in one slice.

Consequences:

- Time range picker behavior is now deterministic across mode and input transitions.
- Relative/absolute conversion paths are easier to reason about and less error-prone.
- Feature-level component coverage improves (`+1` suite, `+6` tests).

## ADR-032 - MetricSettings Form Contract and Dialog Hardening (Accepted 2026-02-26)

Context:

`MetricSettingsForm` still carried legacy alias imports, compiler warnings caused by render-time `watch(...)` usage, and console side effects in mutation catch paths. Its shell styling also drifted from the tokenized form baseline. `MetricSettingsFormDialog` lacked dedicated unit coverage for close navigation behavior.

Decision:

1. Standardize `MetricSettingsForm` imports and baseline contract:
   - canonical utility/hooks imports (`@/lib/cn`, `@/features/metric-settings/hooks`)
   - dynamic modal title by mode (`Add Metric Settings` / `Edit Metric Settings`)
2. Replace render-time `watch(...)` checks with `useWatch(...)` values for conditional sections:
   - `goalEnabled`
   - `timeFrameEnabled`
   - `alertEnabled`
   - `displayOptions.showOnDashboard`
3. Remove console logging in submit catch paths and keep hook-driven error UI as source of truth.
4. Align form shell and subsection styling to token classes and responsive modal layout constraints.
5. Harden dialog close callback and add dedicated unit tests for:
   - prop passthrough
   - `back()` + deferred `refresh()` behavior

Options considered:

1. Patch only compiler warning hotspots and keep existing form/dialog structure.
2. Align settings form/dialog with the same standards used across the overhauled feature forms.

Consequences:

- Metric settings form behavior is clearer and avoids compiler warning paths from render-time watchers.
- Styling and modal layout align better with the current tokenized component baseline.
- Feature-level component coverage improves (`+1` new suite, `+2` tests).

## ADR-033 - MetricLog Form and Dialog Baseline Alignment (Accepted 2026-02-26)

Context:

`LogForm` still had mixed import conventions (`@/components/ui` + `@/ui`), hard-coded styling drift, and console side effects in submit/delete catch blocks. `MetricLogFormDialog` did not yet have dedicated regression tests for close navigation behavior.

Decision:

1. Standardize `LogForm` imports to canonical paths:
   - UI primitives from `@/ui/...`
   - hooks from `@/features/metric-logs/hooks`
2. Align form behavior with the established form baseline:
   - tokenized field shell styling
   - modal title via modal contract (remove duplicated heading)
   - remove redundant invalid-state banner text
   - fix destructive CTA copy to `Delete Log`
3. Remove console side effects in mutation catch paths and rely on hook-level error state for user-facing feedback.
4. Stabilize `MetricLogFormDialog` close callback (`back()` then deferred `refresh()`).
5. Add dedicated dialog unit tests for prop passthrough and close navigation behavior.

Options considered:

1. Keep `LogForm` as-is and only patch copy/import drift.
2. Align the full form/dialog slice to the same quality baseline as other overhauled feature forms.

Consequences:

- Metric log form behavior and styling now match the feature-form baseline.
- Error handling path is cleaner and easier to reason about.
- Feature-level component coverage improves (`+1` new suite, `+2` tests).

## ADR-034 - GranularityPicker Prop Contract and Coverage Hardening (Accepted 2026-02-26)

Context:

`GranularityPicker` is used by visualization controls but had no dedicated unit coverage. Its prop spread behavior also allowed `className` overrides to replace core styles unexpectedly.

Decision:

1. Keep the existing public contract (`value`, `onChange`, native select props), but explicitly handle:
   - `className` through `cn(...)` merge
   - `aria-label` with a stable default (`Granularity`)
2. Preserve native prop pass-through (`disabled`, `data-*`, etc.) without style contract regressions.
3. Add dedicated unit tests for options, change callbacks, label/class handling, and native prop passthrough.

Options considered:

1. Leave component unchanged and rely on visualization-level tests.
2. Harden the component contract directly and add focused component-level tests.

Consequences:

- Granularity control styling and accessibility behavior are more predictable.
- Regression coverage is now component-local (`+1` suite, `+4` tests).

## ADR-035 - MetricChart Typing and Empty-State Hardening (Accepted 2026-02-26)

Context:

`MetricChart` still used a legacy utility import path and lacked dedicated component-level tests. Dataset typing relied on repeated unsafe casts, and goal rendering behavior was loosely guarded (`goalValue != null` rather than finite checks).

Decision:

1. Standardize utility imports and wrapper contract:
   - use canonical `@/lib/cn`
   - support optional `className` passthrough
2. Improve empty-state semantics:
   - render empty chart state with `role="status"` + `aria-live="polite"`
   - align empty-state text style with semantic token classes
3. Tighten dataset behavior:
   - use `ScatterDataPoint[]` for metric/goal dataset construction
   - render goal dataset only when goal value is finite
   - tie legend visibility to actual goal dataset presence
4. Add dedicated `MetricChart` unit tests for empty state, dataset wiring, goal behavior, and tooltip formatting.

Options considered:

1. Keep current component and rely on `Visualization` integration tests only.
2. Harden `MetricChart` directly and add isolated tests for predictable chart contract behavior.

Consequences:

- Chart behavior is more explicit and safer around missing/invalid goal values.
- Component-level coverage improves (`+1` suite, `+5` tests).

## ADR-036 - MetricForm Duplicate-Name Regression Coverage (Accepted 2026-02-26)

Context:

`MetricForm` duplicate-name validation depends on a debounced async lookup path. Core behavior was hardened previously, but test coverage did not explicitly prove that duplicate-name conflicts block submission end-to-end.

Decision:

1. Add a dedicated integration test for duplicate-name flow:
   - mock `/metrics` duplicate lookup response
   - assert conflict message is rendered
   - assert submit stays blocked and create mutation is not called
2. Stabilize async settling in the integration suite to absorb debounce-driven updates and avoid act warnings.
3. Keep component runtime behavior unchanged; this slice is a coverage hardening pass.

Options considered:

1. Leave coverage as-is and rely on unit-level duplicate-check assumptions.
2. Add explicit integration regression coverage for the debounce + async lookup behavior.

Consequences:

- Duplicate-name protection in metric creation is now protected by integration-level regression tests.
- Future refactors around debounce/query wiring have a direct safety net.

## ADR-037 - MetricLogForm Delete-Flow Regression Coverage (Accepted 2026-02-26)

Context:

`LogForm` integration coverage already validated create/update/error flows, but did not explicitly protect the edit-mode delete path.

Decision:

1. Add an integration test for delete flow in `LogForm.int.test.tsx` to assert:
   - delete endpoint is called with the expected log id
   - form closes on successful deletion
2. Keep runtime component behavior unchanged; this is a coverage-only polish pass.

Options considered:

1. Keep coverage focused on create/update only.
2. Extend integration suite to include delete behavior as a first-class regression path.

Consequences:

- Delete behavior for metric logs is now protected by integration-level regression coverage.
- Form flow quality gates are more balanced across create/update/delete paths.

## ADR-038 - Visualization URL-State Regression Coverage Completion (Accepted 2026-02-26)

Context:

`Visualization` already had baseline unit coverage, but lacked explicit regression checks for invalid URL fallback behavior, stale absolute param cleanup when switching to relative mode, and no-data rendering after non-loading responses.

Decision:

1. Extend `Visualization` unit tests to validate:
   - invalid URL query values fallback to default bucket/range state
   - absolute->relative range transitions clear stale `start`/`end` params
   - no-data state rendering when fetch completes without chart payload
2. Apply minor test hygiene cleanup (shared constants) to reduce duplicate-string drift.
3. Keep runtime component logic unchanged; this slice is a coverage-completion pass.

Options considered:

1. Leave existing coverage as-is and rely on integration-level behavior.
2. Add focused unit regressions for URL-state edge cases inside `Visualization`.

Consequences:

- URL-state edge cases are now directly protected by component-level regression tests.
- Visualization test suite now covers primary loading/data/no-data/fallback state transitions more completely.

## ADR-039 - TimeRangePicker Edge-Case Coverage Completion (Accepted 2026-02-26)

Context:

`TimeRangePicker` had solid baseline coverage, but still lacked targeted tests for unchanged mode selection behavior, parent-driven relative input sync, className passthrough, and invalid absolute-start input handling.

Decision:

1. Add focused unit tests for:
   - no-op when selecting current mode
   - relative input sync after parent value change
   - root className passthrough
   - invalid absolute start input emitting empty start while preserving end
2. Tighten effect dependency in component sync logic from `[value]` to `[value.mode, value.last]`.
3. Keep runtime API unchanged; this slice is a polish + coverage completion pass.

Options considered:

1. Keep existing tests and accept partial edge-case coverage.
2. Complete edge-case coverage now to protect future refactors around range sync behavior.

Consequences:

- TimeRangePicker now has more complete contract coverage around state-sync and no-op transitions.
- Sync effect dependencies are more explicit, reducing accidental rerun drift.

## ADR-040 - MetricChart Cast Removal and Contract Coverage Completion (Accepted 2026-03-02)

Context:

`MetricChart` was already functionally hardened, but still had a few unsafe cast paths in dataset and tooltip parsing. Coverage also did not explicitly protect className passthrough and blank-unit fallback behavior.

Decision:

1. Remove remaining unsafe casts in chart data flow:
   - map chart points through an explicit scatter-point helper
   - parse tooltip `raw` values through a dedicated finite-number guard
2. Keep goal-line behavior guarded to valid numeric finite values only.
3. Treat blank/whitespace unit values as unitless display:
   - fallback dataset label to `Value`
   - keep tooltip output trimmed when no unit is present
4. Extend `MetricChart` unit tests for:
   - chart root className passthrough
   - empty-state className passthrough
   - `raw: null` tooltip fallback
   - blank-unit dataset label and tooltip formatting behavior

Options considered:

1. Keep existing tests and leave remaining cast paths in place.
2. Complete the component contract hardening with explicit helpers and targeted regression tests.

Consequences:

- Dataset and tooltip value handling are easier to reason about and safer under refactors.
- `MetricChart` contract coverage is now more complete for styling and unit-label edge cases.

## ADR-041 - MetricSettingsForm Goal-Type Default State Hardening (Accepted 2026-03-02)

Context:

In `MetricSettingsForm`, enabling `goalEnabled` could render `Goal Type` as visually selected (`Incremental`) while the underlying form value still remained `null`. This made the form appear valid to users while schema validation still rejected submit until goal type was explicitly re-selected.

Decision:

1. Add explicit state sync in `MetricSettingsForm`:
   - when `goalEnabled` becomes true and `goalType` is null, set `goalType` to `"incremental"` with validation.
2. Add integration regression coverage to prove the contract:
   - enabling goal + entering `goalValue` submits successfully without manual goal-type reselection
   - payload includes `goalType: "incremental"`
3. Apply small test hygiene cleanup by extracting repeated API endpoint literals into a shared constant.

Options considered:

1. Keep current behavior and require users to manually re-select goal type.
2. Sync default goal type into form state to match visible UI selection and validate predictably.

Consequences:

- Goal settings UX and schema behavior are now aligned.
- Regression coverage now protects this high-friction conditional validation path.

## ADR-042 - MetricCategoryForm Reset/Delete Regression Coverage Completion (Accepted 2026-03-02)

Context:

`MetricCategoryForm` had baseline success-path coverage, but still lacked explicit regressions for two edge contracts: prop-driven default reset behavior and delete-failure modal behavior.

Decision:

1. Add a rerender regression test to confirm form defaults reset when `initialCategory` changes.
2. Add delete-failure regression coverage to confirm modal close is not triggered when deletion rejects.
3. Keep runtime component implementation unchanged; this slice is coverage completion.

Options considered:

1. Keep existing success-path-only coverage.
2. Expand tests to cover prop-transition and destructive-error contracts explicitly.

Consequences:

- Category form behavior is now better protected against subtle state-sync and destructive-flow regressions.
- Test coverage now reflects both optimistic and failure-path expectations for delete interactions.

## ADR-043 - LogForm Guardrail Coverage Completion (Accepted 2026-03-02)

Context:

`LogForm` already had integration coverage for create/update/delete success and create failure, but still lacked explicit guardrail tests for missing `metricId` rendering and delete-failure modal behavior.

Decision:

1. Extend `LogForm` integration tests to verify no-`metricId` guard behavior:
   - guard message renders
   - submit CTA does not render
2. Extend delete failure coverage to verify:
   - error alert is shown on failed delete request
   - `onClose` is not called (modal stays open)
3. Improve test hygiene by centralizing repeated log endpoint literals into a shared constant.

Options considered:

1. Keep current coverage and rely on existing success-path assertions.
2. Add explicit guardrail regressions for early-return and destructive error paths.

Consequences:

- Log form behavior is now better protected on non-happy paths.
- Integration suite coverage is more balanced across success, validation guard, and destructive failure flows.

## ADR-044 - MetricForm Delete-Flow Integration Coverage Completion (Accepted 2026-03-02)

Context:

`MetricForm` integration tests already covered create/update success and create failure, but lacked explicit edit-mode delete success/failure regression checks.

Decision:

1. Add delete success integration coverage in `MetricForm.int.test.tsx` to verify:
   - delete endpoint receives the expected metric id
   - modal closes on successful deletion
2. Add delete failure integration coverage to verify:
   - error alert is rendered when delete fails
   - modal does not close (`onClose` remains uncalled)
3. Keep runtime component behavior unchanged; this slice focuses on test-hardening symmetry across destructive flows.

Options considered:

1. Keep existing coverage and rely on hook-level assumptions for delete behavior.
2. Add explicit component-integration regressions for delete success and failure.

Consequences:

- Edit-mode destructive flow is now protected by integration-level regression tests.
- Metric form coverage is more balanced across create, update, and delete contracts.

## ADR-045 - TimeRangePicker Invalid-ISO Rendering Guard (Accepted 2026-03-02)

Context:

`TimeRangePicker` absolute mode converts ISO strings into `datetime-local` values through `toLocal(...)`. Invalid upstream ISO strings could produce `NaN-NaN-...` output, resulting in unstable input rendering.

Decision:

1. Harden `toLocal(...)` with explicit invalid-date guard:
   - return empty string when parsed date is not finite.
2. Add dedicated regression coverage for invalid absolute ISO input values:
   - both `Start` and `End` render as empty strings when values are invalid.
3. Keep external component API unchanged; this is a stability hardening pass.

Options considered:

1. Keep current conversion behavior and rely on parent normalization only.
2. Make `TimeRangePicker` resilient to malformed parent input values.

Consequences:

- Absolute datetime-local inputs now fail-safe on malformed upstream ISO values.
- Rendering contract is more robust under partial/migrating state or API inconsistency.

## ADR-046 - MetricSettingsForm Update-Failure and Prop-Reset Regression Coverage (Accepted 2026-03-02)

Context:

`MetricSettingsForm` had baseline integration coverage for create/update success and create failure, but lacked explicit checks for update failure behavior and prop-transition reset stability when `initialSettings` changes.

Decision:

1. Extend integration coverage to assert update failure contract:
   - error alert is rendered
   - modal remains open (`onClose` is not called)
2. Extend integration coverage to assert prop-reset contract:
   - rerender with new `initialSettings` updates rendered default values (`goalValue`, `alertThresholds`)
3. Keep runtime component behavior unchanged; this is a stability regression coverage pass.

Options considered:

1. Keep existing coverage and rely on create-failure behavior as proxy.
2. Add explicit update-failure and rerender-reset regressions.

Consequences:

- Metric settings form now has stronger integration safety around non-happy update flows.
- Prop-transition form-state reset behavior is explicitly protected from regressions.

## ADR-047 - MetricChart Runtime-Safety Normalization (Accepted 2026-03-02)

Context:

`MetricChart` already had strong baseline coverage, but two runtime-safety edges remained:

1. non-finite datapoints (`Infinity`) could flow into chart datasets directly
2. unit formatting assumed `meta.unit` is always a string at runtime

Decision:

1. Sanitize scatter datapoint y-values before render:
   - non-finite numbers normalize to `NaN`
2. Normalize unit handling with a defensive runtime helper:
   - non-string unit values resolve to empty string
   - dataset label fallback remains `Value`
   - tooltip formatting uses normalized unit
3. Extend unit tests to cover both non-finite datapoint and non-string unit scenarios.

Options considered:

1. Keep prior typing-only assumptions and rely on upstream API correctness.
2. Add component-level runtime normalization for resilience against malformed payloads.

Consequences:

- Chart rendering contract is more resilient to malformed payload data.
- Tooltip and dataset label behavior are now safer under runtime type drift.

## ADR-048 - MetricForm Update-Failure and Prop-Reset Stability Coverage (Accepted 2026-03-02)

Context:

`MetricForm` integration coverage already protected create/update/delete success plus create/delete failures, but did not yet include update-failure handling or prop-transition reset behavior when `initialMetric` changes during rerender.

Decision:

1. Add update-failure regression coverage in `MetricForm.int.test.tsx`:
   - failed update renders alert
   - modal remains open (`onClose` not called)
2. Add prop-reset regression coverage:
   - rerender with a different `initialMetric` updates displayed defaults (`name`, `defaultUnit`, `description`)
3. Keep runtime component logic unchanged; this is a stability/coverage completion pass.

Options considered:

1. Keep existing integration coverage and rely on create/delete failure as proxy for update behavior.
2. Add explicit update-failure and rerender-reset regressions.

Consequences:

- Metric form edit-mode failure handling now has direct regression protection.
- Prop-driven reset behavior is explicitly protected against stale state regressions.

## ADR-049 - LogForm Update-Failure and Prop-Reset Stability Coverage (Accepted 2026-03-02)

Context:

`LogForm` integration coverage already included create/update/delete success plus create/delete failures, but lacked update-failure coverage and explicit rerender reset protection when `initialLog` changes.

Decision:

1. Add update-failure regression coverage in `LogForm.int.test.tsx`:
   - failed update renders alert
   - modal remains open (`onClose` not called)
2. Add prop-reset regression coverage:
   - rerender with a different `initialLog` updates displayed `logValue` default
3. Keep runtime component logic unchanged; this is a stability/coverage completion pass.

Options considered:

1. Keep existing coverage and infer update-failure behavior from other failure tests.
2. Add dedicated update-failure and rerender-reset regressions for log edit mode.

Consequences:

- Log form update failure path now has direct integration-level regression safety.
- Rerender-state synchronization behavior is explicitly protected in tests.

## ADR-050 - TimeRangePicker Absolute-End Invalid Input Regression Symmetry (Accepted 2026-03-02)

Context:

`TimeRangePicker` already had regression coverage for invalid absolute-start input handling, but did not yet explicitly protect the equivalent invalid absolute-end input path.

Decision:

1. Add dedicated unit regression for invalid absolute-end local datetime input:
   - emitted value normalizes to `end: ""`
   - existing absolute `start` value remains preserved
2. Keep component runtime behavior unchanged; this is a coverage-symmetry completion pass.
3. Apply a minor test-hygiene improvement by centralizing repeated absolute-start ISO literal into a constant.

Options considered:

1. Keep current coverage focused on invalid-start behavior only.
2. Add symmetric invalid-end coverage to fully protect absolute input normalization contract.

Consequences:

- Absolute-mode invalid-input behavior is now symmetrically covered for both start and end fields.
- TimeRangePicker regression suite is more complete and less brittle.

## ADR-051 - MetricSettingsForm Missing-MetricId Runtime Guard (Accepted 2026-03-02)

Context:

`MetricSettingsForm` accepted a required `metricId` prop at type level, but lacked runtime guard behavior when an empty id value is passed from route/context edge cases. Similar forms in the codebase already fail-safe on missing required parent identifiers.

Decision:

1. Add explicit runtime guard in `MetricSettingsForm`:
   - if `metricId` is empty, render a clear status error message
   - skip rendering form controls and submit actions
2. Add integration regression coverage:
   - guard message renders for empty `metricId`
   - add/save submit controls are absent under guard path
3. Keep normal create/edit flow unchanged for valid ids.

Options considered:

1. Keep current behavior and rely on route-level assumptions for non-empty ids.
2. Add component-level defensive guard for fail-safe behavior.

Consequences:

- Metric settings form now fails safely under missing-id runtime edge cases.
- Behavior is more consistent with other form components that depend on required parent entity ids.

## ADR-052 - MetricChart MetricId Label Normalization (Accepted 2026-03-02)

Context:

`MetricChart` already normalized runtime unit and datapoint values, but chart `aria-label` still assumed `meta.metricId` is always a non-empty string.

Decision:

1. Normalize runtime `metricId` before composing `aria-label`.
2. Fallback to `unknown metric` when `metricId` is empty/non-string.
3. Add dedicated regression test for non-string `metricId` fallback behavior.

Options considered:

1. Keep typed assumption and rely on upstream payload integrity.
2. Add defensive runtime normalization for accessibility label stability.

Consequences:

- Chart accessibility label now remains stable under malformed payload conditions.
- Runtime-safety handling is more consistent across chart metadata fields.

## ADR-053 - Visualization URL-Driven State Source (Accepted 2026-03-02)

Context:

`Visualization` controls used local state initialized from URL params, which could drift when query params changed externally after initial render.

Decision:

1. Use URL params as source-of-truth for control state:
   - derive `bucket` and `range` directly from `useSearchParams`
   - remove local state + sync-effect state path
2. Keep picker interaction contract unchanged:
   - picker changes still update query via `router.replace(...)`
3. Add regression coverage for post-initial URL param changes.

Options considered:

1. Keep local state and synchronize from URL in effects.
2. Make URL query the canonical visualization control state.

Consequences:

- Visualization control state now tracks navigation/query changes reliably.
- Reduced local state complexity and removed effect-driven sync churn risk.

## ADR-054 - TimeRangePicker Relative-Range Restoration Parity (Accepted 2026-03-02)

Context:

`TimeRangePicker` absolute->relative transitions defaulted to `30d` when relative input was unmounted, even after users previously selected a valid relative value. This caused inconsistent range continuity across mode toggles.

Decision:

1. Track last valid relative value in a dedicated ref (`lastRelativeRef`).
2. Update the ref when:
   - controlled relative value changes from parent
   - valid relative input edits/blur normalization occur
3. Use tracked last valid value on absolute->relative transition before falling back to defaults.
4. Add regression test for relative->absolute->relative restoration behavior.

Options considered:

1. Keep always-default-to-`30d` transition behavior.
2. Restore last valid relative user choice across mode toggles.

Consequences:

- Mode toggles now preserve relative-range continuity more predictably.
- TimeRangePicker transition behavior is more user-consistent and regression-protected.

## ADR-055 - MetricSettingsForm Goal-Type Toggle Continuity (Accepted 2026-03-02)

Context:

`MetricSettingsForm` unregisters conditional goal fields when goal mode is toggled off. On re-enable, goal type defaulted to `incremental`, which could overwrite a user’s prior explicit selection (e.g. `cumulative`).

Decision:

1. Track last valid goal type in a dedicated ref.
2. Restore tracked goal type when goal mode is re-enabled and form value is currently unset.
3. Add integration regression coverage for goal off/on toggle continuity.
4. Keep existing schema and submit contract unchanged.

Options considered:

1. Keep current re-enable behavior (always fallback to `incremental`).
2. Preserve user-selected goal type across temporary section toggles.

Consequences:

- Goal-type selection now remains consistent across toggle cycles.
- Metric settings UX becomes more predictable in conditional-field flows.

## ADR-056 - MetricChart Tooltip Numeric-String Parsing Parity (Accepted 2026-03-02)

Context:

`MetricChart` tooltip extraction handled numeric types but treated numeric-string values as missing. In mixed-runtime payload scenarios, values may arrive as stringified numbers.

Decision:

1. Extend tooltip value extraction to parse numeric strings:
   - support `raw` as numeric string
   - support `raw.y` as numeric string
2. Keep non-numeric strings mapped to `No data`.
3. Add regression tests for numeric-string tooltip formatting.

Options considered:

1. Keep strict numeric-only tooltip parsing.
2. Parse numeric strings defensively for runtime parity.

Consequences:

- Tooltip behavior is more resilient to runtime type drift.
- Chart labeling remains user-friendly under stringified numeric values.

## ADR-057 - Visualization Sequential URL-Sync Continuity (Accepted 2026-03-02)

Context:

After moving Visualization to URL-driven state, rapid sequential control changes (bucket then range) could emit stale bucket values before search params refreshed.

Decision:

1. Maintain latest picker intent in refs (`latestBucketRef`, `latestRangeRef`) between URL updates.
2. Synchronize refs from parsed URL state in effect.
3. Use latest refs in sync handlers to avoid stale counterpart values on rapid sequential updates.
4. Add regression test asserting updated bucket is preserved in follow-up range sync calls.

Options considered:

1. Keep handlers bound to immediately parsed URL state only.
2. Add lightweight intent refs to preserve sequential update continuity.

Consequences:

- Visualization URL updates now preserve the latest user selection across rapid control interactions.
- Behavior is closer to previous optimistic local-state parity without reintroducing heavy local state sync.

## ADR-058 - TextField Ref Composition and Disabled-Controls Parity (Accepted 2026-03-09)

Context:

`TextField` accepted `react-hook-form` `registration`, but `registration.ref` could override the component’s internal input ref. This risked breaking clear/focus behavior for clearable fields. Utility controls were also still interactive when the input was disabled.

Decision:

1. Compose internal input ref and `registration.ref` through a callback ref.
2. Compose registration and external handlers explicitly:
   - `registration.onChange` + external `onChange`
   - `registration.onBlur` + external `onBlur`
3. Make clear/reveal utility controls respect `disabled`.
4. Add dedicated regression tests for registration-ref clearability and disabled utility controls.

Options considered:

1. Keep direct prop spread and rely on caller behavior.
2. Explicitly compose refs/handlers and align utility controls with disabled semantics.

Consequences:

- Clearable `TextField` behavior remains stable with or without `registration`.
- Integration with form libraries is safer and more predictable.
- Disabled input state now consistently disables all direct field interactions.

## ADR-059 - DateTimePicker Datetime Boundary Clamp Parity (Accepted 2026-03-12)

Context:

`DateTimePicker` already constrained calendar day selection with `min`/`max`, but in `datetime` mode hour/minute controls could still emit out-of-range values on boundary days.

Decision:

1. Add `clampDateTime` helper to enforce datetime bounds before emitting values.
2. Apply clamp in both datetime emission paths:
   - calendar day commit (`commitDate`) in `datetime` mode
   - time control updates (`setTime`)
3. Ignore invalid bound values safely via date-validity checks.
4. Add regression tests for min-boundary and max-boundary clamping.

Options considered:

1. Keep date-cell-only bounds and rely on consumers to sanitize emitted values.
2. Enforce bounds at component level for all datetime emissions.

Consequences:

- `DateTimePicker` now emits datetime values consistent with declared `min`/`max` constraints.
- Consumer forms receive bounded values without extra sanitization glue.
- Boundary behavior is covered by focused regression tests.

## ADR-060 - Select Disabled-Selection Active Fallback (Accepted 2026-03-12)

Context:

`Select` initialized active index from selected value when opening. If the selected option later became disabled, keyboard commit could no-op because active state started on an unselectable option.

Decision:

1. Add `getInitialActiveIndex` helper that:
   - keeps selected index only when selected option is enabled
   - otherwise falls back to first enabled option
2. Use helper in `openList` so first keyboard commit target is always selectable when possible.
3. Add regression test for selected-disabled fallback behavior.

Options considered:

1. Keep active initialization tied directly to selected index.
2. Resolve active index against option enabled state on open.

Consequences:

- Keyboard `Enter` flow remains functional when selected option availability changes.
- Select interaction is more resilient to dynamic option-disable updates.
- Behavior is covered by focused unit regression tests.

## ADR-061 - Toggle Sequential Intent Continuity (Accepted 2026-03-12)

Context:

`Toggle` computed next state directly from render-time `checked` prop. Under rapid sequential interactions before parent rerender, consecutive clicks could emit duplicate next values instead of alternating intent.

Decision:

1. Track latest checked intent in a ref synchronized from controlled prop updates.
2. Compute click-next state from latest intent ref and update the ref optimistically before emitting.
3. Keep existing guard behavior:
   - no emit when disabled
   - no emit when caller prevents default in `onClick`
4. Add regression test for rapid sequential clicks without parent rerender.

Options considered:

1. Keep `!checked` render-time next-state computation.
2. Use intent ref to preserve sequential toggle behavior between rerenders.

Consequences:

- Toggle emits state transitions aligned with user click sequence under transient rerender latency.
- Controlled usage remains backward compatible while improving interaction robustness.
- Regression coverage now protects this edge case.

## ADR-062 - Modal Shared Scroll-Lock Coordination (Accepted 2026-03-12)

Context:

`Modal` locked and restored body scroll per instance. In stacked modal flows, closing one modal could restore body scroll while another modal remained open.

Decision:

1. Add module-level body-scroll lock coordination:
   - lock counter for active open modals
   - tracked original body overflow value before first lock
2. Lock on modal open and decrement on close.
3. Restore body overflow only when lock counter returns to zero.
4. Add regression test for stacked modal open/close behavior.

Options considered:

1. Keep instance-level overflow save/restore.
2. Coordinate body scroll lock across all open modal instances.

Consequences:

- Body scroll lock now remains correct for stacked modal scenarios.
- Existing modal API and focus behavior remain unchanged.
- Regression tests guard against premature overflow restoration.

## ADR-063 - SegmentedControl Same-Value No-Op Emission Guard (Accepted 2026-03-12)

Context:

`SegmentedControl` emitted `onChange` for already-selected values. Repeated clicks on the active option triggered unnecessary no-op updates.

Decision:

1. Add same-value guard in selection path:
   - if selected option value equals current controlled `value`, do not emit `onChange`
2. Keep existing navigation and selection behavior unchanged for actual value changes.
3. Add regression test for active-option re-selection no-op behavior.

Options considered:

1. Keep always-emit behavior and rely on parent-level deduplication.
2. Prevent no-op emissions in the component selection path.

Consequences:

- Reduced unnecessary state updates and handler churn in forms using segmented controls.
- Component behavior remains predictable and controlled-value aligned.
- Regression test protects against reintroducing no-op emissions.

## ADR-064 - Table Interactive-Element Keyboard Propagation Guard (Accepted 2026-04-01)

Context:

`Table` row click logic already ignored pointer events originating from interactive controls inside cells. However, row-level keyboard activation still reacted to bubbled `Enter`/`Space` key events from those interactive controls.

Decision:

1. Add interactive-origin guard in row `onKeyDown` handler.
2. Skip row activation when keyboard event target is inside an interactive element.
3. Keep existing row keyboard activation behavior for direct row focus.
4. Add regression test for interactive-cell keyboard events.

Options considered:

1. Keep current keyboard handling and require consumer-level event stopping.
2. Guard interaction boundaries within the table primitive, matching pointer behavior.

Consequences:

- Row activation behavior is now consistent across pointer and keyboard interactions.
- Embedded buttons/inputs inside cells no longer trigger unintended row navigation on keypress.
- Regression test prevents reintroduction of this propagation issue.

## ADR-065 - SearchInput Clear-Focus Continuity (Accepted 2026-04-01)

Context:

`SearchInput` clear actions could leave focus on the clear button (or lose focus after rerender), disrupting keyboard-first search refinement flows.

Decision:

1. Add internal input ref while preserving forwarded ref behavior.
2. After clear actions, programmatically restore focus to the input.
3. Keep clear contract unchanged:
   - call `onClear()` when provided
   - fallback to `onChange("")` when `onClear` is absent
4. Add regression tests for focus restoration in both clear paths.

Options considered:

1. Keep current behavior and rely on parent-level focus management.
2. Guarantee focus continuity within the component’s clear interaction path.

Consequences:

- Keyboard workflows remain continuous after clear interactions.
- Ref forwarding compatibility is preserved for parent integrations.
- Regression coverage protects both default clear and custom-clear callback paths.

## ADR-066 - Pagination Known-Total Boundary-First Disable Rules (Accepted 2026-04-07)

Context:

`Pagination` allowed `canPrev/canNext` flags to override known-total page bounds, which could leave first/last boundary controls enabled while transitions were clamped away.

Decision:

1. In known-total mode, boundary disable rules always apply:
   - disable previous on first page
   - disable next on last page
2. Preserve `canPrev/canNext` as additional constraints, not boundary overrides.
3. Keep cursor-mode behavior unchanged for unknown-total pagination.
4. Add regression test for known-total boundary controls with `canPrev/canNext=true`.

Options considered:

1. Keep current precedence where `canPrev/canNext` fully control disabled state.
2. Make known-total boundaries authoritative and treat flags as secondary constraints.

Consequences:

- Pagination controls now match visible capability in known-total mode.
- Boundary buttons no longer appear clickable when no transition is possible.
- Behavior is locked by dedicated regression coverage.

## ADR-067 - DateTimePicker Sequential Date-Time Continuity (Accepted 2026-04-07)

Context:

In `datetime` mode, `DateTimePicker` emitted date selection and time updates through controlled props. Immediate time edits before parent rerender could still derive from stale prior `value`, producing updates for the wrong date.

Decision:

1. Introduce internal latest-value continuity ref synchronized from controlled `value`.
2. Use latest ref as source for sequential date/time mutation paths:
   - update ref on datetime date commit
   - update ref on time selector changes
3. Keep external API and controlled contract unchanged.
4. Add regression test for immediate time edit after date selection without parent rerender.

Options considered:

1. Keep purely prop-derived base date/time logic and rely on fast parent rerender.
2. Preserve sequential picker intent locally between controlled updates.

Consequences:

- Date/time emissions remain coherent in rapid sequential interactions.
- Component remains controlled-friendly while reducing transient stale-base risk.
- Regression coverage protects this continuity path.

## ADR-068 - Select Same-Value Re-Selection No-Op Emit Guard (Accepted 2026-04-09)

Context:

`Select` emitted `onChange` even when the user selected the currently active value from the open list. This created unnecessary no-op updates in controlled forms.

Decision:

1. Add same-value guard in selection commit path.
2. On same-value selection:
   - close list
   - restore focus to trigger
   - do not emit `onChange`
3. Keep all existing behavior unchanged for actual value transitions.
4. Add regression coverage for no-op emit + close/focus continuity.

Options considered:

1. Keep current always-emit behavior and rely on parent deduplication.
2. Prevent no-op emits directly in select commit logic.

Consequences:

- Controlled consumers avoid unnecessary state churn on same-value selections.
- Menu close/focus behavior remains consistent for both no-op and real selections.
- Regression test protects against reintroducing no-op emissions.

## ADR-069 - Toggle Contract Coverage Hardening for PreventDefault and Keyboard Continuity (Accepted 2026-04-09)

Context:

`Toggle` already enforced two important interaction contracts:

1. no state emit when `onClick` prevents default
2. sequential intent continuity across rapid activations before parent rerender

These were not fully covered by regression tests, increasing risk during future refactors.

Decision:

1. Add regression tests for preventDefault no-emit behavior.
2. Add regression tests for rapid sequential keyboard activation continuity.
3. Keep runtime implementation unchanged in this slice.

Options considered:

1. Keep existing partial coverage.
2. Lock the interaction contracts with dedicated tests.

Consequences:

- Toggle interaction guarantees are now explicitly regression-protected.
- Refactors can rely on test feedback for both pointer and keyboard activation paths.
