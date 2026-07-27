# Lakira Frontend – Security Audit Log (Baseline Architecture)

## Audit Metadata
- **Date:** 2025-11-21
- **Auditor:** Codex (LLM assistant)
- **Scope:** High-level architecture and baseline security posture of the Lakira Next.js frontend. Detailed code paths under `src/features`, `src/components`, `src/app`, and `src/styles` remain untouched per request and will be audited separately.
- **Benchmarks Referenced:** OWASP ASVS v4.0.3 (Level 2), OWASP Top 10 (2021), CIS Controls v8 (IG2), NIST CSF (Identify/Protect focus), SLSA 1–2.

## Architecture Snapshot
1. **Framework & Runtime** – Next.js 16 App Router with React 19 + TypeScript. `next.config.ts` currently only enables `reactStrictMode`; no custom headers, middleware, or experimental security features are defined yet.
2. **State & Data Layer** – Client data access flows primarily through `@tanstack/react-query` hooks and Axios clients (`axios` + `axios-retry`). Domain logic is split into `src/services` (API clients), `src/hooks`, `src/utils`, and feature-specific directories for metrics, metric categories, and metric logs.
3. **UI System** – Component tokens and design primitives live under `src/styles/tokens` and CSS recipe files (Tailwind + custom tokens). UI elements reference shared primitives within `src/components/ui` and higher-order page sections under `src/components/pages`.
4. **Forms & Validation** – `react-hook-form`, `zod`, and internal validation helpers appear to power data-entry flows (metric creation, logging, etc.). DOMPurify is available for sanitizing any HTML snippets rendered in labels/descriptions.
5. **Stateful Features** – Directories such as `src/features/metrics`, `src/features/metric-categories`, and `src/features/metric-logs` suggest a multi-tenant or user-specific dashboard that exposes CRUD flows over metric definitions and activity logs.
6. **Build & Tooling** – ESLint (with `eslint-plugin-security`, `eslint-plugin-jsx-a11y`, `eslint-plugin-testing-library`, etc.), Stylelint, Prettier, and Tailwind compose the base tooling. `package-lock.json` is present, supporting deterministic builds required by SLSA Level 1 expectations.
7. **Documentation & Governance** – Security planning artifacts (`security-audit-plan.md`, `security-audit-workflow-guidelines.md`) exist but `security-audit-log.md` and `threat-model.md` are currently empty placeholders. The new baseline log (this file) seeds the audit trail.

## Attack Surface & Trust Boundaries (High-Level)
| Layer | Description | Primary Assets / Concerns | Notes |
| --- | --- | --- | --- |
| Browser UI | React components rendered via Next.js App Router; numerous charts and cards for metric data. | User tokens (if stored client-side), metric details, log entries, PII embedded in descriptions. | Requires consistent sanitization (DOMPurify) and form validation to prevent XSS/HTML injection.
| Next.js Server (Node / Vercel) | Serves static + SSR content, proxies API calls via Axios services. | Environment secrets (`NEXT_PUBLIC_` vs server-only vars), API base URLs, build artifacts. | No middleware or custom headers detected; needs future hardening (CSP, HSTS, Redirect validation).
| Backend APIs (external) | Not contained in this repo but implied via services. | Metric CRUD endpoints, authentication endpoints, telemetry. | Need to confirm auth method (token, cookie) and ensure request signing / CSRF defenses.
| CI / Tooling | npm scripts + potential GitHub Actions (not checked). | Dependency chain, lint/test coverage, secret handling. | `check-accessibility` script is placeholder; no automated security scan (e.g., `npm audit`) scripted.

## Baseline Controls Observed
- TypeScript everywhere with strict React 19 runtime improves static guarantees and mitigates common injection vectors.
- ESLint suite already includes `eslint-plugin-security`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`, and `eslint-plugin-sonarjs`, enabling enforceable secure coding rules once configured.
- DOMPurify dependency indicates awareness of client-side HTML sanitization for any metric descriptions or markdown that might be rendered as HTML.
- Axios retry middleware plus centralized services structure suggests a single integration point where auth headers, timeouts, and telemetry can be enforced.
- Tailwind tokenization (`palette.css`, `semantic.css`, `typography.css`) centralizes styling logic, which simplifies future rollout of theming-related security fixes (e.g., print-safe vs dark mode exposures).

## Baseline Gaps & Follow-Up Items
| ID | Finding | Risk / Impact | Recommended Next Action |
| --- | --- | --- | --- |
| FE-ARCH-001 | `next.config.ts` lacks security headers/middleware (CSP, HSTS, `X-Frame-Options`). | Exposure to clickjacking, mixed-content, and XSS downgrade vectors once deployed. | Add a security headers helper (e.g., `next-secure-headers` or manual `headers()` export) and consider Next middleware for auth and redirect validation. |
| FE-ARCH-002 | No repository-level threat model or populated audit log documents. | Hard to trace which controls have been assessed; onboarding new reviewers requires re-discovery. | Populate `threat-model.md` with assets/trust boundaries and keep this log updated per audit cycle. |
| FE-ARCH-003 | No `middleware.ts` or route protection artefacts detected at repo root. | Access control may rely solely on client-side logic, making it easier to bypass via crafted requests. | When detailed review of `/app` occurs, confirm presence of server-side guards (middleware, server actions) or plan to add them. |
| FE-ARCH-004 | Tooling scripts omit automated dependency or secret scanning (`npm audit`, `gitleaks`, etc.). | Supply-chain issues or credential leaks could go unnoticed between releases (SLSA/CIS gap). | Introduce CI steps for `npm audit`, Dependabot/Snyk, and secret scanning. Document in audit workflow. |
| FE-ARCH-005 | Unknown handling of auth/session tokens within Axios services and React Query caches. | Potential for token leakage in browser storage, logs, or error toasts if not scoped carefully. | During component-level audit, trace token storage (cookies vs localStorage) and ensure sensitive headers are never logged or exposed to the DOM. |

## Next Steps
1. Expand this baseline into a detailed threat model (`documents/security/threat-model.md`) describing assets, trust boundaries, and abuse cases specific to Metrics, Metric Categories, and Log flows.
2. Inventory actual API client implementations under `src/services` to document authentication schemes, error handling, and retry/backoff policies.
3. Define CI/CD security expectations (dependency scanning, lint gates, previews) and record the results in `security-audit-log.md` once inspections occur.
4. Schedule focused reviews for each excluded directory set (`/app`, `/components`, `/features`, `/styles`) to validate client-side controls such as input validation, output encoding, and role-based UI restrictions.
