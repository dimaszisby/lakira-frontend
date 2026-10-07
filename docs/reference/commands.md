# Commands Reference

**Purpose:** the single source of truth for this repo's npm scripts.
**Owner:** whoever changes `package.json` scripts.

This file is checked against `package.json` by `src/__tests__/commands-doc.test.ts`, in the unit gate: every script needs a table row with its name in the first cell, and every `npm run` named here has to exist. The test checks names, not descriptions. If you add, rename, or remove a script, update this file in the same commit. Do not keep a second copy of this list anywhere — link here instead.

---

## Development

| Command                    | What it does                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`              | Next dev server on `:3000`, with `--inspect` and `--trace-warnings`.                                                              |
| `npm run build`            | Production build.                                                                                                                 |
| `npm run start`            | Serve the production build. Requires `npm run build` first.                                                                       |
| `npm run next:cache:clear` | Remove `.next` and run `next clean`. First thing to try on inexplicable build behaviour.                                          |
| `npm run build:css`        | Standalone Tailwind CLI pass into `src/styles/output.css`. Not part of the normal build — see the note under Generated artifacts. |

## Quality gates

| Command                             | What it does                                                              |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `npm run typecheck`                 | `tsc --noEmit`, then the same over `cypress/tsconfig.json`.               |
| `npm run lint` / `lint:fix`         | ESLint across the repo. `lint` fails on any warning (`--max-warnings=0`). |
| `npm run lint:css` / `lint:css:fix` | Stylelint over `src/**/*.{css,pcss}`.                                     |
| `npm run format` / `format:fix`     | Prettier check / write.                                                   |

## Tests

| Command                      | What it does                                                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test`               | Alias for `test:unit`.                                                                                                                                                                  |
| `npm run test:unit`          | `jest.unit.config.ts` — `*.test.ts(x)` and `*.spec.ts(x)`, **excluding** `*.int.test.*`.                                                                                                |
| `npm run test:unit:watch`    | Same, in watch mode.                                                                                                                                                                    |
| `npm run test:unit:ci`       | Same, with coverage. What CI runs.                                                                                                                                                      |
| `npm run test:integration`   | `jest.integration.config.ts` — `*.int.test.ts(x)` only. No coverage.                                                                                                                    |
| `npm run test:coverage:all`  | Both suites via the base `jest.config.ts`. Local convenience only; CI does not use it.                                                                                                  |
| `npm run test:e2e`           | Cypress, headless Electron, `cypress/e2e/public/` only. Needs the app running on `CYPRESS_BASE_URL`. What CI runs.                                                                      |
| `npm run test:e2e:stack`     | Cypress, `cypress/e2e/stack/` only. Needs the app, backend and Mailpit locally; never in CI. See `docs/how-to/testing/run-stack-e2e.md`.                                                |
| `npm run test:e2e:csp`       | Cypress, `cypress/e2e/csp/` only, with the Content Security Policy enforced by the browser (the other suites run with it stripped). Needs the app running. CI runs it after `test:e2e`. |
| `npm run test:e2e:csp:stack` | The same enforcement on the signed-in pages, `cypress/e2e/csp-stack/`. Needs the app, backend and Mailpit locally; never in CI.                                                         |

Single file:

```bash
npx jest --config jest.unit.config.ts path/to/file.test.ts
npx jest --config jest.integration.config.ts path/to/file.int.test.tsx
```

**The filename decides the suite.** `*.int.test.ts(x)` runs only under integration; everything else runs only under unit. Never mix both kinds in one file.

## Performance

| Command                    | What it does                                                                                                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run perf:bundle-size` | Sums `.next/static/chunks` against `scripts/perf/performance-thresholds.json`. Needs a build.                                                |
| `npm run perf:lighthouse`  | Pinned Lighthouse, three runs per configured route, gated on the median; a redirected route fails. Needs the app running on `PERF_BASE_URL`. |
| `npm run perf:web-vitals`  | Derives a lab Web Vitals summary from the Lighthouse output. Lab-derived, not RUM.                                                           |
| `npm run coverage:check`   | Compares coverage against `coverage-goals.json`, with `--strict`, so an unmet goal fails. CI's `unit` job runs it.                           |

## Security

| Command                       | What it does                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run security:lint`       | `lint` + `lint:css`.                                                                                 |
| `npm run security:audit`      | `npm audit --omit=dev --audit-level=high`: production dependencies only.                             |
| `npm run security:audit:full` | `npm audit --audit-level=high`: every dependency. What the nightly `dependency-audit` workflow runs. |
| `npm run security:scan`       | `security:lint` + `security:audit`. What CI's `security` job runs.                                   |

## API contract

| Command                      | What it does                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `npm run api:spec:sync`      | Refetch `docs/reference/api/lakira-backend-openapi.json` from lakira-backend. |
| `npm run api:spec:check`     | Fail if the local snapshot differs from the backend's.                        |
| `npm run api:types:generate` | Regenerate `src/types/api/generated/lakira-backend.d.ts` from the snapshot.   |
| `npm run api:types:check`    | Fail if the committed types differ from a fresh generation.                   |

---

## Known-broken

## Generated artifacts — never hand-edit

- `src/styles/output.css` → `npm run build:css`
- `docs/reference/api/lakira-backend-openapi.json` → `npm run api:spec:sync`
- `src/types/api/generated/**` → `npm run api:types:generate`
- `.next/`, `coverage/`, `reports/`, `cypress/videos/`, `cypress/screenshots/`

## What CI runs

[`ci-pipeline/workflows.md`](./ci-pipeline/workflows.md) is the one description of both workflows:
jobs, order, triggers and what each runs.

Before proposing a change is complete, run what `checks` runs plus the suite you touched. `/pre-push` does the whole sequence.
