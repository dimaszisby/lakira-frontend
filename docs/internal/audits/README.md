# Audits

Audit runs, grouped by **program**. Each program owns a folder; each run inside it is dated and
immutable once written.

| Program        | Folder                                 | What it grades                                                                        | Latest run                                                                   |
| -------------- | -------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| SaaS readiness | [`saas-readiness/`](./saas-readiness/) | How close the repo is to being forkable as a generic SaaS frontend base               | [2026-08-29](./saas-readiness/audit-2026-08-29.md) — FORK-READY WITH CAVEATS |
| Security       | [`security/`](./security/)             | Threat model, control matrix, and findings against OWASP ASVS / Top 10, CIS, NIST CSF | [2025-11-21](./security/audit-2025-11-21/) — complete                        |

## Conventions

Two shapes are in use, deliberately:

- **One file per run** (`audit-YYYY-MM-DD.md`) — for programs where a run is a single
  observation with one scorecard. SaaS readiness uses this, matching the sibling
  `lakira-backend` kit.
- **One folder per run** (`audit-YYYY-MM-DD/`) — for programs where a run produces several
  linked artifacts (plan, threat model, control matrix, findings log, remediation tracker).
  Security uses this.

Shared rules:

- **Prior runs are immutable.** Never overwrite one; a re-audit is a new dated file or folder.
  The trail is the point — scorecards are meant to be diffed across runs.
- **Each program has exactly one mutable surface** that always points at the latest run. For
  SaaS readiness that is `SAAS-BASE-CHECKLIST.md` at the repo root.
- **Decisions append, never rewrite.** A program's `decisions.md` is an ADR log; when an entry
  stabilises, promote it to `docs/explanation/decisions/` and leave a one-line pointer behind.
- **Every claim cites `file:line`** or records "no file found".

> `security/audit-2025-12-10/` is a scaffold that was never filled in — it has the workflow
> guidelines and remediation tracker but none of the Phase 0 artifacts its own playbook
> requires. Treat it as an open intent, not a completed run.

Placement rule for new audits: `.claude/rules/documentation.md` and
[`docs/README.md`](../../README.md#where-new-documentation-goes).
