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

## Next Candidates

1. `src/features/metric-logs/components/LogForm.tsx`
2. `src/features/data-visualizations/components/GranularityPicker.tsx`
3. `src/features/data-visualizations/components/MetricChart.tsx`
