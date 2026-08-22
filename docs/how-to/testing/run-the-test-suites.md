# Run the test suites

Two Jest configs and a Cypress suite. **The filename decides which one a test belongs to.**

## The suites

```bash
npm run test:unit          # *.test.ts(x), *.spec.ts(x) — excludes *.int.test.*
npm run test:integration   # *.int.test.ts(x) only
npm run test:e2e           # Cypress, headless Electron
```

| Suite       | Config                       | Setup                                                                                     |
| ----------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| Unit        | `jest.unit.config.ts`        | `jest.setup.ts` — jest-dom, jest-canvas-mock, jest-axe, ResizeObserver polyfill, `TZ=UTC` |
| Integration | `jest.integration.config.ts` | `jest.integration.setup.ts` — fetch/stream primitives, BroadcastChannel mock, MSW server  |
| E2E         | `cypress.config.ts`          | `cypress/support/e2e.ts`                                                                  |

`jest.config.ts` is the shared base both Jest configs extend. `npm run test:coverage:all` runs
everything through it — local convenience only, CI does not use it.

## A single file

```bash
npx jest --config jest.unit.config.ts src/components/ui/__tests__/Card.test.tsx
npx jest --config jest.integration.config.ts path/to/file.int.test.tsx
npx jest --config jest.unit.config.ts -t "renders with default"   # by test name
```

Watch mode: `npm run test:unit:watch`.

## E2E needs a running app

Cypress does not start the server. Either point it at your dev server:

```bash
npm run dev                     # terminal 1
npm run test:e2e                # terminal 2
```

or reproduce what CI does — build, start, then run:

```bash
npm run build && npm run start &
npm run test:e2e
```

Override the target with `CYPRESS_BASE_URL`.

## What CI runs

Serial chain, each step gated on the last:

```
checks (lint → lint:css → typecheck) → unit → integration → build → e2e
```

plus three independent jobs: `security` (`security:scan`), `secret-scan` (gitleaks), and
`api-contract` (`api:spec:check` + `api:types:check`).

Reproduce the serial part locally:

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run test:unit
```

`/pre-push` runs the full sequence.

## Two things that are not what they look like

- **Integration tests are not MSW-backed in practice.** `src/test-utils/msw/handlers.ts` is an empty
  array while the server runs with `onUnhandledRequest: "error"`. Existing tests mock feature hooks
  at the module level instead. Copy that approach rather than adding a handler and expecting the
  rest of the suite to keep working.
- **Coverage thresholds gate nothing.** They sit at 3/2/3/3 %, and `coverage:check` only fails with
  `--strict`, which nothing passes.

## Rendering with providers

Use `renderWithProviders` from `src/test-utils/renderWithProviders.tsx` — it supplies the Jotai
Provider and a QueryClient with retries off, and accepts `route` and `initialQueryData`. Rendering a
component that uses a query hook with plain `render` fails with a missing-provider error.

## Related

- [`../../explanation/testing-strategy.md`](../../explanation/testing-strategy.md)
- [`../../reference/commands.md`](../../reference/commands.md)
