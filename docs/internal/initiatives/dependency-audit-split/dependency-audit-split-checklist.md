# Dependency audit split — Checklist

## Phase 0 — Gate, schedule, guard

- [x] `package.json`: `security:audit` is `npm audit --omit=dev --audit-level=high`;
      `security:audit:full` is `npm audit --audit-level=high`
- [x] `.github/workflows/test.yml`: `security` step named for production dependencies
- [x] `.github/workflows/dependency-audit.yml`: nightly and `workflow_dispatch`, read-only
      token, actions pinned as in `test.yml`, runs `security:audit:full`
- [x] `eslint.config.mjs`: `import-x/no-extraneous-dependencies` with `devDependencies: false`
      on runtime files under `src/`
- [x] ADR-0023 written, `Proposed`; registry row in `docs/explanation/decisions/README.md`

## Phase 1 — Docs

- [x] `docs/reference/commands.md`, `docs/reference/ci-pipeline/workflows.md`
- [x] `docs/how-to/security/run-a-security-audit.md`,
      `docs/how-to/ci-cd/daily-pipeline-playbook.md`,
      `docs/how-to/testing/run-the-test-suites.md`
- [x] `.claude/rules/security.md`, `SECURITY.md`, `.claude/agents/ci-debugger.md`,
      `.claude/rules/code-style.md`
- [x] `docs/internal/todos/2026-09-30-todo-npm-audit-brace-expansion.md`: #62 box ticked,
      Status points here

## Discovered

- [x] Found: `api:spec:check` failed while gating this branch. Backend #127 added a `429` to
      `POST /auth/register` after #62's green `dev` run -> out of scope, filed as
      `docs/internal/todos/2026-10-02-todo-sync-register-rate-limit.md`. That PR merges first;
      this branch then takes `dev` so its API Contract Drift check re-runs.
- [x] Found: the first dispatched run after merge (37131845770, 2026-10-03) failed on an
      unpatched advisory in `braces`, a development-only dependency. The workflow ran as
      designed, but AC-3 says green, so it stays open -> out of scope, filed as
      `docs/internal/todos/2026-10-03-todo-braces-dev-advisory.md`.

## Acceptance

- [x] **AC-1** — `security:audit` fails on a high advisory in a production dependency.
      _Why:_ shipped code must still block merges (#63's critical RCE). Method: run against the
      77ee753 lockfile (`next` 16.3.4) in a scratch copy.
- [x] **AC-2** — `security:audit` passes when the only high advisory is in a dev dependency, and
      `security:audit:full` fails on the same lockfile. _Why:_ the incident class this exists to
      stop (#62). Method: a scratch lockfile with `brace-expansion` back at 1.1.18.
- [ ] **AC-3** — `dependency-audit.yml` runs green from `workflow_dispatch` on `dev` after merge.
      _Why:_ a scheduled job nobody has seen run might not exist (lesson 2026-09-12). Method: one
      dispatched run, checked by name.
- [x] **AC-4** — lint fails when a runtime file in `src/` imports a devDependency, and passes on
      `dev`. _Why:_ keeps the production audit's scope true. Method: plant an `msw` import,
      watch lint fail, remove it.
- [x] **AC-5** — every live doc states the split; no stale `audit-level=high` description outside
      dated records. _Why:_ a gate documented one way and run another is the 2026-08-17 lesson.
      Method: grep.

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests
- [x] integration
- [x] spec drift (`api:spec:check`) — failed on backend #127, not this branch; passed on
      2026-10-03 once the branch took `dev` with #65 (see Discovered)
- [x] build
- [x] `security:scan` and `security:audit:full`
- [x] e2e, e2e (stack) — skipped: no page or flow changes
