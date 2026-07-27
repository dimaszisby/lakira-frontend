# Lakira Frontend – Threat Model

> **Source inputs:** `security-audit-log-baseline-simple.md` (architecture snapshot + trust boundaries) and `security-audit-log-features-simple.md` (feature/component findings as of 2025‑11‑21).

## 1. System Overview

- **Platform**: Next.js 16 App Router deployed to Vercel (React 19 + TypeScript).
- **Client Architecture**: UI state is driven by React Query, Jotai atoms, and Axios API clients that call backend metric/auth endpoints.
- **Feature Domains**: Metrics, metric categories, metric logs, metric settings, and data visualizations with Chart.js.
- **Authentication UX**: Login/Register flows persist bearer tokens exclusively through the HttpOnly `lakira_token` cookie (`/api/auth/session`), and Axios now targets a Next.js proxy that injects the cookie as a bearer header. The legacy `token.storage.ts` helper was removed, so middleware + profile fetches gate access.
- **Security Headers**: Global CSP, HSTS, Referrer-Policy, Permissions-Policy, and X-Frame-Options are injected via `next.config.ts`; the theme bootstrapper was moved to a static script so CSP can stay strict.
- **Tooling & Governance**: ESLint (with security plugins), Stylelint, Prettier, and documented audit workflows exist; automated dependency/secret scanning has not been wired yet (FE-ARCH-004).

## 2. Assets & Data Classification

| Asset                             | Description                                                              | Classification / Impact if Compromised                                                                                      | Notes                                                                            |
| --------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **User Session Token**            | HttpOnly `lakira_token` cookie read server-side by `/api/proxy`.         | High – token grants full dashboard access; theft enables account takeover.                                                  | Cookie never enters `localStorage`; proxy injects the header only on the server. |
| **Metric Definitions & Logs**     | CRUD data rendered in `/metrics`, `/metric-categories`, `/metric-logs`.  | Medium/High – may include sensitive personal goals, health stats, timestamps. Integrity is critical for analytics accuracy. | Stored server-side; frontend fetches via paginated APIs.                         |
| **User Profile**                  | Name/email returned by `/auth/profile` and cached in React Query/Jotai.  | Medium – PII disclosure risk; also used to gate features.                                                                   | Cached client-side; cleared only when token removed.                             |
| **Configuration / Feature Flags** | UI toggles like “Add Dummy metrics”, layout/theme state (`ThemeScript`). | Low/Medium – misused dev-only actions can DoS backend (FE-FEAT-004).                                                        | Needs environment-awareness.                                                     |
| **Build & Secrets**               | `NEXT_PUBLIC_*` envs, Vercel previews, npm dependency tree.              | High – tampering impacts all users; missing scans (FE-ARCH-004) elevate supply-chain risk.                                  | Managed by CI/CD; plan calls for Dependabot/Snyk.                                |

## 3. Actors & Entry Points

| Actor                            | Capabilities                                               | Target Entry Points                                                               |
| -------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Authenticated User**           | Full UI access after login; may abuse hidden dev actions.  | `/metrics`, `/metric-categories`, `/metric-logs`, data visualization controls.    |
| **Unauthenticated User**         | Access to public pages (`/login`, marketing).              | Auth API endpoints, login forms, password fields.                                 |
| **Malicious Script / Extension** | Executes in browser context if XSS or extension installed. | DOM, React components, chart tooltips, theme/local storage prefs (non-sensitive). |
| **Network Attacker**             | Observes traffic between browser and backend.              | API requests (requires TLS), dependency downloads.                                |
| **CI/CD Supply-Chain Attacker**  | Injects malicious dependency/build steps.                  | npm packages, GitHub Actions (not yet reviewed).                                  |

## 4. Trust Boundaries & Data Flows

| Boundary                           | Description                                                                                                         | Key Controls Today                                                                                                                           | Gaps / Observations                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Browser ↔ Next.js Server**      | React components rendered client-side; optional SSR.                                                                | TLS via Vercel, React strict mode, linting rules, CSP/HSTS/Permissions headers, middleware for authenticated paths, CSP report-uri endpoint. | Inline styles still require `'unsafe-inline'` until Tailwind output is hashed.                               |
| **Next.js ↔ Backend APIs**        | Axios now calls `/api/proxy`, which forwards requests with HttpOnly cookies.                                        | Proxy handler injects `Authorization` headers, enforces protected segments, and retains retry logic.                                         | Backend endpoints must continue verifying scopes/roles; proxy still allows unauthenticated `/auth/*` access. |
| **Browser Storage ↔ React State** | Theme preferences, layout modes, and other UX state live in `localStorage`; auth state cached in Jotai/React Query. | Helper wrappers check `typeof window !== "undefined"`.                                                                                       | No secrets remain in storage, but continue auditing preferences for accidental PII.                          |
| **CI/CD ↔ Production**            | Builds promoted via Vercel; lockfile present.                                                                       | package-lock ensures deterministic versions.                                                                                                 | Automated `npm audit`/secret scanning absent (FE-ARCH-004).                                                  |

## 5. Threat Scenarios & Mitigations

| Scenario                                       | Description & Relevant Findings                                           | Likelihood | Impact | Mitigation Status / Actions                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| **Token Theft via XSS or Malicious Extension** | Tokens now live only in HttpOnly cookies (never `localStorage`).          | Low        | High   | Continue to harden CSP (drop `'unsafe-inline'`), monitor `/api/security/csp-report`, and keep dependency hygiene tight.   |
| **Client-side Guard Bypass**                   | Protected pages previously relied on `withAuth`/`requireToken` alone.     | Low        | High   | Middleware plus `/api/proxy` enforce cookies before SSR/CSR; next step is server-centric data fetching.                   |
| **Dev Tool Abuse / Dummy Metric Flooding**     | Dummy buttons existed on multiple screens.                                | Low        | Medium | All dummy actions now respect `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS`; ensure backend endpoints enforce rate/role checks.      |
| **Information Disclosure in UI**               | Raw API errors surfaced to users.                                         | Low        | Medium | `sanitizeErrorMessage` + friendly status copy now guard UI strings; continue reviewing validation payloads for PII leaks. |
| **Clickjacking / Mixed Content**               | Previously missing secure headers.                                        | Low        | Medium | Security headers now applied globally; CSP reports feed `/api/security/csp-report`.                                       |
| **Supply-chain Compromise**                    | Lack of automated dependency/secret scanning (FE-ARCH-004).               | Low        | High   | Dependabot/Snyk still pending; CI now runs `npm audit` + `gitleaks` as a baseline.                                        |
| **Token Leakage via Logs**                     | Axios errors logged with raw headers/messages (FE-ARCH-005, FE-FEAT-005). | Low        | Medium | Scrub sensitive headers before logging; ensure `handleApiError` redacts tokens.                                           |

## 6. Mitigation Roadmap

1. **Server-centric data flow**
   - Move protected data fetching into server components/route handlers so middleware + proxy checks always execute before hydration.
2. **CSP tightening**
   - Remove `style-src 'unsafe-inline'` once Tailwind output is hashed or compiled into static CSS, and continue monitoring `/api/security/csp-report`.
3. **Backend rate/role limits**
   - Ensure backend dummy endpoints enforce quotas and role checks even if the frontend flag is bypassed.
4. **Secret & dependency hygiene**
   - Enable Dependabot/Snyk and keep the new `security:scan` + `gitleaks` jobs green by fixing legacy lint issues and addressing any leaks they surface.
5. **Documentation cadence**
   - Update this threat model and the security audit log after each sprint so improvements remain traceable.

## 7. Residual Risks

- CSP currently allows inline styles for Tailwind; evaluate CSS-in-JS strategy or hashed CSS if stricter policies are required.
- Feature modules may still expose additional helper endpoints; extend the feature-flag + backend authorization pattern to anything new.
- Existing lint violations (React component definitions, hook usage) must be addressed so the enforced `security:scan` job can pass reliably.

Maintaining this threat model alongside the audit logs ensures each finding (FE-ARCH-001…005, FE-FEAT-001…005) maps to a clear threat scenario, mitigation owner, and regression test plan.
