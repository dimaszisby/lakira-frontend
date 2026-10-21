# CI workflows

What each GitHub Actions workflow runs, in what order, and on what. Checked against
`.github/workflows/test.yml` and `.github/workflows/performance.yml` on 2026-09-26, and
`.github/workflows/dependency-audit.yml` on 2026-10-02, and `.github/workflows/stack-e2e.yml` on
2026-10-21.

This page is the one description of the pipeline. What to do when a job goes red is in the
[daily pipeline playbook](../../how-to/ci-cd/daily-pipeline-playbook.md); the npm scripts are in
[`commands.md`](../commands.md).

## Common to every job

| Setting         | Value                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runner          | `ubuntu-26.04`, pinned; not `ubuntu-latest`. Moving to the next Ubuntu is a deliberate PR, like a Node major.                                                  |
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
checks ──────┐
unit ────────┤
integration ─┤
build → e2e ─┼─→ ci ("CI passed")
api-contract ┤
security ────┤
secret-scan ─┘
```

Every job starts at once except `e2e`, which needs the `.next` artifact `build` uploads. `ci`,
named "CI passed", needs all eight, runs `if: always()`, and fails unless each one succeeded: a
failed, skipped or cancelled job fails it, and its log lists every job's result. It is the check
to require when branch protection is set up (register F-24). Until 2026-10-21 the jobs from
`checks` to `e2e` were a `needs` chain, about 12 to 14 minutes for 2 to 3 minutes of work; the
first runs after it took 5m37s on a pull request and 5m16s on `dev`
([ADR-0036](../../explanation/decisions/adr-0036-ci-runs-its-jobs-in-parallel-behind-a-gate.md)).

Only `e2e` downloads the Cypress binary, from a cache keyed on `package-lock.json`. Every other
job sets `CYPRESS_INSTALL_BINARY=0`, so `npm ci` skips the download; typecheck needs only the
package's bundled types.

| Job            | Name               | Timeout | Runs, in order                                                                                                                                                                    | Uploads                                          |
| -------------- | ------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `checks`       | Static checks      | 15 min  | `lint`, `lint:css`, `typecheck`, `format`                                                                                                                                         | none                                             |
| `unit`         | Unit tests         | 20 min  | `test:unit:ci` (global coverage thresholds), `coverage:check` (per-folder goals, `--strict`)                                                                                      | `coverage-report` (always)                       |
| `integration`  | Integration tests  | 20 min  | `test:integration`                                                                                                                                                                | none                                             |
| `build`        | Build              | 20 min  | `build`                                                                                                                                                                           | `next-build` (`.next`, hidden files included)    |
| `e2e`          | E2E tests          | 30 min  | downloads `next-build`, `npm run start` on `127.0.0.1:3000`, waits up to 120 s for it, `test:e2e:public`, `test:e2e:a11y` (the accessibility step), `test:e2e:csp`, stops the app | `cypress-videos`, `cypress-screenshots` (always) |
| `api-contract` | API Contract Drift | 10 min  | `api:spec:check`, `api:types:check`                                                                                                                                               | none                                             |
| `security`     | Security Scan      | 20 min  | `security:scan`: `lint`, `lint:css`, then `npm audit --omit=dev --audit-level=high` (production dependencies only)                                                                | none                                             |
| `secret-scan`  | Secret Scan        | 10 min  | full-history checkout, gitleaks `8.30.1` binary verified against a hard-coded SHA-256, `gitleaks git . --redact`                                                                  | none                                             |
| `ci`           | CI passed          | 5 min   | `needs` all eight jobs, `if: always()`; prints each result, fails unless all are `success`                                                                                        | none                                             |

Details that decide whether a job fails:

- `format` is deliberately last in `checks`: a formatting failure is auto-fixable, so it must not
  hide a lint or type error in the same run.
- `lint` runs with `--max-warnings=0`, so a warning fails `checks` and `security` alike.
- `e2e` runs `cypress/e2e/public/` in two steps. "Run E2E tests" takes the home spec and the
  `/login` keyboard check. "Run accessibility checks on the public pages" takes axe over every
  public page in both themes, contrast included, so an accessibility failure is named as one; it
  prints the rule, the element and axe's reason in the job log. Then `cypress/e2e/csp/` runs with
  the Content Security Policy enforced. The job has no backend, so `cypress/e2e/stack/` and
  `cypress/e2e/csp-stack/` do not run here; they run nightly in `frontend-stack-e2e`, below.
- `checks` covers the Cypress specs anyway: `typecheck` includes `cypress/tsconfig.json`, and
  `lint` covers `cypress/`.
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

## `dependency-audit` (`dependency-audit.yml`)

**Triggers:** `schedule` at `0 3 * * *` (03:00 UTC daily) and `workflow_dispatch`
(`gh workflow run dependency-audit`). Scheduled runs use the default branch, `dev`.
**Concurrency:** group `dependency-audit-<ref>`, `cancel-in-progress: false`, so a dispatched run
cannot cancel the nightly one.
**Permissions:** `contents: read`.
**Not a PR gate.** It runs on no push and no pull request.

One job, `audit` (Full dependency audit), 10 min timeout: checkout, setup-node from `.nvmrc`, then
`security:audit:full`. There is no `npm ci`: `npm audit` reads `package-lock.json`, so no package
code runs. Pull requests audit production dependencies only; this is where an advisory in
development tooling surfaces ([ADR-0023](../../explanation/decisions/adr-0023-pull-requests-block-on-production-advisories-only.md)).
A failed scheduled run is sent to whoever last edited the cron line, and GitHub disables the
schedule after 60 days without repository activity.

## `frontend-stack-e2e` (`stack-e2e.yml`)

**Triggers:** `schedule` at `0 4 * * *` (04:00 UTC daily), `workflow_dispatch`
(`gh workflow run frontend-stack-e2e`), and a `pull_request` to `dev` that changes
`.github/workflows/stack-e2e.yml` itself. That last trigger exists because a workflow can be
neither dispatched nor scheduled before it is on the default branch.
**Concurrency:** group `frontend-stack-e2e-<ref>`, `cancel-in-progress: false`.
**Permissions:** `contents: read`.
**Not a PR gate.** No other pull request runs it (kit `stack-suites-in-ci`, D-01).

One job, `stack-e2e` (Stack E2E, signed in, real backend), 45 min timeout. It checks out this
repository to `lakira-frontend/` and lakira-backend `dev` to `lakira-backend/`, side by side, then:

1. writes the backend's `.env` from its `.env.example`, with `JWT_SECRET` generated for the run and
   `DISABLE_RATE_LIMITING=true`;
2. `docker compose up -d --wait db redis rabbitmq mailpit` from the backend's own Compose file;
3. in the backend: `npm ci`, `migrate:development`;
4. builds and starts the backend's `app` service with `APP_RELEASE` set to its commit, and waits
   up to 180 s for `/api/v1/health`;
5. writes the backend commit, `/health`'s `release` and the frontend commit to the run summary;
6. in this repository: `npm ci`, `build` and `start` with `API_URL` and `NEXT_PUBLIC_API_BASE_URL`
   set to `http://localhost:8001/api/v1` and `NEXT_PUBLIC_APP_URL` to `http://127.0.0.1:3000`,
   waiting up to 120 s for the app. Without `NEXT_PUBLIC_APP_URL`, the server's own requests to
   `/api/proxy` go to `https://localhost:3000`, and every page that loads its data on the server
   renders 404;
7. `test:e2e:stack`, then `test:e2e:csp:stack`, each its own step; the second runs even when the
   first fails, with `--config trashAssetsBeforeRuns=false` so it keeps the first's videos and
   screenshots;
8. stops the app, prints the backend's log on failure, uploads `stack-cypress-videos` and
   `stack-cypress-screenshots` (always), and takes the stack down.

It reads no secret: lakira-backend is public, and every user the specs need is created during the
run. The stack helpers still refuse any non-local URL (`cypress/support/stack.ts`).

## Changing a workflow

- Update this page in the same change.
- Pin any new action by commit SHA, never by tag, and any new job's runner to the same `ubuntu-26.04` as the others.
- A job that needs a secret is a change of stance, since no job has one today; say so in the PR.
