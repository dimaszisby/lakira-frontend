# Feature Components Follow-Up

This file tracks post-closure component hardening for feature-level components outside `src/components/ui`.

## Entry 2026-02-18 - MetricCategoryMobileCard

Component:

- `src/features/metric-categories/components/MetricCategoryMobileCard.tsx`

Why this slice:

- The previous custom `memo` comparator only compared `category.id`, which could hide updates when `name`, `color`, or `metricCount` changed for the same id.
- Interaction semantics were implemented via a `div` with `role="button"` instead of a native button.

Changes applied:

1. Added explicit client boundary with `"use client"`.
2. Switched to a native `button` trigger for interaction semantics.
3. Removed fragile custom comparator and used default `memo` behavior to avoid stale field rendering.
4. Kept fallback routing contract and parent `onClick` override behavior.
5. Added/updated tests for click fallback, keyboard activation, and same-id field updates.

Validation:

1. `npx eslint src/features/metric-categories/components/MetricCategoryMobileCard.tsx src/features/metric-categories/components/__tests__/MetricCategoryMobileCard.test.tsx`
2. `npx jest src/features/metric-categories/components/__tests__/MetricCategoryMobileCard.test.tsx --runInBand`

Status:

- `Done`

## Entry 2026-02-18 - MetricCategory Table Stack

Components:

- `src/features/metric-categories/components/MetricCategoryDesktopTable.tsx`
- `src/features/metric-categories/components/MetricCategoryMobileTable.tsx`
- `src/features/metric-categories/components/MetricCategoryTable.tsx`
- `src/features/metric-categories/components/table-config.ts`

Why this slice:

- Desktop/mobile table composition still had legacy alias drift and inconsistent prop typing.
- Mobile table actions and empty-state styles used hard-coded utility colors.
- The table stack had no dedicated tests for sort wiring, action callbacks, and composition behavior.

Changes applied:

1. Standardized category table typings (`sortBy` and `onSort`) with `keyof MetricCategoryVM`.
2. Hardened desktop table semantics:
   - Accessible color cell text via `sr-only`
   - Invalid date fallback handling
   - Explicit table `ariaLabel` and empty message
3. Hardened mobile table semantics:
   - `section` + `list` structure for card collection
   - Token-based action colors (`bg-status-info`, `bg-status-error`)
   - Semantic empty-state status message
4. Added dedicated tests:
   - `MetricCategoryDesktopTable.test.tsx`
   - `MetricCategoryMobileTable.test.tsx`
   - `MetricCategoryTable.test.tsx`

Validation:

1. `npx eslint src/features/metric-categories/components/MetricCategoryDesktopTable.tsx src/features/metric-categories/components/MetricCategoryMobileTable.tsx src/features/metric-categories/components/MetricCategoryTable.tsx src/features/metric-categories/components/table-config.ts src/features/metric-categories/components/__tests__/MetricCategoryDesktopTable.test.tsx src/features/metric-categories/components/__tests__/MetricCategoryMobileTable.test.tsx src/features/metric-categories/components/__tests__/MetricCategoryTable.test.tsx`
2. `npx jest src/features/metric-categories/components/__tests__/MetricCategoryDesktopTable.test.tsx src/features/metric-categories/components/__tests__/MetricCategoryMobileTable.test.tsx src/features/metric-categories/components/__tests__/MetricCategoryTable.test.tsx --runInBand`

Status:

- `Done`

## Entry 2026-02-18 - MetricCategoryForm

Component:

- `src/features/metric-categories/components/MetricCategoryForm.tsx`

Why this slice:

- Form component still used a legacy alias import and hard-coded surface/color utility classes.
- Form markup had invalid container semantics (`ul`/`span` wrappers for non-list content).
- No dedicated component-level tests existed for create/update/delete form flows.

Changes applied:

1. Added explicit client boundary and standardized imports (`@/lib/cn`, hooks barrel path).
2. Tightened form typing to `MetricCategoryFormInput` and simplified submit flow.
3. Removed console logging from submit/delete error paths and relied on hook error state rendering.
4. Standardized token-based styles (`bg-surface2`, icon color token) and improved copy/labels:
   - Modal title now reflects mode (`Add Category` / `Edit Category`)
   - Icon placeholder clarified (`e.g. 💪`)
   - Color field `aria-label` updated to `Category color`
   - Delete CTA text aligned to domain (`Delete Category`)
5. Fixed container semantics by replacing list-only wrappers with layout `div`/grid containers.
6. Added dedicated tests for create/update/delete, error banner rendering, and close/reset behavior.

Validation:

1. `npx eslint src/features/metric-categories/components/MetricCategoryForm.tsx src/features/metric-categories/components/__tests__/MetricCategoryForm.test.tsx`
2. `npx jest src/features/metric-categories/components/__tests__/MetricCategoryForm.test.tsx --runInBand`
3. `npx jest src/features/metric-categories/components/__tests__ --runInBand`

Status:

- `Done`

## Entry 2026-02-18 - CategoryChip

Component:

- `src/features/metric-categories/components/CategoryChip.tsx`

Why this slice:

- Component still used legacy alias imports (`@/src/...`) and had no dedicated tests.
- Background tint + text contrast logic was coupled to raw category color and not the rendered tinted chip surface.
- Accessibility labeling was generic (`Category Chip`) instead of exposing the actual category name.

Changes applied:

1. Standardized imports to canonical aliases (`@/features/...`, `@/lib/cn`).
2. Reworked chip color handling:
   - Convert category hex color to explicit `rgba(...)` tinted background.
   - Compute text contrast against rendered chip background using `pickTextColor`.
3. Preserved current API (`category`, `variant`, `className`) and variant behavior:
   - `primary`: icon + labeled pill
   - `secondary`: labeled pill only
4. Improved semantics:
   - Root now exposes meaningful label (`Category <name>`)
   - Icon in primary variant marked as decorative (`aria-hidden`)
5. Added dedicated tests:
   - `CategoryChip.test.tsx` for variant rendering, tint styles, fallback handling, and className merge.

Validation:

1. `npx eslint src/features/metric-categories/components/CategoryChip.tsx src/features/metric-categories/components/__tests__/CategoryChip.test.tsx`
2. `npx jest src/features/metric-categories/components/__tests__/CategoryChip.test.tsx --runInBand`

Status:

- `Done`

## Entry 2026-02-18 - MetricLog Table Stack

Components:

- `src/features/metric-logs/components/LogDesktopTable.tsx`
- `src/features/metric-logs/components/LogMobileTable.tsx`
- `src/features/metric-logs/components/LogMobileCard.tsx`
- `src/features/metric-logs/components/LogTable.tsx`
- `src/features/metric-logs/components/table-config.tsx`

Why this slice:

- The log table stack still had legacy alias imports, weak sort typing, and hard-coded mobile action colors.
- `LogMobileCard` had a runtime bug in `aria-label` (`name` referenced but undefined).
- There were no dedicated tests for log desktop/mobile/composition behavior.

Changes applied:

1. Standardized shared log table typing:
   - `sortBy: keyof MetricLogVM`
   - `onSort: (column: keyof MetricLogVM) => void`
   - Added `mobileClassName` to shared table props to avoid ad-hoc prop extension.
2. Hardened desktop table behavior:
   - Added invalid/missing date fallback guard.
   - Added explicit table `ariaLabel` and empty message.
3. Hardened mobile table behavior:
   - Added semantic `section` + `ul/li` structure.
   - Replaced hard-coded action colors with token classes (`bg-status-info`, `bg-status-error`).
   - Standardized empty-state status message.
4. Fixed and hardened `LogMobileCard`:
   - Replaced role-button div with native button.
   - Fixed broken `aria-label` to use formatted `loggedAt` value.
   - Corrected component display names.
5. Added dedicated tests:
   - `LogDesktopTable.test.tsx`
   - `LogMobileCard.test.tsx`
   - `LogMobileTable.test.tsx`
   - `LogTable.test.tsx`

Validation:

1. `npx eslint src/features/metric-logs/components/LogDesktopTable.tsx src/features/metric-logs/components/LogMobileCard.tsx src/features/metric-logs/components/LogMobileTable.tsx src/features/metric-logs/components/LogTable.tsx src/features/metric-logs/components/table-config.tsx src/features/metric-logs/components/__tests__/LogDesktopTable.test.tsx src/features/metric-logs/components/__tests__/LogMobileCard.test.tsx src/features/metric-logs/components/__tests__/LogMobileTable.test.tsx src/features/metric-logs/components/__tests__/LogTable.test.tsx`
2. `npx jest src/features/metric-logs/components/__tests__/LogDesktopTable.test.tsx src/features/metric-logs/components/__tests__/LogMobileCard.test.tsx src/features/metric-logs/components/__tests__/LogMobileTable.test.tsx src/features/metric-logs/components/__tests__/LogTable.test.tsx --runInBand`

Status:

- `Done`

## Entry 2026-02-26 - Metrics Table Stack

Components:

- `src/features/metrics/components/MetricLibraryMobileCard.tsx`
- `src/features/metrics/components/MetricDesktopTable.tsx`
- `src/features/metrics/components/MetricMobileTable.tsx`
- `src/features/metrics/components/MetricTable.tsx`
- `src/features/metrics/components/table-config.tsx`

Why this slice:

- The metrics table stack still had legacy alias drift, weak sort typing, and hard-coded mobile action colors.
- `MetricLibraryMobileCard` relied on a custom memo comparator that could skip rerenders for same-id field updates.
- There was no dedicated component-level test coverage for metrics desktop/mobile/composition behavior.

Changes applied:

1. Standardized shared table config typing:
   - `sortBy: keyof MetricPreviewVM`
   - `onSort: (column: keyof MetricPreviewVM) => void`
   - sortable key source aligned to `METRIC_SORT_KEYS`
2. Hardened desktop table behavior:
   - Added explicit `ariaLabel` and empty-state message.
   - Forwarded `className` consistently.
   - Removed legacy/invalid fallback markup in description cell.
3. Hardened mobile table behavior:
   - Added semantic `section` + `ul/li` structure.
   - Replaced hard-coded action colors with token classes (`bg-status-info`, `bg-status-error`).
   - Standardized empty-state status message.
4. Hardened `MetricLibraryMobileCard`:
   - Added explicit `"use client"` boundary.
   - Replaced role-button div behavior with native button semantics.
   - Removed fragile custom `memo` comparator to prevent same-id stale renders.
5. Added dedicated tests:
   - `MetricDesktopTable.test.tsx`
   - `MetricMobileTable.test.tsx`
   - `MetricTable.test.tsx`
   - updated `MetricLibraryMobileCard.test.tsx` for click and same-id rerender regression.

Validation:

1. `npx eslint src/features/metrics/components/MetricDesktopTable.tsx src/features/metrics/components/MetricMobileTable.tsx src/features/metrics/components/MetricTable.tsx src/features/metrics/components/table-config.tsx src/features/metrics/components/__tests__/MetricDesktopTable.test.tsx src/features/metrics/components/__tests__/MetricMobileTable.test.tsx src/features/metrics/components/__tests__/MetricTable.test.tsx src/features/metrics/components/__tests__/MetricLibraryMobileCard.test.tsx`
2. `npx jest src/features/metrics/components/__tests__/MetricLibraryMobileCard.test.tsx src/features/metrics/components/__tests__/MetricDesktopTable.test.tsx src/features/metrics/components/__tests__/MetricMobileTable.test.tsx src/features/metrics/components/__tests__/MetricTable.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - MetricForm and MetricFormDialog

Components:

- `src/features/metrics/components/MetricForm.tsx`
- `src/features/metrics/components/MetricFormDialog.tsx`
- `src/features/metrics/components/__tests__/MetricFormDialog.test.tsx`

Why this slice:

- `MetricForm` still had non-canonical imports, console logging in mutation failure paths, and form layout/styling drift from the newer feature form baseline.
- Duplicate-name detection used `watch` directly and triggered compiler/lint warnings for incompatible memoization behavior.
- `MetricFormDialog` had no dedicated component-level regression coverage for close/back/refresh behavior.

Changes applied:

1. Standardized form internals and imports:
   - canonical utility/hook imports (`@/lib/cn`, `@/features/metrics/hooks`)
   - dynamic modal title (`Add Metric` / `Edit Metric`)
2. Hardened duplicate-name validation:
   - switched to `useWatch` + debounced lookup
   - preserved edit-mode self-id exclusion and clear/set field error behavior
3. Aligned interaction and semantics with current form baseline:
   - tokenized input shell (`bg-surface2`)
   - responsive form spacing
   - cleaner placeholder copy
   - removed console logging in submit/delete error paths (hook error state remains source of truth)
4. Hardened `MetricFormDialog` close handler:
   - memoized close callback
   - retained `back()` then deferred `refresh()` contract
5. Added dedicated unit tests for dialog wiring:
   - verifies `initialMetric` passthrough to `MetricForm`
   - verifies close triggers router back + deferred refresh

Validation:

1. `npx eslint src/features/metrics/components/MetricForm.tsx src/features/metrics/components/MetricFormDialog.tsx src/features/metrics/components/__tests__/MetricFormDialog.test.tsx src/features/metrics/components/__tests__/MetricForm.int.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/metrics/components/__tests__/MetricFormDialog.test.tsx`
3. `npx jest --config jest.integration.config.ts src/features/metrics/components/__tests__/MetricForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - TimeRangePicker

Component:

- `src/features/data-visualizations/components/TimeRangePicker.tsx`

Why this slice:

- The component still carried duplicated local mode state and noisy legacy markup that increased drift risk.
- Relative input behavior needed safer normalization/reset behavior for partial or invalid values.
- There was no dedicated unit coverage for mode switching, absolute field updates, and relative input validation flow.

Changes applied:

1. Simplified mode handling:
   - removed duplicated local mode state
   - made select fully controlled by `value.mode`
2. Hardened relative input behavior:
   - normalized relative values (`trim` + lowercase) before emitting
   - kept free typing behavior with local draft via input ref
   - reset invalid draft to current/fallback value on blur
3. Hardened mode-switch behavior:
   - relative->absolute now emits a consistent default 30-day ISO range
   - absolute->relative falls back to valid relative value (`30d` fallback)
4. Added absolute datetime update helpers to avoid invalid-date emission and preserve untouched field values.
5. Added dedicated unit tests for:
   - relative valid/invalid input behavior
   - mode switch callbacks
   - absolute start/end update wiring

Validation:

1. `npx eslint src/features/data-visualizations/components/TimeRangePicker.tsx src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - MetricSettingsForm and MetricSettingsFormDialog

Components:

- `src/features/metric-settings/components/MetricSettingsForm.tsx`
- `src/features/metric-settings/components/MetricSettingsFormDialog.tsx`
- `src/features/metric-settings/components/__tests__/MetricSettingsFormDialog.test.tsx`

Why this slice:

- `MetricSettingsForm` still had legacy alias imports, compiler warnings from `watch(...)` usage inside render, and console-logging side effects in submit error paths.
- Form shell and subsection styling still relied on hard-coded surface classes that drifted from the current token baseline.
- `MetricSettingsFormDialog` had no dedicated regression coverage for close navigation behavior.

Changes applied:

1. Standardized form imports/contracts:
   - canonical imports (`@/lib/cn`, `@/features/metric-settings/hooks`)
   - simplified prop destructuring and dynamic modal title (`Add Metric Settings` / `Edit Metric Settings`)
2. Replaced render-time `watch(...)` with `useWatch(...)` fields:
   - `goalEnabled`, `timeFrameEnabled`, `alertEnabled`, `showOnDashboard`
   - removed compiler warning path and kept conditional field behavior equivalent
3. Hardened submit/error flow:
   - removed console logging side effects in submit catch paths
   - simplified `handleSubmit` wiring and preserved hook-driven error banner behavior
4. Aligned form shell styling to token baseline:
   - tokenized section/subsection surfaces and borders
   - removed rigid form min-width and kept responsive modal layout
   - cleaned fallback text colors/addons to semantic token classes
5. Hardened dialog close handler and added dedicated unit test:
   - stable callback for `back()` + deferred `refresh()`
   - test coverage for prop passthrough and close navigation behavior

Validation:

1. `npx eslint src/features/metric-settings/components/MetricSettingsForm.tsx src/features/metric-settings/components/MetricSettingsFormDialog.tsx src/features/metric-settings/components/__tests__/MetricSettingsFormDialog.test.tsx src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/metric-settings/components/__tests__/MetricSettingsFormDialog.test.tsx`
3. `npx jest --config jest.integration.config.ts src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - LogForm and MetricLogFormDialog

Components:

- `src/features/metric-logs/components/LogForm.tsx`
- `src/features/metric-logs/components/MetricLogFormDialog.tsx`
- `src/features/metric-logs/components/__tests__/MetricLogFormDialog.test.tsx`

Why this slice:

- `LogForm` still used mixed/legacy UI import paths and hard-coded styling tokens that drifted from the current form baseline.
- Submit/delete handlers still contained console side effects in catch branches.
- `MetricLogFormDialog` had no dedicated unit coverage for modal close navigation behavior.

Changes applied:

1. Standardized `LogForm` imports and styling:
   - canonical UI imports (`@/ui/...`) and hooks barrel import
   - tokenized form field shell usage (`bg-surface2`, semantic icon tone)
2. Hardened submit/delete flow:
   - removed console side effects from mutation catch branches
   - simplified submit wiring to `handleSubmit(onValid)`
   - standardized busy-state button disable conditions
3. Improved semantics and copy:
   - modal uses title prop directly (`Add Log Entry` / `Edit Log Entry`)
   - removed duplicate heading and redundant invalid-banner copy
   - corrected destructive CTA label to `Delete Log`
4. Hardened `MetricLogFormDialog` close handler with stable callback (`back()` + deferred `refresh()`).
5. Added dedicated dialog unit tests for:
   - prop passthrough
   - close navigation behavior
6. Updated integration failure test to suppress noisy API error logs while asserting user-facing error behavior.

Validation:

1. `npx eslint src/features/metric-logs/components/LogForm.tsx src/features/metric-logs/components/MetricLogFormDialog.tsx src/features/metric-logs/components/__tests__/LogForm.int.test.tsx src/features/metric-logs/components/__tests__/MetricLogFormDialog.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/metric-logs/components/__tests__/MetricLogFormDialog.test.tsx`
3. `npx jest --config jest.integration.config.ts src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - GranularityPicker

Component:

- `src/features/data-visualizations/components/GranularityPicker.tsx`

Why this slice:

- The component had no dedicated unit tests despite being part of the shared visualization controls.
- `className` passthrough could override core select styling accidentally, creating fragile behavior.
- Accessibility label customization relied on raw prop pass-through rather than explicit component contract.

Changes applied:

1. Hardened prop handling:
   - explicit `className` + `aria-label` handling
   - merged classes with `cn(...)` instead of allowing accidental full class override
2. Kept existing API contract (`value`, `onChange`) while preserving native select prop pass-through.
3. Cleaned legacy inline comment noise in control markup.
4. Added dedicated unit tests for:
   - option rendering
   - change callback contract
   - custom aria label and class merging
   - native prop pass-through (`disabled`, `data-testid`)

Validation:

1. `npx eslint src/features/data-visualizations/components/GranularityPicker.tsx src/features/data-visualizations/components/__tests__/GranularityPicker.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/GranularityPicker.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - MetricChart

Component:

- `src/features/data-visualizations/components/MetricChart.tsx`

Why this slice:

- The component still used a legacy utility import path and had no dedicated component-level regression tests.
- Dataset typing used repeated unsafe casts that made chart behavior harder to reason about.
- Empty-state semantics and goal-line handling needed explicit guardrails for predictable rendering.

Changes applied:

1. Standardized imports and optional className support:
   - switched to canonical `@/lib/cn`
   - added optional `className` passthrough for wrapper/empty-state
2. Hardened rendering semantics:
   - empty state now uses semantic `role="status"` + `aria-live="polite"`
   - tokenized empty text style (`text-ink-secondary`)
3. Hardened dataset behavior:
   - reduced unsafe casts by using `ScatterDataPoint[]` for metric and goal datasets
   - goal line only renders for finite goal values
   - legend visibility follows goal-line presence
4. Added dedicated unit tests for:
   - empty-state rendering
   - base metric dataset/options wiring
   - goal dataset behavior
   - tooltip label formatting for valid/missing values

Validation:

1. `npx eslint src/features/data-visualizations/components/MetricChart.tsx src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - MetricForm (Polish Pass)

Component:

- `src/features/metrics/components/MetricForm.tsx`

Why this slice:

- The component-level behavior was already hardened, but the integration suite still lacked explicit regression coverage for duplicate-name validation flow.
- Duplicate-name checks are asynchronous/debounced and easy to regress silently without focused test coverage.

Changes applied:

1. Added a focused integration test in `MetricForm.int.test.tsx` to verify:
   - duplicate-name server lookup path is triggered
   - validation message (`Metric name already exists`) appears
   - submit remains blocked and create mutation is not called
2. Improved test hygiene for async/debounced flows:
   - centralized `/api/proxy/metrics` test endpoint constant
   - stable duplicate-name fixture constant
   - expanded async settle window to absorb debounce updates and avoid act warnings

Validation:

1. `npx eslint src/features/metrics/components/__tests__/MetricForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metrics/components/__tests__/MetricForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - LogForm (Polish Pass)

Component:

- `src/features/metric-logs/components/LogForm.tsx`

Why this slice:

- Core behavior was aligned in the previous pass, but integration coverage still missed the edit-mode delete flow.
- Deletion behavior is a high-impact path and should be explicitly protected by regression tests.

Changes applied:

1. Added dedicated integration coverage for delete behavior in `LogForm.int.test.tsx`:
   - verifies delete endpoint invocation for the selected log id
   - verifies modal close callback fires on successful deletion
2. Preserved existing create/update/error/a11y integration coverage.

Validation:

1. `npx eslint src/features/metric-logs/components/__tests__/LogForm.int.test.tsx src/features/metric-logs/components/LogForm.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - Visualization (Final Coverage Sync)

Component:

- `src/components/ui/Visualization.tsx`

Why this slice:

- Runtime behavior was already stable, but test coverage still missed URL-fallback and query-cleanup edge cases.
- High-value regression paths (invalid URL params, absolute->relative cleanup, no-data rendering) needed explicit safeguards.

Changes applied:

1. Extended `Visualization.test.tsx` with regression coverage for:
   - invalid URL params fallback to default bucket/range
   - absolute->relative range switch removes stale `start`/`end` params
   - completed request with no data renders no-data state
2. Applied test hygiene cleanup:
   - normalized repeated literals into constants for maintainability and lint stability

Validation:

1. `npx eslint src/components/ui/__tests__/Visualization.test.tsx src/components/ui/Visualization.tsx`
2. `npx jest --config jest.unit.config.ts src/components/ui/__tests__/Visualization.test.tsx`

Status:

- `Done`

## Entry 2026-02-26 - TimeRangePicker (Polish Pass)

Component:

- `src/features/data-visualizations/components/TimeRangePicker.tsx`

Why this slice:

- The main interaction hardening was already complete, but test coverage still missed a few contract edge cases.
- The component also had a broad effect dependency (`[value]`) that was less precise than needed.

Changes applied:

1. Tightened effect dependency in `TimeRangePicker.tsx`:
   - from `[value]` to `[value.mode, value.last]` for more explicit sync behavior.
2. Extended `TimeRangePicker.test.tsx` with additional regression cases:
   - selecting the already active mode emits no change event
   - relative input syncs when parent value updates
   - `className` passthrough reaches root container
   - invalid absolute start input emits empty `start` while preserving `end`
3. Applied test hygiene cleanup:
   - extracted repeated literals into constants to keep lint stable.

Validation:

1. `npx eslint src/features/data-visualizations/components/TimeRangePicker.tsx src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricChart (Polish Pass)

Component:

- `src/features/data-visualizations/components/MetricChart.tsx`

Why this slice:

- The previous hardening pass left a few unsafe cast paths in dataset and tooltip handling.
- Component contract coverage still missed className passthrough checks and blank-unit fallback behavior.

Changes applied:

1. Removed remaining unsafe cast paths in chart data flow:
   - added explicit scatter-point mapping helper for dataset input
   - added dedicated tooltip raw-value parser helper
2. Tightened goal-dataset guard:
   - goal line now only builds when `goalValue` is both finite and numeric
3. Hardened unit-label behavior:
   - blank/whitespace `meta.unit` now falls back to dataset label `Value`
   - tooltip output remains trimmed for unitless values
4. Extended unit tests for:
   - chart root className passthrough
   - empty-state className passthrough
   - tooltip `raw: null` fallback to `No data`
   - blank-unit dataset label fallback and unitless tooltip formatting

Validation:

1. `npx eslint src/features/data-visualizations/components/MetricChart.tsx src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricSettingsForm (Polish Pass)

Component:

- `src/features/metric-settings/components/MetricSettingsForm.tsx`

Why this slice:

- `Goal Type` could appear visually selected (`Incremental`) while still remaining `null` in form state after enabling goal mode.
- This created a fragile validation UX path where the form looked complete but still failed schema requirements unless the user manually re-selected goal type.

Changes applied:

1. Hardened goal-mode default behavior in `MetricSettingsForm`:
   - when `goalEnabled` becomes true and `goalType` is `null`, the form now sets `goalType` to `incremental` with validation enabled.
2. Added integration regression coverage in `MetricSettingsForm.int.test.tsx`:
   - verifies enabling goal mode + entering goal value can submit without manually re-selecting goal type
   - verifies payload includes `goalType: "incremental"` and closes on success
3. Applied test hygiene cleanup:
   - extracted repeated metric-settings API path into a shared constant

Validation:

1. `npx eslint src/features/metric-settings/components/MetricSettingsForm.tsx src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricCategoryForm (Polish Pass)

Component:

- `src/features/metric-categories/components/MetricCategoryForm.tsx`

Why this slice:

- Existing tests covered create/update/delete success paths, but missed two regression-prone contract areas:
  - prop-driven default resets when `initialCategory` changes
  - failure behavior for destructive delete path (`onClose` should not fire)

Changes applied:

1. Extended `MetricCategoryForm.test.tsx` with reset behavior coverage:
   - verifies form values reset to new defaults when `initialCategory` changes on rerender
2. Extended delete failure regression coverage:
   - verifies failed delete still calls mutation but does not close the modal
3. Kept runtime component code unchanged; this is a targeted test-hardening pass.

Validation:

1. `npx eslint src/features/metric-categories/components/MetricCategoryForm.tsx src/features/metric-categories/components/__tests__/MetricCategoryForm.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/metric-categories/components/__tests__/MetricCategoryForm.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - LogForm (Polish Pass 2)

Component:

- `src/features/metric-logs/components/LogForm.tsx`

Why this slice:

- Existing integration coverage still missed two guardrail paths:
  - no-`metricId` early return contract
  - delete-failure behavior should keep modal open
- Test file also had repeated endpoint literals.

Changes applied:

1. Extended `LogForm.int.test.tsx` to cover missing metric id guard:
   - verifies guard text renders
   - verifies submit CTA is not rendered
2. Extended delete failure coverage:
   - verifies modal remains open (`onClose` not called) when delete returns 500
   - verifies alert error state is rendered
   - suppressed expected test-path API error console noise
3. Applied test hygiene cleanup:
   - extracted repeated endpoint path to `METRIC_LOGS_API` constant
   - reused constant across create/update/delete handlers

Validation:

1. `npx eslint src/features/metric-logs/components/LogForm.tsx src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricForm (Polish Pass 2)

Component:

- `src/features/metrics/components/MetricForm.tsx`

Why this slice:

- Existing integration coverage missed delete-mode behavior, leaving create/update with stronger safety nets than destructive flows.
- Delete success and delete failure are high-impact contracts for edit mode and needed explicit regression protection.

Changes applied:

1. Extended `MetricForm.int.test.tsx` with delete success coverage:
   - verifies DELETE endpoint receives the current metric id
   - verifies successful delete closes modal (`onClose`)
2. Extended `MetricForm.int.test.tsx` with delete failure coverage:
   - verifies error alert is rendered on failed delete
   - verifies modal remains open (`onClose` not called)
   - suppresses expected API error console noise in failure path
3. Kept runtime component logic unchanged; this is a targeted integration coverage completion pass.

Validation:

1. `npx eslint src/features/metrics/components/MetricForm.tsx src/features/metrics/components/__tests__/MetricForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metrics/components/__tests__/MetricForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - TimeRangePicker (Stability Re-check)

Component:

- `src/features/data-visualizations/components/TimeRangePicker.tsx`

Why this slice:

- Absolute mode still had a rendering edge case when parent-provided ISO values were invalid.
- `toLocal(...)` could produce `NaN-NaN-...` formatted strings, creating unstable datetime-local input values.

Changes applied:

1. Hardened `toLocal(...)` invalid-date guard:
   - returns empty string when ISO parsing fails (`!Number.isFinite(getTime())`)
2. Added unit regression coverage in `TimeRangePicker.test.tsx`:
   - invalid `start`/`end` ISO values render empty datetime-local input values

Validation:

1. `npx eslint src/features/data-visualizations/components/TimeRangePicker.tsx src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricSettingsForm (Stability Re-check)

Component:

- `src/features/metric-settings/components/MetricSettingsForm.tsx`

Why this slice:

- Integration coverage did not yet include update-failure behavior.
- Prop-transition stability for `initialSettings` rerender defaults needed explicit regression protection.

Changes applied:

1. Extended `MetricSettingsForm.int.test.tsx` with update-failure coverage:
   - failed update renders error alert
   - modal remains open (`onClose` not called)
2. Extended `MetricSettingsForm.int.test.tsx` with prop-transition reset coverage:
   - rerender with new `initialSettings` updates rendered defaults (`goalValue`, `alertThresholds`)

Validation:

1. `npx eslint src/features/metric-settings/components/MetricSettingsForm.tsx src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricChart (Stability Re-check)

Component:

- `src/features/data-visualizations/components/MetricChart.tsx`

Why this slice:

- Chart rendering still accepted unexpected non-finite y-values (`Infinity`) into datasets.
- Unit formatting paths could become brittle if runtime payloads violate the declared `string` unit contract.

Changes applied:

1. Hardened dataset point sanitation:
   - non-finite y-values now normalize to `NaN` before chart render
2. Hardened unit normalization:
   - normalized unit handling now safely accepts unknown runtime values
   - tooltip formatting now uses normalized unit value
3. Extended `MetricChart.test.tsx` coverage:
   - verifies non-finite datapoints are sanitized
   - verifies non-string unit fallback still renders safe dataset label and tooltip output

Validation:

1. `npx eslint src/features/data-visualizations/components/MetricChart.tsx src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricForm (Stability Re-check)

Component:

- `src/features/metrics/components/MetricForm.tsx`

Why this slice:

- Integration coverage still lacked update-failure behavior validation.
- Prop-transition reset behavior for `initialMetric` rerenders was not yet explicitly guarded.

Changes applied:

1. Extended `MetricForm.int.test.tsx` with update-failure coverage:
   - failed update renders error alert
   - modal remains open (`onClose` not called)
2. Extended `MetricForm.int.test.tsx` with prop-transition reset coverage:
   - rerender with a different `initialMetric` updates rendered default values (`name`, `defaultUnit`, `description`)
3. Applied test-hygiene cleanup:
   - normalized update endpoint test handler to reuse `metricsEndpoint` constant

Validation:

1. `npx eslint src/features/metrics/components/MetricForm.tsx src/features/metrics/components/__tests__/MetricForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metrics/components/__tests__/MetricForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - LogForm (Stability Re-check)

Component:

- `src/features/metric-logs/components/LogForm.tsx`

Why this slice:

- Integration coverage still lacked update-failure behavior validation.
- Prop-transition reset behavior for `initialLog` rerenders needed explicit regression protection.

Changes applied:

1. Extended `LogForm.int.test.tsx` with update-failure coverage:
   - failed update renders error alert
   - modal remains open (`onClose` not called)
2. Extended `LogForm.int.test.tsx` with prop-transition reset coverage:
   - rerender with different `initialLog` updates rendered `logValue` default

Validation:

1. `npx eslint src/features/metric-logs/components/LogForm.tsx src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metric-logs/components/__tests__/LogForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - TimeRangePicker (Stability Spot-check)

Component:

- `src/features/data-visualizations/components/TimeRangePicker.tsx`

Why this slice:

- Invalid absolute-start behavior was covered, but invalid absolute-end behavior was not explicitly protected.
- This was a symmetry gap in the absolute-mode invalid-input contract.

Changes applied:

1. Extended `TimeRangePicker.test.tsx` with invalid absolute-end regression coverage:
   - invalid local end input emits `{ end: "" }` while preserving absolute start
2. Applied test-hygiene cleanup:
   - extracted repeated absolute start ISO literal into a shared test constant

Validation:

1. `npx eslint src/features/data-visualizations/components/TimeRangePicker.tsx src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/TimeRangePicker.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricSettingsForm (Stability Spot-check)

Component:

- `src/features/metric-settings/components/MetricSettingsForm.tsx`

Why this slice:

- Runtime guard behavior for missing `metricId` was not explicit in this form, unlike other edit/create forms in the codebase.
- This can lead to invalid submissions if the route/context passes an empty id unexpectedly.

Changes applied:

1. Added runtime guard in `MetricSettingsForm`:
   - when `metricId` is empty, form now renders an explicit status error message and skips rendering controls
2. Extended `MetricSettingsForm.int.test.tsx`:
   - verifies metric-id guard text renders
   - verifies add/save submit controls are not rendered under empty-id guard path

Validation:

1. `npx eslint src/features/metric-settings/components/MetricSettingsForm.tsx src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`
2. `npx jest --config jest.integration.config.ts src/features/metric-settings/components/__tests__/MetricSettingsForm.int.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - MetricChart (Stability Spot-check)

Component:

- `src/features/data-visualizations/components/MetricChart.tsx`

Why this slice:

- Runtime unit hardening was already added, but aria-label handling still assumed a valid string `metricId`.
- This could expose brittle accessibility labeling when runtime payloads are malformed.

Changes applied:

1. Hardened metric id labeling:
   - normalized runtime `metricId` before composing chart `aria-label`
   - fallback label uses `unknown metric` for invalid/non-string values
2. Extended `MetricChart.test.tsx`:
   - added regression test for non-string `metricId` fallback behavior

Validation:

1. `npx eslint src/features/data-visualizations/components/MetricChart.tsx src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`
2. `npx jest --config jest.unit.config.ts src/features/data-visualizations/components/__tests__/MetricChart.test.tsx`

Status:

- `Done`

## Entry 2026-03-02 - Visualization (Stability Spot-check)

Component:

- `src/components/ui/Visualization.tsx`

Why this slice:

- Control state was locally stored and only initialized from URL params on mount.
- External URL changes after first render (navigation/history/query sync) would not reliably reflect in control state.

Changes applied:

1. Switched Visualization controls to URL-driven source-of-truth:
   - derive `bucket` and `range` from `useSearchParams` each render via memoized parsers
   - removed local `useState`/sync effect state path
2. Kept existing update contract:
   - picker changes still sync URL via `router.replace(...)`
3. Extended `Visualization.test.tsx`:
   - added regression for URL-param change after initial render (`rerender` with updated `useSearchParams` mock)
4. Applied test-hygiene cleanup:
   - aligned imports and removed state-change assertions that depended on local optimistic state.

Validation:

1. `npx eslint src/components/ui/Visualization.tsx src/components/ui/__tests__/Visualization.test.tsx`
2. `npx jest --config jest.unit.config.ts src/components/ui/__tests__/Visualization.test.tsx`

Status:

- `Done`

## Next Candidates

1. `src/features/data-visualizations/components/TimeRangePicker.tsx` (regression parity review)
2. `src/features/metric-settings/components/MetricSettingsForm.tsx` (regression parity review)
3. `src/features/data-visualizations/components/MetricChart.tsx` (regression parity review)
