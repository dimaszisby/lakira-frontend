# Move the runtime off Node 20

**Purpose:** build, test and run the app on a supported Node line.
**Owner:** hardini
**Branch:** `chore/node24-runtime-upgrade` off `dev`
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

## Decisions made during the work

Both promoted: ADR-0018 and ADR-0019 in `docs/explanation/decisions/`.

**D-2 — Go ahead of the backend.** Decided 2026-09-25. The frontend has no production deployment,
and the Notion record already tells the backend where this is heading; waiting would buy nothing.

**D-3 — `.nvmrc` is the only pin; `.node-version` is deleted.** Decided 2026-09-25. Every
`setup-node` step reads `node-version-file: .nvmrc`. nvm and fnm both read `.nvmrc`. The pin is the
major (`24`), not a patch, so security releases need no bump; promoted to
[ADR-0018](../../explanation/decisions/adr-0018-node-24-runtime-pinned-in-nvmrc.md).

**D-4 — Dependency install scripts are opt-in.** Decided 2026-09-25, with the owner. Node 24.21.0
ships npm 11.19, which introduced `allowScripts`. `cypress` is allowed; `msw`, `fsevents` and
`unrs-resolver` are denied. Promoted to
[ADR-0019](../../explanation/decisions/adr-0019-dependency-install-scripts-are-opt-in.md), which has
the per-package reasoning.

The first reading of npm 11.19 was wrong, and the decision was taken on it. Its man page
(`npm help install-scripts`) says unlisted scripts are "blocked by default", which would have left `e2e` with no
Cypress binary. Measured, they run with a notice; only `strict-allow-scripts` blocks them. The
allowlist was kept because it still holds on the corrected facts (ADR-0019, Options considered), but
it now changes behaviour for the three denied packages. That is why every gate was run with them
skipped.

## Checklist

- [x] Wait for, or coordinate with, the backend move → D-2: not waiting. Tracked on the Notion page
      "FE message to BE" (under Handoff(s)), record "Move the runtime off Node 20".
- [x] Decide whether to keep both `.nvmrc` and `.node-version` or drop one → D-3.
- [x] Point every `setup-node` step at the pin with `node-version-file: .nvmrc`: all 8 jobs.
- [x] Bump `engines.node` to `24.x` and `@types/node` to `^24` (`^24.13.6`); lockfile regenerated on
      Node 24.21.0. Lockfile diff reviewed: `@types/node` 20.19.24 to 24.13.6 and its
      `undici-types` 6.21.0 to 7.18.2, plus the root `engines`; nothing else.
- [x] `allowScripts` in `package.json` (D-4).
- [x] Prose: `README.md`, `docs/tutorials/getting-started.md`,
      `docs/how-to/ci-cd/daily-pipeline-playbook.md`, `.claude/agents/ci-debugger.md` (two places),
      `.claude/rules/security.md` (install-script rule), `CLAUDE.md` (ADR count), the ADR registry.
- [x] Gates on Node 24.21.0 locally, from a fresh `npm ci` in a scratch worktree: lint, css lint,
      typecheck, unit (80 suites, 669 tests), integration (19 suites, 99 tests), build. Format on
      the working tree.
- [x] Gates in CI on the PR, and one `frontend-performance` dispatch on the branch. Run
      `36225877771` on `0bdac86`: all 8 jobs green. Dispatch `36225878190`: passed.
- [x] Check the CI logs for the Node version actually used, not just the green tick; and that `e2e`
      found the Cypress binary. Every job logged "Resolved .nvmrc as 24" and `node: v24.21.0` from
      the runner cache, the same patch as the local gates. Zero "not yet covered by allowScripts"
      notices in the run. `e2e`: "All specs passed".

## Status

**Complete.** Merged in #52 (`0bdac86`). ADR-0018 and ADR-0019 record the decisions. The backend
still pins Node 20; its move is on the Notion page "FE message to BE".

## Proof that the allowlist does what it says

Both runs: Node 24.21.0, fresh `npm ci`, empty `CYPRESS_CACHE_FOLDER`.

| Run                    | Install-script notice                | Cypress binary                         |
| ---------------------- | ------------------------------------ | -------------------------------------- |
| without `allowScripts` | lists all four packages              | downloaded; unlisted scripts still run |
| with `allowScripts`    | none; only `cypress` postinstall ran | downloaded, `cypress verify` passed    |

The first run is what exposed the wrong reading of the man page.

## Discovered

- [x] Found: npm 11.19's install-script policy → in scope, D-4 and ADR-0019.
- [x] Found: `docs/internal/initiatives/cicd/pipeline-plan.md` says "Setup Node 20" seven times →
      out of scope: a plan document, already tracked for a move to `docs/reference/` by
      `2026-09-19-todo-pipeline-plan-is-reference-material.md`, which should re-check versions then.
