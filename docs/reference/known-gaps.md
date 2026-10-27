# Known gaps

**Purpose:** what a fork of this template inherits knowingly: gaps that were looked at and kept,
with the reason, so they are not raised again as findings.
**Owner:** whoever changes the decision a row cites.

Open work is in [GitHub Issues](https://github.com/dimaszisby/lakira-frontend/issues)
([`issue-tracker.md`](issue-tracker.md)); a gap here is not open work. Security problems are
reported privately, as [`SECURITY.md`](../../SECURITY.md) says.

| Gap                                                                                                                                     | Why it stays                                                                                                                                                                                   | Decided in                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| The server scrubs `console.error` only. `console.warn`, `console.log` and a dependency writing to the streams directly are not scrubbed | Next prints errors through `console.error`, which is where request details leaked. Nothing in CI shows whether a later Next still does; that is a probe for the next dated audit, done by hand | [ADR-0029](../explanation/decisions/adr-0029-the-servers-console-error-output-is-scrubbed.md); register row F-22 |
| `next.config.ts` reads `NEXT_PUBLIC_API_BASE_URL` raw, outside the validated environment in `src/lib/env.ts`                            | The config runs before the app's module graph exists and cannot import from `src/`                                                                                                             | `docs/internal/todos/2026-08-24-todo-saas-readiness.md`, phase 3; register row F-23                              |

Each row came from the debt register when it was frozen on 2026-10-25
([ADR-0044](../explanation/decisions/adr-0044-every-task-starts-from-an-issue.md)).
