# Lakira Backend To Frontend CI/CD Handoff (FE-Aligned)

As of **February 15, 2026**, this document captures backend details needed by this FE repo and marks what remains unresolved.

## 1. Environment Status

- **Staging backend is active** and currently documented as: `https://lakira-backend-staging.onrender.com/api/v1`
- **Production backend web-service URL is not available yet**

## 2. FE-Consumed Backend Variables

Current FE runtime expects:

- `API_URL`
- `NEXT_PUBLIC_API_BASE_URL`

Notes:

- `/api/auth/login` route uses `API_URL` directly.
- `/api/proxy/[...path]` resolves upstream as `API_URL` -> `NEXT_PUBLIC_API_BASE_URL` -> fallback `http://localhost:8001/api/v1`.

## 3. FE/BE Release Dependency Rule

| Change type | Independent deploy allowed? | Recommended order |
| --- | --- | --- |
| FE-only (no API contract impact) | Yes | FE anytime |
| BE-only internal (no API contract impact) | Yes | BE anytime |
| Backward-compatible API changes | Coordinate | BE staging first, then FE |
| Breaking API changes | No | Versioning + coordinated rollout |

## 4. Smoke Checks Before Full FE CD

Recommended backend checks to keep in release flow:

- `GET /api/v1/health`
- auth login/profile flow
- one protected metrics endpoint fetch

## 5. Backend-Only References (External)

The following are backend-owned and not sourced from FE code:

- backend deployment lifecycle and promotion jobs
- backend contract test seed/token operational details
- backend production URL once provisioned

## 6. Practical Recommendation For FE Local Reliability

Keep local FE config explicit and aligned:

- `API_URL=http://localhost:4000/api/v1`
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`

Reason:

- avoids divergence between auth server route (`API_URL`) and proxy/client routing behavior.

## 7. FE Source References

- `.github/workflows/test.yml`
- `src/app/api/proxy/[...path]/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/services/api/api.ts`
- `next.config.ts`
