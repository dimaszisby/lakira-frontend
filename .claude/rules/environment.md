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
| local | `http://localhost:4000/api/v1` |
| preview | `https://lakira-backend-staging.onrender.com/api/v1` |
| production | not finalised |

Keep `API_URL` and `NEXT_PUBLIC_API_BASE_URL` **equal** within an environment. The FE CI secret feeding both is `STAGING_API_BASE_URL`.

## Known problems — do not propagate

- **Three conflicting local defaults are in circulation.** The proxy hardcodes `http://localhost:8001/api/v1`; the CI/CD docs recommend `:4000`; the app itself runs on `:3000`. The backend handoff says its dev server is `:4000` while the backend's own rules say `:5000`. Confirm the actual port before wiring anything, and do not add a fourth default.
- **`src/app/api/auth/login/route.ts` reads `API_URL` with no fallback** — unset, it builds `undefined/auth/login`. Any new server route reading env should fall back or fail loudly.
- **There is no `.env.example` and no runtime validation.** Env is read as bare `process.env.X` with inline `??` chains. Until that changes, every new var must be added to the table above and to `ENVIRONMENTS_MATRIX.md` in the same commit — that documentation is the only inventory that exists.
- **`NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` is absent from both CI/CD env docs.** Fix that when you next touch them.

## Rules for adding a var

1. Decide server-only vs `NEXT_PUBLIC_` using the exposure rule. Default to server-only.
2. Read it in exactly one place and pass the value down. Do not scatter `process.env` reads through feature code.
3. Give it a fallback, or fail loudly at startup. Never let it silently become `undefined` in a URL.
4. Add it to the table above **and** `docs/reference/environments.md`.
5. If it is needed in CI, add it to the workflow; if it is a secret, it goes in GitHub/Vercel secrets and never in the repo.

`.env*` files are gitignored by a blanket rule and Claude cannot edit them — that is a global guardrail. Ask the user to make env changes by hand.
