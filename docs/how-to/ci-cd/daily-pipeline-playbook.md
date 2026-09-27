# Daily pipeline playbook

What runs, when, and what to do when a job goes red.

## The workflows

Which jobs run, in what order and on what: [`ci-pipeline/workflows.md`](../../reference/ci-pipeline/workflows.md).
The short version: `checks → unit → integration → build → e2e` in series, with `api-contract`,
`security` and `secret-scan` alongside, and `frontend-performance` nightly.

## Reproduce a failure locally

Match the job before debugging anything:

```bash
# checks
npm run lint && npm run lint:css && npm run typecheck && npm run format

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
| `checks`       | Passes locally, fails in CI     | Node version. CI runs the major in `.nvmrc` (24); run `nvm use`.                                           |
| `e2e`          | Times out on first visit        | The app did not start. Check the `build` artifact uploaded and `npm run start` bound to `127.0.0.1:3000`.  |
| `security`     | `npm audit` high finding        | Upgrade the dependency. If it cannot be upgraded, record the exception rather than lowering the threshold. |
| `secret-scan`  | gitleaks hit                    | Rotate the credential first, then remove it from history. A revert does not un-leak it.                    |

## Notes

- **Lint warnings fail CI.** `npm run lint` runs with `--max-warnings=0`, so a `checks` or
  `security` failure reading "ESLint found too many warnings" is a real lint failure: fix the
  warning. See `.claude/rules/code-style.md`.
- **Coverage gates the `unit` job twice.** `test:unit:ci` enforces the global thresholds in
  `jest.config.ts`, and `coverage:check` runs with `--strict` against the per-folder goals in
  `coverage-goals.json`. Never lower either to make a build pass.
- CI uses no secrets. Coverage goes up as a workflow artifact, not to Codecov.

## Related

- [`../../reference/commands.md`](../../reference/commands.md)
- [`../../reference/ci-pipeline/`](../../reference/ci-pipeline/)
- [`../../internal/initiatives/cicd/`](../../internal/initiatives/cicd/)
