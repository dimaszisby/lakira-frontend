# Lakira Frontend Unit Test Log

This log captures the execution history of unit test suites for Lakira Frontend. Every run (local verification, CI pipeline, or release candidate validation) must append a new entry following the structure below so the team can trace coverage trends, ownership, and discovered issues.

## How to Use

1. After each notable run, add a new row to the **Execution History** table in reverse chronological order.
2. Link the run to the relevant PR, build number, or release tag.
3. If failures occurred, reference the Jira/GitHub issue or section in `security-audit-log.md` where remediation is tracked.
4. For recurring schedules (e.g., nightly CI), automation may append rows via script; manual runs should be added by the engineer/QA who executed them.

## Execution History

| Date (UTC) | Trigger / Build | Scope (files/modules) | Coverage (Statements / Branches) | Result | Owner | Notes / Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| 2025-11-21 | Local dev (`npm run test:unit:ci`) | `src/utils`, `src/lib`, `src/components/ui`, `src/features/*` | 6.25% / 3.68% | ✅ Pass | @codex | Added OverlineLabel + metric card suites; coverage checklist script introduced. |
| 2025-11-21 | Local dev (`npm run test:unit:ci`) | `src/utils`, `src/lib`, `src/components/ui` | 5.09% / 3.4% | ✅ Pass | @codex | Added SortChip & SortChipGroup suites to continue raising coverage. |
| 2025-11-21 | Local dev (`npm run test:unit:ci`) | `src/utils`, `src/lib`, `src/components/ui` | 4.69% / 2.9% | ✅ Pass | @codex | Added Visualization/DataLabel suites and Codecov upload step. |
| 2025-11-21 | Local dev (`npm run test:unit:ci`) | `src/utils`, `src/lib` | 3.85% / 2.59% | ✅ Pass | @codex | Coverage-enabled run after expanding suites + CI workflow creation. |
| 2025-11-21 | Local dev (`npm run test:unit`) | `src/utils/date-io` | N/A (bootstrap) | ✅ Pass | @codex | Initial Jest setup validation; coverage collection to be enabled in CI. |

> Replace the sample row above once real executions begin. Keep the table lean by summarizing weekly/nightly runs into batches if volume is high, but ensure any failure or significant coverage delta gets its own row.

## Related Documents

- `documents/documentation/unit-test-plan.md`
- `documents/documentation/testing-plan.md`
- `documents/security/security-audit-log.md`
