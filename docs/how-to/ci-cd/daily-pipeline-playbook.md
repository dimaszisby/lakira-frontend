# Daily pipeline playbook

What runs, when, and what to do when a job goes red.

## The workflows

**`frontend-ci`** (`.github/workflows/test.yml`) — on push and PR to `main` and `dev`. Node 20,
`npm ci`.

Serial chain, each gated on the last:

```
checks (lint → lint:css → typecheck) → unit → integration → build → e2e
```

`build` passes its `.next` artifact to `e2e`, which boots `npm run start` on `127.0.0.1:3000` and
uploads Cypress videos and screenshots.

Three independent jobs run alongside:

| Job            | Runs                                                            |
| -------------- | --------------------------------------------------------------- |
| `security`     | `npm run security:scan` (lint + `npm audit --audit-level=high`) |
| `secret-scan`  | gitleaks                                                        |
| `api-contract` | `npm run api:spec:check` and `npm run api:types:check`          |

**`frontend-performance`** (`.github/workflows/performance.yml`) — nightly at 02:00 UTC and on
manual dispatch. Build → `perf:bundle-size` → start → `perf:lighthouse` → `perf:web-vitals`,
uploading `reports/performance`. Thresholds live in `scripts/perf/performance-thresholds.json`.

## Reproduce a failure locally

Match the job before debugging anything:

```bash
# checks
npm run lint && npm run lint:css && npm run typecheck

# unit / integration
npm run test:unit
npm run test:integration

# api-contract
npm run api:spec:check && npm run api:types:check

# e2e — needs the app running
npm run build && npm run start &
npm run test:e2e
```

`/pre-push` runs the whole sequence.

## Common failures

| Job            | Symptom                         | Fix                                                                                                        |
| -------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `api-contract` | "generated API types are stale" | `npm run api:types:generate`, commit the result.                                                           |
| `api-contract` | "snapshot has drifted"          | `npm run api:spec:sync`, then regenerate types. Commit both.                                               |
| `checks`       | Passes locally, fails in CI     | Node version. CI is on 20.                                                                                 |
| `e2e`          | Times out on first visit        | The app did not start. Check the `build` artifact uploaded and `npm run start` bound to `127.0.0.1:3000`.  |
| `security`     | `npm audit` high finding        | Upgrade the dependency. If it cannot be upgraded, record the exception rather than lowering the threshold. |
| `secret-scan`  | gitleaks hit                    | Rotate the credential first, then remove it from history. A revert does not un-leak it.                    |

## Notes

- **Lint warnings do not fail CI.** There is a standing backlog (import order, Tailwind class order,
  react-refresh, sonarjs, react-hooks). Leave every file you touch warning-free; do not try to clear
  the backlog in an unrelated PR.
- **Coverage gates nothing.** Thresholds sit at 3/2/3/3 % and `coverage:check` only fails with
  `--strict`, which nothing passes. A green coverage step is not evidence of coverage.
- The only CI secret in use is `CODECOV_TOKEN`.

## Related

- [`../../reference/commands.md`](../../reference/commands.md)
- [`../../reference/ci-pipeline/`](../../reference/ci-pipeline/)
- [`../../internal/initiatives/cicd/`](../../internal/initiatives/cicd/)
