# Components Overhaul Audit (2026-02-13)

## Audit Scope

- Directory audited: `src/components/ui`
- File type: `*.tsx`
- Focus:
  - API and architecture consistency
  - Accessibility and interaction risks
  - Styling/token consistency
  - Test coverage baseline

## Baseline Metrics

- Total components: `30`
- Components with dedicated unit tests: `4` (`13.3%`)
- Components with `"use client"`: `14` (`46.7%`)
- Components with hard-coded hex colors detected: `3`

## High-Priority Findings

1. Button duplication and divergence
   - `Button.tsx` and `PrimaryButton.tsx` overlap in purpose but use different API and styling standards.
2. Low component test coverage
   - Only `DataLabel`, `SortChip`, `SortChipGroup`, `Visualization` have dedicated tests.
3. Mixed styling strategy in primitives
   - Hard-coded colors appear in `PrimaryButton.tsx`, `CategorySelect.tsx`, and `ColorField.tsx`.
4. Naming inconsistency
   - `SekeletonLoader.tsx` appears misspelled and should be normalized.
5. Accessibility consistency risk in custom widgets
   - Components such as `Modal`, `Select`, `DateTimePicker`, and `Toggle` need dedicated keyboard/focus verification in overhaul phases.

## Component Risk Buckets

### Tier 1 (Immediate Foundation)

- `Button.tsx`
- `PrimaryButton.tsx` (removed after consolidation)
- `FormField.tsx`
- `FieldShell.tsx` (removed as unused)
- `InputChrome.tsx`
- `TextField.tsx`
- `TextArea.tsx`

### Tier 2 (Complex Interaction)

- `Modal.tsx`
- `Select.tsx`
- `Toggle.tsx`
- `SegmentedControl.tsx`
- `DateTimePicker.tsx`

### Tier 3 (Display and Utility)

- `Table.tsx`
- `Pagination.tsx`
- `Visualization.tsx`
- `SearchInput.tsx`
- `Card.tsx`

## Recommended Sequence

1. Consolidate button/input foundations first.
2. Harden complex interaction components (modal/select/toggle).
3. Normalize display components and naming cleanup.
4. Expand unit coverage and add targeted integration coverage for interaction-heavy primitives.

## Progress Update (2026-02-16)

Completed in this slice:

1. Active usage migrated from `PrimaryButton` to `Button` in category list infinite load action.
2. `PrimaryButton` removed completely from `src/components/ui`.
3. `FieldShell` removed after confirming no in-repo usage.
4. `FormField` accessibility wiring tightened (`aria-describedby`/`aria-errormessage` merge behavior).
5. `InputChrome`, `TextField`, and `TextArea` aligned to semantic token classes.
6. Added dedicated unit tests for `Button` and `FormField`.
7. `CategorySelect` updated to semantic token styling and shared category defaults.
8. Added dedicated unit tests for `CategorySelect`.
9. `ColorField` updated to shared presets/default constants, unified hex normalization, and semantic token styling.
10. Added dedicated unit tests for `ColorField`.
11. `Pagination` rebuilt with explicit known-total vs cursor-mode behavior and stable navigation guards.
12. Added dedicated unit tests for `Pagination`.
13. `ListModeToggle` upgraded to radiogroup semantics with arrow/home/end keyboard selection behavior.
14. Added dedicated unit tests for `ListModeToggle`.
15. `SearchInput` aligned to semantic token styling and explicit clear behavior contract.
16. Added dedicated unit tests for `SearchInput`.
17. `Card` primitive API hardened with semantic root element support and heading-level override for title.
18. Added dedicated unit tests for `Card` primitive defaults, overrides, and subcomponent structure.
19. `Table` contract hardened with correct `aria-sort` behavior, guarded row interactions, and empty-state labeling API.
20. Added dedicated unit tests for `Table` sorting, row interaction, and empty-state behavior.
21. `Visualization` query-param flow hardened (bucket validation, relative/absolute range sync, and canonical import paths).
22. Expanded `Visualization` tests to cover router/query sync and unsupported bucket guard behavior.
23. `SwipeableCard` hardened with explicit client boundary, controlled/uncontrolled open state, outside-close, and escape-to-close behavior.
24. Added dedicated unit tests for `SwipeableCard` action, outside-close, and keyboard/tap close flows.
25. `Slider` hardened with stable snapping math, keyboard/stepper parity, and semantic token styling.
26. Added dedicated unit tests for `Slider` keyboard, allowed-snapping, marks, and stepper behavior.
27. `Select` rebuilt with listbox-trigger semantics, disabled-option-safe keyboard navigation, and tokenized styling.
28. Added dedicated unit tests for `Select` click, keyboard, escape-close, hidden input, and disabled behavior.
29. `Modal` rebuilt with focus trap/focus restore, escape close, overlay close, and body scroll-lock behavior.
30. Added dedicated unit tests for `Modal` close paths, focus trap, focus restoration, and scroll-lock lifecycle.
31. `Toggle` rebuilt on semantic token styles with canonical imports and guarded click handling.
32. Added dedicated unit tests for `Toggle` switch semantics, keyboard activation, disabled behavior, and state labels.
33. `SegmentedControl` rebuilt with robust roving-focus fallback and keyboard navigation that skips disabled options.
34. Added dedicated unit tests for `SegmentedControl` radiogroup semantics, click metadata, keyboard flow, and null-value focus fallback.
35. `DateTimePicker` rebuilt with canonical imports, tokenized visual styles, and safer popover close/focus behavior.
36. Added dedicated unit tests for date-mode commit, datetime time-preservation, escape close/focus restore, and minute-step options.
37. `InputChrome`, `TextField`, and `TextArea` normalized to canonical import paths and minor primitive layout cleanup.
38. Added dedicated unit tests for `InputChrome` shell/error state behavior.
39. Added dedicated unit tests for `TextField` change-handler wiring, clearable behavior, and password reveal toggle.
40. Added dedicated unit tests for `TextArea` counter updates, change-handler wiring, and addon rendering.
41. `ErrorMessage` normalized to canonical imports with tokenized error variants while preserving sanitization behavior.
42. Added dedicated unit tests for `ErrorMessage` sanitization, field-error fallback, and reserve-space semantics.
43. `EmptyDataIndicator` rebuilt with semantic empty-state markup and tokenized visual styles.
44. Added dedicated unit tests for `EmptyDataIndicator` default/custom copy and optional tooltip rendering.
45. `IconLabel` refactored to canonical utility usage and simplified inline semantic structure.
46. Added dedicated unit tests for `IconLabel` tone/size behavior and icon prop wiring.
47. `FullScreenSpinner` rebuilt as an accessible status region with tokenized full-screen loading treatment.
48. Added dedicated unit tests for `FullScreenSpinner` default and custom loading labels.
49. `SortChip` standardized with token-driven active/inactive styles, pressed semantics, and canonical utility imports.
50. `SortChipGroup` standardized with explicit group labeling and clearer sortable-column rendering behavior.
51. Renamed `SekeletonLoader` to `SkeletonLoader` and updated app callsites to canonical import path.
52. Added dedicated unit tests for `SkeletonLoader` status semantics and configurable placeholder count.
53. `DataLabel` standardized with canonical utility import and explicit boolean display formatting.
54. Verified and cleaned residual `@/src/lib/cn` import drift across remaining UI primitives (`Button`, `FormField`, `CategorySelect`, `ColorField`, `DataLabel`).

Current metrics after this slice:

- Components with dedicated unit tests: `28`
- Total UI components: `28`
- Components using `"use client"`: `15`
- Components with hard-coded hex colors detected: `0`
