# Move the runtime off Node 20

**Purpose:** build, test and run the app on a supported Node line.
**Owner:** hardini
**Branch:** unassigned
**Priority:** medium. Node 20 is end of life, so it gets no more security fixes. The frontend has no
production deployment yet, so nothing is exposed today; the backend's production image is.
**Found:** 2026-09-24, while scoping `2026-09-24-todo-node20-actions-migration.md`.

## Not the same as the actions migration

`2026-09-24-todo-node20-actions-migration.md` is about the Node that GitHub's own actions run on
(`checkout@v4` and friends). This todo is about the Node that runs the app: `node-version` in the
workflows, `.nvmrc`, `engines`. The two can land separately, and should, so a failure points at
one cause.

## Node release lines

From `nodejs/Release` `schedule.json`, read 2026-09-24:

| Line | Active LTS from | Maintenance from | End of life |
| ---- | --------------- | ---------------- | ----------- |
| 20   | 2023-10-24      | 2024-10-22       | 2026-04-30  |
| 22   | 2024-10-29      | 2025-10-21       | 2027-04-30  |
| 24   | 2025-10-28      | 2026-10-20       | 2028-04-30  |
| 26   | 2026-10-28      | 2027-10-20       | 2029-04-30  |

## Decision: Node 24

Decided 2026-09-24. Target 24, in step with `lakira-backend`.

- 22 leaves about seven months before the next forced move.
- 26 is not LTS until 2026-10-28, and native dependencies tend to lag a new line.
- 24 is supported to 2028-04-30. It moves from Active LTS to Maintenance on 2026-10-20, which
  means security and critical fixes only; that is acceptable for a runtime pin.
- Next 16 requires `>=20.9.0` (`node_modules/next/package.json`), so 24 is inside its range.

## Where the frontend pins Node

Checked 2026-09-24:

- `.nvmrc` and `.node-version`: both `20`.
- `package.json`: `engines.node` is `20.x`; `@types/node` is `^20`.
- `.github/workflows/test.yml` (7 jobs) and `performance.yml` (1 job): `node-version: 20`.
- Prose: `README.md` ("Requires Node 20"), `docs/tutorials/getting-started.md`,
  `docs/how-to/ci-cd/daily-pipeline-playbook.md`, `.claude/agents/ci-debugger.md` (two places).
- There is no Dockerfile and no hosting config.

Dated audits and archived plans that mention Node 20 are historical records and stay as they are.

## Checklist

- [ ] Wait for, or coordinate with, the backend move. Tracked on the Notion page "FE message to BE"
      (under Handoff(s)), record "Move the runtime off Node 20".
- [ ] Decide whether to keep both `.nvmrc` and `.node-version` or drop one; two files are two
      sources of truth.
- [ ] Point every `setup-node` step at the pin with `node-version-file: .nvmrc` instead of a
      literal, so CI and local development cannot drift apart again.
- [ ] Bump `engines.node` to `24.x` and `@types/node` to `^24`; regenerate the lockfile with
      `npm install` on Node 24, and review the lockfile diff.
- [ ] Update the prose listed above.
- [ ] Gates on Node 24, locally and in CI: lint, css lint, typecheck, format, unit, integration,
      build, and one `frontend-performance` dispatch.
- [ ] Check the CI logs for the Node version actually used (`node -v` in the setup step output),
      not just the green tick.
