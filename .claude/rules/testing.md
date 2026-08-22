---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/*.int.test.ts"
  - "**/*.int.test.tsx"
  - jest.config.ts
  - jest.unit.config.ts
  - jest.integration.config.ts
  - jest.setup.ts
  - jest.integration.setup.ts
  - cypress/**
  - src/test-utils/**
---

# Testing

Full strategy: [`docs/explanation/testing-strategy.md`](../../docs/explanation/testing-strategy.md).

Stack: **Jest 29** (two configs) + React Testing Library + MSW 2 + `jest-axe` + Cypress 14. There is no Vitest and no Playwright — do not introduce either without a decision doc.

## The filename decides the suite

| Filename | Config | Runs under |
|---|---|---|
| `*.int.test.ts(x)` | `jest.integration.config.ts` | `npm run test:integration` **only** |
| `*.test.ts(x)`, `*.spec.ts(x)` | `jest.unit.config.ts` | `npm run test:unit` **only** |

`jest.unit.config.ts` explicitly excludes `*.int.test.*`. **Never put both kinds in one file** — one of them will silently never run.

Both configs extend `jest.config.ts`, which owns the alias mapper (kept in sync with `tsconfig.json`), `identity-obj-proxy` for CSS, and the `transformIgnorePatterns` allowance for `msw`.

## Unit tests

Colocate in `__tests__/` beside the source. Render through `renderWithProviders` from `src/test-utils/renderWithProviders.tsx` — it supplies the Jotai `Provider` and a `QueryClientProvider` with retries disabled, and accepts `route` and `initialQueryData`.

```tsx
renderWithProviders(<MetricCard metric={metric} />, { route: "/metrics" });
```

Query by accessible role and name, not by test id or class. Prefer `userEvent` over `fireEvent`.

`jest.setup.ts` gives you `@testing-library/jest-dom`, `jest-canvas-mock` (Chart.js needs it), a `ResizeObserver` polyfill, `TZ=UTC`, and `toHaveNoViolations`.

## Integration tests

`*.int.test.tsx`, colocated in the route's `_components/__tests__/`. These render a page-level client component with providers and assert on real interactions.

Every integration test asserts accessibility:

```tsx
const { container } = renderWithProviders(<MetricsPageClient />);
expect(await axe(container)).toHaveNoViolations();
```

**The MSW trap:** `jest.integration.setup.ts` starts the server with `onUnhandledRequest: "error"`, and `src/test-utils/msw/handlers.ts` is currently an **empty array**. Any test that lets a real request escape fails immediately. Existing tests work around this by mocking feature hooks at the module level. When you add network-level handlers, add them to `handlers.ts` — do not call `server.use()` with a one-off in each file unless the handler is genuinely test-specific.

## E2E

Cypress, `cypress/e2e/**/*.cy.ts`. `cy.loginAsTestUser()` and `cy.setInvalidAuthToken()` exist in `cypress/support/commands.ts` and read `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` from `Cypress.env()`. Only one spec exists today (`home.cy.ts`), and the auth helpers are unused — new authed flows are the obvious place to grow this.

`cypress/tsconfig.json` is deliberately separate so Chai globals do not collide with Jest matchers. Keep it that way.

## What to test, and where

| Testing | Suite |
|---|---|
| A pure function, mapper, presenter, key factory, util | unit |
| A single component's rendering and interaction | unit |
| A page composing hooks, routing, and multiple components | integration |
| A full user journey across pages, against a running app | e2e |

## Coverage

`jest.config.ts` thresholds are placeholders (3/2/3/3 %), as are the per-folder goals in `coverage-goals.json` (2–5 %), and `scripts/coverage-checklist.mjs` only fails with `--strict`, which nothing passes. **Coverage is reported to Codecov but gates nothing.** Do not cite the threshold as evidence a change is tested.

The genuinely untested areas, in rough priority order: `src/services/**` (the whole API and error layer), `src/app/api/**` (proxy and auth route handlers), `middleware.ts`, every feature `hooks/` directory, and all `mappers.ts` / `keys.ts` / `cache.ts` files. `src/components/ui/` is well covered — 28 files, roughly one per primitive.

## Rules

- Test names: `"<verb> <outcome> when <condition>"`.
- Never assert on implementation details — internal state, hook call counts, class names.
- A test that needs `waitFor` around an assertion that should be synchronous is usually hiding a bug in the component.
- Boundary lint rules are off in test files; that is a convenience, not a licence to import across layers in source.
- Fix a flaky test or delete it. Do not retry it.
