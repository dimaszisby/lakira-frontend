# Components Overhaul Tracker

Legend:

- Status: `Not Started`, `In Progress`, `Done`, `Deferred`
- Tier: `T1` (foundation), `T2` (complex interaction), `T3` (display/utility)

| Component          | Tier | Tests | `use client` | Hex Color Found | Target Phase | Status      | Notes                                                           |
| ------------------ | ---- | ----- | ------------ | --------------- | ------------ | ----------- | --------------------------------------------------------------- |
| Button             | T1   | Yes   | Yes          | No              | Phase 1      | Done        | Consolidated baseline primitive and added dedicated unit tests. |
| FormField          | T1   | Yes   | No           | No              | Phase 1      | Done        | ARIA wiring hardened and regression tests added.                |
| InputChrome        | T1   | Yes   | Yes          | No              | Phase 1      | Done        | Canonical imports and primitive shell coverage tests added.     |
| TextField          | T1   | Yes   | Yes          | No              | Phase 1      | Done        | Clear/reveal behavior and change handlers covered by tests.     |
| TextArea           | T1   | Yes   | Yes          | No              | Phase 1      | Done        | Counter/add-on/change flow covered with dedicated tests.        |
| Select             | T2   | Yes   | Yes          | No              | Phase 2      | Done        | Listbox trigger semantics, keyboard flow, and tests added.      |
| Modal              | T2   | Yes   | Yes          | No              | Phase 2      | Done        | Focus trap/restore, escape-close, overlay-close, tests added.   |
| Toggle             | T2   | Yes   | Yes          | No              | Phase 2      | Done        | Removed double-toggle risk and aligned switch semantics/tokens. |
| SegmentedControl   | T2   | Yes   | Yes          | No              | Phase 2      | Done        | Roving focus + keyboard wrap/skip behavior hardened with tests. |
| DateTimePicker     | T2   | Yes   | Yes          | No              | Phase 2      | Done        | Focus restore, calendar semantics, and datetime flow tested.    |
| CategorySelect     | T2   | Yes   | Yes          | No              | Phase 2      | Done        | Semantic-token styling and default-value flow standardized.     |
| ColorField         | T2   | Yes   | Yes          | No              | Phase 2      | Done        | Shared defaults extracted, token styles aligned, tests added.   |
| SearchInput        | T3   | Yes   | No           | No              | Phase 3      | Done        | Tokenized controls and clear/loading interaction tests added.   |
| Table              | T3   | Yes   | No           | No              | Phase 3      | Done        | Sort/row a11y behavior hardened and dedicated tests added.      |
| Pagination         | T3   | Yes   | No           | No              | Phase 3      | Done        | Rebuilt pager contract, guarded nav states, and added tests.    |
| Card               | T3   | Yes   | No           | No              | Phase 3      | Done        | Semantic root support and dedicated primitive tests added.      |
| Visualization      | T3   | Yes   | Yes          | No              | Phase 3      | Done        | URL/query sync hardened and interaction tests expanded.         |
| SwipeableCard      | T3   | Yes   | Yes          | No              | Phase 3      | Done        | Swipe/keyboard parity and close-behavior guardrails added.      |
| Slider             | T3   | Yes   | Yes          | No              | Phase 3      | Done        | Keyboard/stepper/mark behavior hardened with dedicated tests.   |
| ListModeToggle     | T3   | Yes   | No           | No              | Phase 3      | Done        | Radiogroup semantics + keyboard navigation and tests added.     |
| SortChip           | T3   | Yes   | No           | No              | Phase 3      | Done        | Tokenized states + pressed semantics and tests updated.         |
| SortChipGroup      | T3   | Yes   | No           | No              | Phase 3      | Done        | Group labeling and sortable-column behavior covered by tests.   |
| DataLabel          | T3   | Yes   | No           | No              | Phase 3      | Done        | Value formatting and token style consistency verified.           |
| ErrorMessage       | T3   | Yes   | Yes          | No              | Phase 3      | Done        | Sanitization + alert semantics covered with dedicated tests.    |
| EmptyDataIndicator | T3   | Yes   | No           | No              | Phase 3      | Done        | Tokenized empty-state semantics and tooltip behavior tested.    |
| FullScreenSpinner  | T3   | Yes   | No           | No              | Phase 3      | Done        | Status-region semantics and custom label behavior tested.       |
| IconLabel          | T3   | Yes   | No           | No              | Phase 3      | Done        | Tone/size rendering behavior and icon props tested.             |
| SkeletonLoader     | T3   | Yes   | No           | No              | Phase 3      | Done        | Renamed from typo and covered with dedicated loading tests.     |
