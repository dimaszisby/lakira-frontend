# Commands Reference

**Purpose:** the single source of truth for this repo's npm scripts.
**Owner:** whoever changes `package.json` scripts.

This file is checked against `package.json`. If you add, rename, or remove a script, update this file in the same commit. Do not keep a second copy of this list anywhere — link here instead.

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

| Command                             | What it does                          |
| ----------------------------------- | ------------------------------------- |
| `npm run typecheck`                 | `tsc --noEmit`.                       |
| `npm run lint` / `lint:fix`         | ESLint across the repo.               |
| `npm run lint:css` / `lint:css:fix` | Stylelint over `src/**/*.{css,pcss}`. |
| `npm run format` / `format:fix`     | Prettier check / write.               |

## Tests

| Command                     | What it does                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run test`              | Alias for `test:unit`.                                                                   |
| `npm run test:unit`         | `jest.unit.config.ts` — `*.test.ts(x)` and `*.spec.ts(x)`, **excluding** `*.int.test.*`. |
| `npm run test:unit:watch`   | Same, in watch mode.                                                                     |
| `npm run test:unit:ci`      | Same, with coverage. What CI runs.                                                       |
| `npm run test:integration`  | `jest.integration.config.ts` — `*.int.test.ts(x)` only. No coverage.                     |
| `npm run test:coverage:all` | Both suites via the base `jest.config.ts`. Local convenience only; CI does not use it.   |
| `npm run test:e2e`          | Cypress, headless Electron. Needs the app already running on `CYPRESS_BASE_URL`.         |

Single file:

```bash
npx jest --config jest.unit.config.ts path/to/file.test.ts
npx jest --config jest.integration.config.ts path/to/file.int.test.tsx
```

**The filename decides the suite.** `*.int.test.ts(x)` runs only under integration; everything else runs only under unit. Never mix both kinds in one file.

## Performance

| Command                    | What it does                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run perf:bundle-size` | Sums `.next/static/chunks` against `scripts/perf/performance-thresholds.json`. Needs a build.                |
| `npm run perf:lighthouse`  | Lighthouse over the configured routes. Needs the app running on `PERF_BASE_URL`.                             |
| `npm run perf:web-vitals`  | Derives a lab Web Vitals summary from the Lighthouse output. Lab-derived, not RUM.                           |
| `npm run coverage:check`   | Compares coverage against `coverage-goals.json`. Only fails with `--strict`, which nothing currently passes. |

## Security

| Command                  | What it does                                      |
| ------------------------ | ------------------------------------------------- |
| `npm run security:lint`  | `lint` + `lint:css`.                              |
| `npm run security:audit` | `npm audit --audit-level=high`.                   |
| `npm run security:scan`  | Both of the above. What CI's `security` job runs. |

## API contract

| Command                      | What it does                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `npm run api:spec:sync`      | Refetch `docs/reference/api/lakira-backend-openapi.json` from lakira-backend. |
| `npm run api:spec:check`     | Fail if the local snapshot differs from the backend's.                       |
| `npm run api:types:generate` | Regenerate `src/types/api/generated/lakira-backend.d.ts` from the snapshot.  |
| `npm run api:types:check`    | Fail if the committed types differ from a fresh generation.                  |

---

## Known-broken

- `npm run check-accessibility` is a placeholder that installs `axe-core` and echoes. It does not check anything. Do not wire it into a gate.

## Generated artifacts — never hand-edit

- `src/styles/output.css` → `npm run build:css`
- `docs/reference/api/lakira-backend-openapi.json` → `npm run api:spec:sync`
- `src/types/api/generated/**` → `npm run api:types:generate`
- `.next/`, `coverage/`, `reports/`, `cypress/videos/`, `cypress/screenshots/`

## What CI runs

`.github/workflows/test.yml` (`frontend-ci`), on push and PR to `main` and `dev`, as a strict serial chain plus three independent jobs:

```
checks (lint, lint:css, typecheck) → unit → integration → build → e2e
security      (independent)
secret-scan   (independent, gitleaks)
api-contract  (independent)
```

`.github/workflows/performance.yml` (`frontend-performance`) runs nightly at 02:00 UTC and on manual dispatch.

Before proposing a change is complete, run what `checks` runs plus the suite you touched. `/pre-push` does the whole sequence.
