# Security TODOs – 26 Nov 2025

## Completed Actions (26 Nov 2025)
1. **Cookie-backed proxy + token cleanup** – Added `/api/proxy/[...path]` to forward requests with the `lakira_token` HttpOnly cookie, pointed Axios to `/api/proxy`, and removed every `localStorage` token helper/HOC. (Refs: `src/app/api/proxy/[...path]/route.ts`, `src/services/api/api.ts`, `src/features/auth/**/*`, `src/hooks/useAuth.ts`.)
2. **ESLint + CI wiring** – Imported `@typescript-eslint/eslint-plugin`, updated ignores, and added `security` + `secret-scan` jobs running `npm run security:scan` and `gitleaks` in `.github/workflows/test.yml`.
3. **Dummy feature flags everywhere** – Reused `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` for metric catalog + log UI, including handler guards and sanitized error output. (Refs: `src/app/(app)/metric-categories/page.tsx`, `src/components/pages/metrics/detail/MetricLogSection.tsx`.)
4. **Friendly error copy** – Introduced friendly status mapping inside `handleApiError` so user-facing strings remain safe yet actionable.
5. **CSP reporting** – Added `/api/security/csp-report` endpoint and wired `report-uri` in `next.config.ts`; inline scripts already moved to `/public/scripts/theme-init.js`.
6. **Secret scanning** – Added gitleaks job in CI (see workflow update) for automated secret scans with artifacts logged in the security audit.
7. **Middleware/API authorization** – Extended middleware enforcement via the proxy route (rejects protected segments without cookies) and documented coverage in the security audit/threat model refresh.

## TODO – Next Cycle
1. Fix legacy lint violations (non-arrow React components, hooks warnings, boundaries config) so the new `security:scan` CI job can pass.
2. Explore migrating protected data fetching into server components to further tighten SSR enforcement.
3. Plan removal of `style-src 'unsafe-inline'` by hashing or extracting Tailwind output; monitor CSP reports for regressions.
4. Enable Dependabot/Snyk (or equivalent) for dependency monitoring and log evidence in the audit log.

## Notes
- Revisit `docs/internal/audits/security/audit-2025-11-21/control-matrix.md` after each future change to keep control status accurate.
- Capture verification evidence in `docs/internal/audits/security/audit-2025-11-21/security-audit-log.md` for each sprint.
