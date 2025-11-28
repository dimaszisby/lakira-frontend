# Lakira Frontend – Security Audit Log

## Cycle: 2025-11-21 – Hardening Sprint

| ID | Area | Description | Status | Evidence / Notes |
| --- | --- | --- | --- | --- |
| FE-HARDEN-001 | Authentication | Added `/api/auth/session` route + middleware to persist bearer tokens in HttpOnly cookies for server-side gating. Middleware now blocks `/dashboard`, `/metrics`, `/metric-categories` when `lakira_token` missing. | Shipped | `src/app/api/auth/session/route.ts`, `middleware.ts`, `src/features/auth/hooks/login.mutation.ts`, `src/features/auth/hooks/logout.mutation.ts`, `src/features/auth/session.client.ts`. |
| FE-HARDEN-002 | Config / Headers | Enabled CSP, HSTS, Referrer-Policy, Permissions-Policy, XFO, X-DNS-Prefetch via `next.config.ts` and moved the inline theme bootstrapper to `public/scripts/theme-init.js`. | Shipped | `next.config.ts`, `src/app/ThemeScript.tsx`, `public/scripts/theme-init.js`. |
| FE-HARDEN-003 | Feature Flags | Wrapped the Metrics “Add Dummy” action behind `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` so production users cannot spam the dummy endpoint. Sanitized its error output. | Shipped | `src/app/(app)/metrics/page.tsx`. |
| FE-HARDEN-004 | Error Hygiene | Introduced `sanitizeErrorMessage` utility, wired it into `ErrorMessage` + `handleApiError`, and ensured shared UI surfaces no longer render raw backend strings. | Shipped | `src/lib/sanitizeErrorMessage.ts`, `src/components/ui/ErrorMessage.tsx`, `src/services/api/handleApiError.ts`. |
| FE-HARDEN-005 | Tooling | Added `npm run security:lint|audit|scan` scripts to enforce linting + `npm audit` in CI/locally. | Shipped | `package.json`. |
| FE-HARDEN-006 | Session Proxy | Routed Axios through `/api/proxy`, forwarded `lakira_token` cookies inside the new proxy handler, removed `token.storage.ts`, and updated auth hooks/HOCs to rely on HttpOnly cookies only. | Shipped | `src/app/api/proxy/[...path]/route.ts`, `src/services/api/api.ts`, `src/features/auth/**/*`, `src/components/hoc/withAuth.tsx`, `src/hooks/useAuth.ts`. |
| FE-HARDEN-007 | Dev Controls | Applied `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` to metric categories and log tooling so all “dummy” entry points respect the same flag. | Shipped | `src/app/(app)/metric-categories/page.tsx`, `src/components/pages/metrics/detail/MetricLogSection.tsx`. |
| FE-HARDEN-008 | UX Copy | Added friendly status-to-message mapping so `handleApiError` surfaces user-safe copy (session expiry, forbidden, server errors) while telemetry keeps detailed payloads. | Shipped | `src/services/api/handleApiError.ts`. |
| FE-HARDEN-009 | CI Automation | Fixed the ESLint plugin import, extended ignores for generated scripts, and expanded `.github/workflows/test.yml` with “Security Scan” (lint + `npm audit`) and `gitleaks` secret scanning jobs. | Shipped | `eslint.config.mjs`, `.github/workflows/test.yml`. |
| FE-HARDEN-010 | CSP Reporting | Added `/api/security/csp-report` and wired `report-uri` into the CSP header to collect browser violation reports. | Shipped | `src/app/api/security/csp-report/route.ts`, `next.config.ts`. |

## Follow-Up
- Monitor middleware/proxy logs to confirm unauthorized access is blocked before any data render.
- Ensure backend rate/role enforcement exists for dummy endpoints, even with the frontend flag disabled.
- Fix existing legacy lint failures so the new `security:scan` CI job can turn green.
- Evaluate removing `style-src 'unsafe-inline'` once Tailwind styles are emitted via hashed files.
