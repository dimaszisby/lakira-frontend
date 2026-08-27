# Lakira Frontend - Environments Matrix

## 1. Purpose

This matrix captures FE-relevant CI/CD environment values based on current FE repo behavior plus confirmed backend handoff status.

## 2. Current Status

- Staging backend `https://lakira-backend-staging.onrender.com/api/v1` is **not usable** as of
  2026-08-22. Its Render Postgres instance was deleted, so `start:staging` fails at `db:migrate`
  with `getaddrinfo ENOTFOUND dpg-…` and the service crash-loops. TCP connects and no response ever
  arrives. Restoring it needs a new database provisioned and `DATABASE_URL` repointed.
- Local development runs the backend directly — see
  [`../how-to/development/run-against-a-local-backend.md`](../how-to/development/run-against-a-local-backend.md).
- Production backend URL is not available yet.
- FE production domain is not finalized yet.

## 3. Environment Matrix

> Copy `.env.example` to `.env.local` to get the local column pre-filled.

| Environment | FE URL                                   | Backend API URL used by FE                                                                               | Provisioning Source |
| ----------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------- |
| `local`     | `http://localhost:3000`                  | `http://localhost:8001/api/v1` (the frontend's built-in dev default; start the backend with `PORT=8001`) | `.env.local`        |
| `ci`        | n/a (runner)                             | Not required for current Cypress smoke + unit scope                                                      | GitHub Actions      |
| `preview`   | Vercel preview URL (TBD concrete domain) | `https://lakira-backend-staging.onrender.com/api/v1` — **currently down**, see Current Status            | Vercel env config   |
| `prod`      | FE prod URL not finalized                | Backend prod URL not available                                                                           | Pending             |

## 4. FE Runtime Env Vars Used In Code

- `API_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VERCEL_URL`
- `VERCEL_URL`
- `HOST`, `PORT`

## 5. CI Secrets

Currently required by workflow:

- `CODECOV_TOKEN`

Not currently required by this FE workflow:

- `STAGING_API_BASE_URL`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 6. Local Configuration Recommendation

Use explicit local env values to avoid auth/proxy mismatch:

- `API_URL=http://localhost:8001/api/v1`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1`

This keeps server route handlers and browser-side API calls aligned.

## 7. Source References

- `.github/workflows/test.yml`
- `package.json`
- `src/app/api/proxy/[...path]/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/services/api/api.ts`
- `next.config.ts`
