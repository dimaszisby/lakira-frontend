---
paths:
  - next.config.ts
  - middleware.ts
  - src/app/api/**
  - src/services/api/api.ts
  - cypress.config.ts
  - scripts/perf/**
---

# Environment

Canonical matrix: [`docs/reference/environments.md`](../../docs/reference/environments.md).

## The exposure rule

**Anything prefixed `NEXT_PUBLIC_` is inlined into the client bundle at build time and is readable by anyone who loads the page.** It is not configuration; it is published content.

Before adding one, ask whether the browser genuinely needs it. If a server route can read the value instead, it should. Never put a token, key, secret, or internal hostname behind a `NEXT_PUBLIC_` name — renaming it later does not un-publish the builds that already shipped.

Server-only vars (no prefix) are readable in route handlers, `middleware.ts`, server components, and `next.config.ts`. That is where anything sensitive belongs.

## The matrix

| Var | Public | Used by |
|---|---|---|
| `API_URL` | server | `api/proxy/[...path]`, `api/auth/login` — the backend base URL |
| `NEXT_PUBLIC_API_BASE_URL` | **public** | proxy fallback; `next.config.ts` derives the CSP `connect-src` origin from it |
| `NEXT_PUBLIC_APP_URL` | **public** | SSR origin resolution, first candidate |
| `NEXT_PUBLIC_SITE_URL` | **public** | SSR origin, second candidate |
| `NEXT_PUBLIC_VERCEL_URL` | **public** | SSR origin, third candidate |
| `VERCEL_URL` | server | SSR origin, fourth candidate (Vercel-injected) |
| `HOST`, `PORT` | server | SSR origin fallback, defaults `localhost:3000` |
| `NODE_ENV` | build | dev-only logging; CSP `unsafe-eval` in dev |
| `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` | **public** | feature flag, compared `=== "true"`, gates the "generate dummy data" buttons |
| `TZ` | test | forced to `UTC` in `jest.setup.ts` |
| `CYPRESS_BASE_URL` | CI | Cypress target, default `http://127.0.0.1:3000` |
| `PERF_BASE_URL` | CI | Lighthouse target |
| `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` | Cypress | read via `Cypress.env()`, not `process.env` |

Per environment:

| Env | `API_URL` and `NEXT_PUBLIC_API_BASE_URL` |
|---|---|
| local | `http://localhost:8001/api/v1` |
| preview | `https://lakira-backend-staging.onrender.com/api/v1` |
| production | not finalised |

Keep `API_URL` and `NEXT_PUBLIC_API_BASE_URL` **equal** within an environment. The FE CI secret feeding both is `STAGING_API_BASE_URL`.

## Read env through `src/lib/env.ts`

Do not scatter `process.env` reads through feature code. `src/lib/env.ts` is the one module that touches the environment, and it has two segments:

- **Public** — `clientEnv` and `isDummyActionsEnabled`, covering the `NEXT_PUBLIC_*` vars. Safe to import anywhere.
- **Server** — `getApiBaseUrl()` and `resolveAppOrigin()`. Route handlers, server components, and `middleware.ts` only.

Each variable is referenced as a **literal** `process.env.X` inside that module. Next.js substitutes those literals at build time; a dynamic lookup like `process.env[name]` is never substituted and resolves to `undefined`.

Parsing is deliberately lenient — every field is optional and nothing throws at module load — because `npm run build` runs in CI with no environment at all. Values that are genuinely required fail at the point of use instead: `getApiBaseUrl()` throws in production when nothing is configured, rather than interpolating `undefined` into a request URL.

`NODE_ENV` is exempt and can be read directly.

## Known problems — do not propagate

- **`NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` is absent from both CI/CD env docs.** Fix that when you next touch them.
- **`next.config.ts` still reads `process.env.NEXT_PUBLIC_API_BASE_URL` directly** to derive the CSP `connect-src` origin. It runs before the app's module graph exists and cannot import from `src/`, so this one read stays raw. Keep it in sync with `.env.example` by hand.

## Resolved (kept for context)

These were live problems and are now fixed; do not reintroduce them.

- The three conflicting local API defaults are gone. **`:8001` won.** It is what `docs/tutorials/getting-started.md` and `docs/how-to/development/run-against-a-local-backend.md` tell you to start the backend on, both validated by running them verbatim, and it avoids the macOS AirPlay clash on the backend's own default of `5000`. The competing `:4000` that appeared in some reference prose is retired. The single dev default now lives in `DEV_API_BASE_URL` in `src/lib/env.ts`.
- `src/app/api/auth/login/route.ts` no longer builds `undefined/auth/login`; it calls `getApiBaseUrl()`.
- `.env.example` exists at the repo root, and `.gitignore` carries a `!.env.example` negation so the blanket `.env*` rule does not swallow it.

## Rules for adding a var

1. Decide server-only vs `NEXT_PUBLIC_` using the exposure rule. Default to server-only.
2. Read it in exactly one place and pass the value down. Do not scatter `process.env` reads through feature code.
3. Give it a fallback, or fail loudly at startup. Never let it silently become `undefined` in a URL.
4. Add it to the table above **and** `docs/reference/environments.md`.
5. If it is needed in CI, add it to the workflow; if it is a secret, it goes in GitHub/Vercel secrets and never in the repo.

`.env*` files are gitignored and Claude must not edit them — with one deliberate exception. The global guardrail at `~/.claude/hooks/protect-files.sh` **explicitly allows `.env.example`**, because it is a committed template that holds no secrets. Everything else (`.env`, `.env.local`, …) is blocked; ask the user to make those changes by hand.
