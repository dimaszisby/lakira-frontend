# CI workflows

What each GitHub Actions workflow runs, in what order, and on what. Checked against
`.github/workflows/test.yml` and `.github/workflows/performance.yml` on 2026-09-26.

This page is the one description of the pipeline. What to do when a job goes red is in the
[daily pipeline playbook](../../how-to/ci-cd/daily-pipeline-playbook.md); the npm scripts are in
[`commands.md`](../commands.md).

## Common to every job

| Setting         | Value                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runner          | `ubuntu-latest`                                                                                                                                                |
| Node            | `setup-node` with `node-version-file: .nvmrc` (24), `cache: npm`. See [ADR-0018](../../explanation/decisions/adr-0018-node-24-runtime-pinned-in-nvmrc.md).     |
| Install         | `npm ci` in every job; `node_modules` is never shared between jobs                                                                                             |
| Install scripts | Only packages allowed in `package.json` `allowScripts` run one. See [ADR-0019](../../explanation/decisions/adr-0019-dependency-install-scripts-are-opt-in.md). |
| Actions         | `actions/*` only, each pinned to a full commit SHA with the version as a comment; Dependabot bumps them weekly (`.github/dependabot.yml`)                      |
| Secrets         | None. No job reads a repository secret, and coverage is not sent to any external service.                                                                      |

The pinning and install-script rules are in `.claude/rules/security.md`.

## `frontend-ci` (`test.yml`)

**Triggers:** `push` and `pull_request` to `main` and `dev`.
**Concurrency:** group `frontend-ci-<ref>`, `cancel-in-progress: true`. A new push to a ref cancels
the run still going on it.

```
checks → unit → integration → build → e2e
api-contract   (independent)
security       (independent)
secret-scan    (independent)
```

Each job in the chain `needs` the one before it, so the first failure stops the rest. The three
independent jobs start immediately and do not gate the chain.

| Job            | Name               | Timeout | Runs, in order                                                                                                   | Uploads                                          |
| -------------- | ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `checks`       | Static checks      | 15 min  | `lint`, `lint:css`, `typecheck`, `format`                                                                        | none                                             |
| `unit`         | Unit tests         | 20 min  | `test:unit:ci` (global coverage thresholds), `coverage:check` (per-folder goals, `--strict`)                     | `coverage-report` (always)                       |
| `integration`  | Integration tests  | 20 min  | `test:integration`                                                                                               | none                                             |
| `build`        | Build              | 20 min  | `build`                                                                                                          | `next-build` (`.next`, hidden files included)    |
| `e2e`          | E2E tests          | 30 min  | downloads `next-build`, `npm run start` on `127.0.0.1:3000`, waits up to 120 s for it, `test:e2e`, stops the app | `cypress-videos`, `cypress-screenshots` (always) |
| `api-contract` | API Contract Drift | 10 min  | `api:spec:check`, `api:types:check`                                                                              | none                                             |
| `security`     | Security Scan      | 20 min  | `security:scan`: `lint`, `lint:css`, then `npm audit --audit-level=high`                                         | none                                             |
| `secret-scan`  | Secret Scan        | 10 min  | full-history checkout, gitleaks `8.30.1` binary verified against a hard-coded SHA-256, `gitleaks git . --redact` | none                                             |

Details that decide whether a job fails:

- `format` is deliberately last in `checks`: a formatting failure is auto-fixable, so it must not
  hide a lint or type error in the same run.
- `lint` runs with `--max-warnings=0`, so a warning fails `checks` and `security` alike.
- `e2e` sets `CYPRESS_BASE_URL=http://127.0.0.1:3000`. `cypress-screenshots` warns "No files were
  found" on every passing run; Cypress writes screenshots only when a test fails.
- `secret-scan` is the only job with an explicit `permissions` block (`contents: read`), and it
  installs no Node.

## `frontend-performance` (`performance.yml`)

**Triggers:** `schedule` at `0 2 * * *` (02:00 UTC daily) and `workflow_dispatch`. Both run from the
default branch, `dev`, unless a dispatch names another ref
(`gh workflow run frontend-performance --ref <branch>`).
**Concurrency:** group `frontend-performance-<ref>`, `cancel-in-progress: true`.
**Not a PR gate.** It runs on no push and no pull request.

One job, `performance` (Lighthouse and Bundle Metrics), 45 min timeout:

1. `npm run build`
2. `perf:bundle-size`
3. `npm run start` on `127.0.0.1:3000`, wait up to 120 s
4. `perf:lighthouse`
5. `perf:web-vitals`
6. stop the app; upload `performance-reports` (`reports/performance`, always)

Thresholds, routes, the Lighthouse version and runs per route all live in
`scripts/perf/performance-thresholds.json`. How the Lighthouse gate reads a result (median of the
runs, a redirect fails the route, pinned Lighthouse) is in `.claude/rules/performance.md`.

## Changing a workflow

- Update this page in the same change.
- Pin any new action by commit SHA, never by tag.
- A job that needs a secret is a change of stance, since no job has one today; say so in the PR.
