# Lakira Frontend – Security Remediation Tracker (Cycle 2025-12-10)

Use this tracker to drive fixes for every Medium/High finding from the December audit. Keep it in sync with the audit log and issue tracker.

## Status Legend
- **Open** – Finding logged, no fix planned.
- **Planned** – Owner + timeline agreed, work not started.
- **In Progress** – Actively being remediated.
- **Ready for Verify** – Code merged/deployed; waiting for regression tests or artifact update.
- **Verified** – Evidence captured, control updated to Implemented.
- **Risk Accepted** – Documented approval (security + product) with review date.

## Tracker Table
| ID | Severity | Title / Summary | Owner | Status | Target Date | Control Refs | Evidence / Artifact | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FE-XXXX-000 | High | <placeholder – describe the finding> | <owner> | Open | YYYY-MM-DD | ASVS V2.1, OWASP A01 | `artifacts/FE-XXXX-000.md` | Link to Jira/Linear issue, dependencies, blockers. |

## Remediation Workflow
1. **Log** – When adding a finding to `security-audit-log.md`, immediately create a row here and in your issue tracker.
2. **Plan** – Assign severity, owner, target date, and link to benchmarks; confirm compensating controls if deferring.
3. **Fix** – Reference the remediation ticket in PR descriptions; ensure CI gates (`security:scan`, tests) cover the regression.
4. **Verify** – Capture artifacts (screens, logs, test output), update control matrix status, and move the row to “Verified.”
5. **Archive** – After the cycle, snapshot this file alongside the audit log for future auditors.
