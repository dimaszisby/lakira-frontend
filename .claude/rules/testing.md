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

Stack: **Jest 29** (two configs) + React Testing Library + MSW 2 + `jest-axe` + Cypress 15. There is no Vitest and no Playwright — do not introduce either without a decision doc.

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

**To test under Strict Mode, pass `reactStrictMode: true`**, which wraps the whole tree, providers
included, as `next.config.ts` does. A `<StrictMode>` nested inside `renderWithProviders` doubles
renders but **not** effects, so it cannot reproduce anything that depends on the extra
effect-and-subscription cycle `next dev` runs. Measured 2026-09-29; see ADR-0021. The double
render alone can still catch a bug (it caught the Modal remount, measured 2026-09-30), so a
nested wrapper is incomplete, not inert. Use the option regardless.

```tsx
renderWithProviders(<VerifyEmailPanel token={token} />, { reactStrictMode: true });
```

`jest.setup.ts` gives you `@testing-library/jest-dom`, `jest-canvas-mock` (Chart.js needs it), a `ResizeObserver` polyfill, `TZ=UTC`, and `toHaveNoViolations`.

## Integration tests

`*.int.test.tsx`, colocated in the route's `_components/__tests__/`. These render a page-level client component with providers and assert on real interactions.

Every integration test asserts accessibility:

```tsx
const { container } = renderWithProviders(<MetricsPageClient />);
expect(await axe(container)).toHaveNoViolations();
```

**MSW is per-test, not global.** `jest.integration.setup.ts` starts the server with `onUnhandledRequest: "error"`, and `src/test-utils/msw/handlers.ts` is an **empty array by design**. Every suite declares the requests it expects with `server.use()`; any request that escapes fails immediately.

That is deliberate and stricter than a shared handler list — a test cannot pass while silently depending on a response it never declared. **Write your handlers in the test that needs them.** Add to `handlers.ts` only for a request every integration suite would otherwise repeat.

(An earlier version of this rule said existing tests "work around this by mocking feature hooks at the module level." That was wrong: 11 of 16 suites use `server.use()`, the other 5 are layout components with no network calls, and none mocks a feature hook. Corrected 2026-08-27.)

## E2E

Cypress, in four folders. The first pair differ in what they may touch (kit `cypress-a11y-e2e`, D-01); the second pair repeat that split with the Content Security Policy enforced by the browser, which Cypress otherwise strips (ADR-0026):

| Folder | Needs | Runs with | In CI |
|---|---|---|---|
| `cypress/e2e/public/` | the app only | `npm run test:e2e` | yes, the `e2e` job, as two steps |
| `cypress/e2e/stack/` | the app, the backend and Mailpit | `npm run test:e2e:stack` | nightly and on dispatch, `frontend-stack-e2e`; not on pull requests |
| `cypress/e2e/csp/` | the app only | `npm run test:e2e:csp` | yes, the `e2e` job |
| `cypress/e2e/csp-stack/` | the app, the backend and Mailpit | `npm run test:e2e:csp:stack` | nightly and on dispatch, `frontend-stack-e2e`; not on pull requests |

The stack pair run in `.github/workflows/stack-e2e.yml`, which builds lakira-backend `dev` from
source and names the backend commit in its summary (kit `stack-suites-in-ci`, D-01). A pull request
is not gated by them, so run them locally when the gate table in `.claude/rules/workflow.md` says
to.

**The folder is the contract.** A spec in `public/` must not call the backend, because the `e2e`
job runs none.
Anything that signs in, or reads an emailed token, goes in `stack/`. How to run it:
`docs/how-to/testing/run-stack-e2e.md`.

**The filename decides the CI step.** `npm run test:e2e` is two scripts run in turn, and CI runs
each as its own step: `test:e2e:a11y` takes every `*.a11y.cy.ts` in `public/`, so an accessibility
failure is named as one in the run, and `test:e2e:public` takes the rest. Name an axe spec
`<name>.a11y.cy.ts` and it lands in the right step with no list to edit.

- **Accessibility:** `cy.visitInTheme(path, theme)` then `cy.checkPageA11y(label)`, from
  `cypress/support/a11y.ts`. It runs axe's WCAG 2.0/2.1 A and AA rules in a real browser, contrast
  included, and fails on any violation. Check both themes (`THEMES`). The rule set and every
  exclusion live in that one file, and each exclusion cites an ADR or a WCAG criterion.
- **Stack helpers**, in `cypress/support/stack.ts`: `preflightStack()` first in every stack spec's
  `before`, then `newUser()`, `registerUser()`, `signIn()` / `signInSession()` and `tokenFor()`.
  Users are created fresh per run; no credential is stored anywhere. The helpers refuse to run
  unless the app, backend and Mailpit URLs are all local, and the preflight refuses a backend image
  behind backend `dev`: by commit when the image names one on `/health` (build it with `APP_RELEASE`), else by date (`cypress/support/backend-image.ts`; override `E2E_ALLOW_STALE_BACKEND=1`).
- **Email templates** are known only to `cypress/support/mailpit.ts`. When the backend changes a
  subject or a link, that file is the one edit.
- **Configuration** is public and goes through `expose` in `cypress.config.ts`, read with
  `Cypress.expose()`. `allowCypressEnv` is off.
- Cypress's default viewport (1000x660) is below the `lg` breakpoint, so specs see the tablet
  layout, bottom navigation bar included.

`cypress/tsconfig.json` is deliberately separate so Chai globals do not collide with Jest matchers. Keep it that way. `npm run typecheck` checks it as a second project, so the specs are typechecked in CI even where they do not run.

## What to test, and where

| Testing | Suite |
|---|---|
| A pure function, mapper, presenter, key factory, util | unit |
| A single component's rendering and interaction | unit |
| A page composing hooks, routing, and multiple components | integration |
| A full user journey across pages, against a running app | e2e |

## Coverage

**Coverage gates, and has since 2026-08-27.** `jest.config.ts` sets global thresholds of 54 % statements / 45 % branches / 48 % functions / 54 % lines, ratcheted on 2026-10-19 to the whole number below measured coverage, less one (measured 55.61 / 46.14 / 49.74 / 55.13), so a real regression fails while normal fluctuation does not.

**Coverage measures source, not tests.** `collectCoverageFrom` excludes `__tests__/`, `*.test.*` and `src/test-utils/` since 2026-10-19. Before that, the unit run counted its own test files as covered source and every integration test file, which it never executes, as uncovered, so adding an integration suite lowered the figure and four new suites failed the gate. The thresholds before that date (42/43/37/41, and 29/29/26/29 before them) were on that basis and do not compare with today's. Per-folder goals live in `coverage-goals.json`:

| Path | Statement goal |
| --- | --- |
| `src/components/ui` | 80 % |
| `src/lib` | 65 % |
| `src/utils` | 50 % |
| `src/features/metric-categories` | 30 % |
| `src/features/metrics` | 15 % |

`npm run coverage:check` carries `--strict` in the script itself, and `.github/workflows/test.yml` runs it — so a folder falling below its goal fails CI.

**Never lower a threshold to make a build pass.** Raise them as suites grow.

(This section previously described all of it as placeholders — 3/2/3/3 % with `--strict` passed by nothing — and said coverage "gates nothing". That was true until 2026-08-27 and wrong afterwards; corrected 2026-09-13.)

The genuinely untested areas, in rough priority order: `src/services/**` (the whole API and error layer), every feature `hooks/` directory, and all `mappers.ts` / `keys.ts` / `cache.ts` files. `src/components/ui/` is well covered — 28 files, roughly one per primitive.

## Rules

- Test names: `"<verb> <outcome> when <condition>"`.
- Never assert on implementation details — internal state, hook call counts, class names.
- A test that needs `waitFor` around an assertion that should be synchronous is usually hiding a bug in the component.
- Boundary lint rules are off in test files; that is a convenience, not a licence to import across layers in source.
- Fix a flaky test or delete it. Do not retry it.
