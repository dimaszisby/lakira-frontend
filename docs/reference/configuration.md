# Configuration

Every environment variable this app reads, where it is read, and what happens when it is absent.

For the per-environment matrix of which value goes where, see
[`environments.md`](./environments.md). For how the proxy uses `API_URL`, see
[`routes-and-proxy.md`](./routes-and-proxy.md).

## The `NEXT_PUBLIC_` rule

Next.js inlines any variable prefixed `NEXT_PUBLIC_` into the client bundle at build time. It is
**readable by anyone who loads the page**, and it is baked in at build, not read at runtime.

Two consequences that are easy to get wrong:

- **Never put a secret behind `NEXT_PUBLIC_`.** There is no such thing as a private
  `NEXT_PUBLIC_` value. A token, key, or connection string with that prefix is published.
- **Changing one requires a rebuild.** Restarting the server does not pick up a new value, because
  the old one is already compiled into the JS that ships.

Server-only variables (no prefix) are read at runtime and never reach the browser. `API_URL` is
deliberately unprefixed for this reason — see below.

## Runtime variables

| Variable                           | Scope  | Read by                                            | Default / fallback                       | Notes                                                                                                      |
| ---------------------------------- | ------ | -------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `API_URL`                          | Server | `src/app/api/proxy/[...path]/route.ts`             | falls back to `NEXT_PUBLIC_API_BASE_URL` | The backend origin the proxy forwards to. Preferred over the public one — it stays server-side.            |
| `NEXT_PUBLIC_API_BASE_URL`         | Client | proxy fallback; `next.config.ts` CSP `connect-src` | `http://localhost:8001/api/v1`           | Also derives the CSP `connect-src` origin, so a wrong value breaks fetches at the browser, not the server. |
| `NEXT_PUBLIC_APP_URL`              | Client | app URL construction                               | —                                        |                                                                                                            |
| `NEXT_PUBLIC_SITE_URL`             | Client | canonical site URL                                 | —                                        |                                                                                                            |
| `NEXT_PUBLIC_VERCEL_URL`           | Client | preview deploy URL                                 | injected by Vercel                       | Preview deployments only.                                                                                  |
| `VERCEL_URL`                       | Server | preview deploy URL                                 | injected by Vercel                       |                                                                                                            |
| `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` | Client | dummy-data mutation hooks                          | off                                      | Gates the `create-dummy` mutations. Keep off outside local development.                                    |
| `NODE_ENV`                         | Server | dev-only diagnostics, test setup                   | set by the toolchain                     | Never set by hand.                                                                                         |
| `HOST` / `PORT`                    | Server | `npm run start`                                    | `localhost` / `3000`                     |                                                                                                            |

## Tooling-only variables

Read by scripts, never by the app:

| Variable                | Read by                             | Purpose                                                                             |
| ----------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `LAKIRA_OPENAPI_URL`    | `scripts/api/sync-openapi-spec.mjs` | Override the spec source URL entirely.                                              |
| `LAKIRA_OPENAPI_BRANCH` | `scripts/api/sync-openapi-spec.mjs` | Which `lakira-backend` branch to sync from. Defaults to `dev` — see the note below. |
| `LAKIRA_BACKEND_PATH`   | `scripts/api/sync-openapi-spec.mjs` | Sync from a local backend checkout instead of GitHub.                               |
| `PERF_BASE_URL`         | `scripts/perf/*.mjs`                | Target for Lighthouse and Web Vitals runs.                                          |
| `CYPRESS_BASE_URL`      | `cypress.config.ts`                 | Target for the e2e suite.                                                           |

> The OpenAPI spec lives only on the backend's `dev` branch — not `staging`, not `main`. The
> contract this repo generates against is therefore **ahead of** the staging deployment that preview
> builds actually call. Override `LAKIRA_OPENAPI_BRANCH` once the backend promotes it.

## Where secrets are not

- There is no `.env` committed to this repo, and none should be.
- The only secret currently used in CI is `CODECOV_TOKEN`.
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` appear in the environments matrix as
  _not currently required_ — deploys are not driven from CI today.

## Related

- Security headers and the CSP that `NEXT_PUBLIC_API_BASE_URL` feeds: `next.config.ts`
- The agent-facing summary of this rule: [`../../.claude/rules/environment.md`](../../.claude/rules/environment.md)
