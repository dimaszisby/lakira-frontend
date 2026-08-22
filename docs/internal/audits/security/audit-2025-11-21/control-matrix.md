# Lakira Frontend – Security Control Matrix

_Source inputs: security-audit-plan.md, security-audit-log-baseline-simple.md, security-audit-log-features-simple.md, threat-model.md._

| Benchmark Control | Lakira FE Area / Capability | Primary Files / Modules | Status* | Notes & Planned Actions |
| --- | --- | --- | --- | --- |
| **OWASP ASVS V1.1 – Secure SDLC** | Governance docs, audit plan, workflow guidelines. | `docs/security/*` | In Progress | Plan + workflow exist, but audit log + threat model only recently seeded. Need recurring cadence + evidence attachments. |
| **OWASP ASVS V1.7 – Error Handling** | API error normalization & UI toasts. | `src/services/api/handleApiError.ts`, `src/components/ui/ErrorMessage.tsx`, `src/features/*/components/*Form.tsx` | Partially Implemented | `sanitizeErrorMessage` strips unsafe characters; next step is mapping backend codes to curated user-friendly copy. |
| **OWASP ASVS V1.14 – Dependency Management** | CI scripts, lockfile enforcement. | `package-lock.json`, `package.json`, CI configs (TBD) | Gap (FE-ARCH-004) | No `npm audit`/Dependabot/secret scanning in automation. Add CI jobs and document evidence. |
| **OWASP ASVS V2.1/V2.3 – AuthN/AuthZ Enforcement** | Route protection for `/app/**`. | `middleware.ts`, `src/components/hoc/withAuth.tsx`, `src/app/(app)/**`, `src/app/api/proxy/[...path]/route.ts` | Partially Implemented | Middleware + proxy now enforce cookies before SSR/CSR; next step is moving sensitive data fetching into server components. |
| **OWASP ASVS V2.6 – Credential/Token Storage** | Session token handling. | `/api/auth/session`, `src/app/api/proxy/[...path]/route.ts`, `src/services/api/api.ts` | Implemented | Session tokens now live only in the HttpOnly `lakira_token` cookie; Axios proxy reads it server-side and `token.storage.ts` was removed. |
| **OWASP ASVS V4.1 – Input Validation** | Forms (metrics, logs, auth). | `src/features/metrics/components/MetricForm.tsx`, `src/features/metric-logs/components/LogForm.tsx`, `src/features/auth/components/*` | Partially Implemented | `react-hook-form` + `zod` schemas enforce structure. Need backend validation verification and duplication checks with server consistency. |
| **OWASP ASVS V5.1 – Output Encoding / XSS** | Visualization & UI rendering. | `src/components/ui/*`, `src/features/data-visualizations/*` | Partially Implemented | No `dangerouslySetInnerHTML` found; DOMPurify dependency unused yet. Add CSP headers + ensure any future rich-text uses sanitization. |
| **OWASP ASVS V7.1 – Cryptographic Controls** | TLS, secure headers. | `next.config.ts`, hosting configuration | Partially Implemented | CSP, HSTS, Referrer-Policy, Permissions-Policy, and XFO now applied globally; monitor/report violations to tighten policies further. |
| **OWASP ASVS V10.1 – Malicious Input Handling** | “Add Dummy” feature, bulk operations. | `src/app/(app)/metrics/page.tsx`, `src/app/(app)/metric-categories/page.tsx`, `src/components/pages/metrics/detail/MetricLogSection.tsx` | Implemented | All dummy entry points now honor `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS`; backend enforcement still recommended. |
| **OWASP ASVS V14 – Config / Deploy** | Next.js config, environment separation. | `next.config.ts`, `.env` (not checked) | Gap | Need security headers export, environment-specific settings, and secret scanning. |
| **OWASP Top 10 A01 – Broken Access Control** | All authenticated pages + API proxy. | `middleware.ts`, `/api/proxy/[...path]/route.ts`, `src/app/(app)/**`, `withAuth` | Partially Implemented | Middleware + proxy enforce HttpOnly cookies; move sensitive data fetching into server components for full coverage. |
| **OWASP Top 10 A05 – Security Misconfiguration** | Headers, CSP, inline scripts. | `next.config.ts`, `src/app/ThemeScript.tsx`, `public/scripts/theme-init.js`, `/api/security/csp-report` | Partially Implemented | Security headers + CSP reports are active; remaining task is removing `style-src 'unsafe-inline'` once Tailwind styles are hashed. |
| **OWASP Top 10 A08 – Software Supply Chain** | Dependencies, build integrity. | `package-lock.json`, `.github/workflows/test.yml` | Partially Implemented | `security:scan` (lint+`npm audit`) and `gitleaks` now run in CI; Dependabot/Snyk still pending. |
| **CIS Control 4 – Secure Configuration of Assets** | Dev/prod runtime configuration. | `next.config.ts`, Vercel project settings | Gap | Document baseline config, enforce secure headers, remove unused routes. |
| **CIS Control 6 – Access Control Management** | Session management, logout flows. | `/api/auth/session`, `middleware.ts`, `/api/proxy/[...path]/route.ts` | Partially Implemented | Cookies + middleware enforce sessions; continue improving backend revocation and telemetry. |
| **CIS Control 16 – Application Software Security** | SDLC automation, linting/tests. | `eslint.config.mjs`, `stylelint.config.mjs`, npm scripts | In Progress | Linting + TypeScript enforced; add security-specific CI gates (audit, tests) per FE-ARCH-004. |
| **NIST CSF PR.AC – Access Control** | Auth workflows and page gating. | `withAuth`, `middleware.ts`, `/api/proxy/[...path]/route.ts` | Partially Implemented | HttpOnly cookies + middleware are live; next milestone is server-centric rendering and backend role enforcement. |
| **NIST CSF PR.DS – Data Security** | Data classification & encryption. | Threat model (assets), API transport (TLS). | Partially Implemented | TLS assumed via Vercel; need CSP + secure cookies + at-rest encryption confirmation in backend scope. |
| **NIST CSF PR.IP – Protection Processes** | Audit plan & workflow. | `docs/internal/audits/security/audit-2025-11-21/security-audit-plan.md`, `security-audit-workflow-guidelines.md` | In Progress | Processes exist; need evidence of execution (logs filled per cycle). |
| **SLSA Level 1 – Provenance** | Build pipeline + dependency pinning. | `package-lock.json`, npm scripts | Partially Implemented | Lockfile present; need build attestations, automated vulnerability scanning to advance maturity. |

_*Status Legend_: **Implemented**, **Partially Implemented**, **In Progress**, **Gap**.

## Next Steps
1. **Authenticate & Authorize**: Complete migration to cookie-based sessions + middleware (closes FE-FEAT-001/002/FE-ARCH-003/005).
2. **Security Headers & CSP**: Update `next.config.ts` and ThemeScript to satisfy ASVS V7/V14 and A05.
3. **Supply Chain Tooling**: Add CI checks for dependency/secret scanning to satisfy ASVS V1.14 + SLSA expectations.
4. **Error Hygiene & Dev Feature Flags**: Implement FE-FEAT-004/005 fixes and document retests in the audit log.
5. **Keep Matrix Updated**: Revisit this table every audit cycle; link future findings to control IDs for traceability.
