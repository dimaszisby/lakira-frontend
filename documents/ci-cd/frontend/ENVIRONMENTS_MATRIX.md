# Lakira Frontend - Environments Matrix

## 1. Purpose

This matrix captures FE-relevant CI/CD environment values based on current FE repo behavior plus confirmed backend handoff status.

## 2. Current Status

- Staging backend is active: `https://lakira-backend-staging.onrender.com/api/v1`.
- Production backend URL is not available yet.
- FE production domain is not finalized yet.

## 3. Environment Matrix

| Environment | FE URL | Backend API URL used by FE | Provisioning Source |
| --- | --- | --- | --- |
| `local` | `http://localhost:3000` | Recommended explicit env: `http://localhost:4000/api/v1` | `.env.local` |
| `ci` | n/a (runner) | Not required for current Cypress smoke + unit scope | GitHub Actions |
| `preview` | Vercel preview URL (TBD concrete domain) | `https://lakira-backend-staging.onrender.com/api/v1` | Vercel env config |
| `prod` | FE prod URL not finalized | Backend prod URL not available | Pending |

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

- `API_URL=http://localhost:4000/api/v1`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`

This keeps server route handlers and browser-side API calls aligned.

## 7. Source References

- `.github/workflows/test.yml`
- `package.json`
- `src/app/api/proxy/[...path]/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/services/api/api.ts`
- `next.config.ts`
