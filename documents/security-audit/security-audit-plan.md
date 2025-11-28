# Security Audit Plan

## Purpose and Goals
- Provide a repeatable security assessment workflow for the Lakira Frontend Next.js application prior to production release and after major feature launches.
- Align the audit with industry-recognized benchmarks so prospective employers and stakeholders can trust the rigor of the portfolio deliverable.
- Produce actionable findings that feed the Security Audit Log and guide remediation, retesting, and regression monitoring.

## Guiding Benchmarks and Standards
| Benchmark / Standard | Why It Applies | Implementation Focus |
| --- | --- | --- |
| **OWASP Application Security Verification Standard (ASVS) v4.0.3 – Level 2** | Modern web applications serving authenticated users; covers authentication, session management, data validation, and APIs relevant to Next.js UI + backend integrations. | Map user stories and API calls to ASVS controls V1–V14; verify enforcement via code review, automated tests, and dynamic probing.
| **OWASP Top 10 (2021)** | Baseline awareness for the most exploited web risks used to prioritize remediation efforts. | Track each Top 10 category in the Audit Log and ensure mitigations are documented with references to ASVS controls.
| **CIS Critical Security Controls v8 (Implementation Group 2)** | Provides operational guardrails for asset inventory, vulnerability management, logging, and secure configuration for the Node.js toolchain, build agents, and hosting platform. | Review CI/CD pipelines, dependency posture, developer workstations, and runtime configuration.
| **NIST Cybersecurity Framework (CSF) 1.1** | Ensures coverage beyond application code by addressing Identify, Protect, Detect, Respond, and Recover functions needed for production-grade posture. | Use CSF functions to organize findings and escalate gaps requiring policy/process updates.
| **SLSA 1–2 (Supply-chain Levels for Software Artifacts)** | Addresses supply-chain integrity for npm packages, GitHub workflows, and build artifacts. | Confirm provenance of dependencies, enable lockfiles, signed releases, and tamper-evident build steps.

## Scope
1. **Applications**: The Next.js front-end (`src/`), server components, API routes, and integration points with backend services.
2. **Environments**: Local developer workstations, CI/CD pipelines (GitHub Actions / Vercel), staging, and production deployments.
3. **Assets & Data**: Authentication tokens, user PII, telemetry, environment secrets, npm dependency tree, and build artifacts.
4. **Exclusions**: Third-party SaaS where shared-responsibility applies (document compensating controls) unless explicit access is granted.

## Control Families & Test Activities
1. **Governance & Secrets Management (CIS 3, NIST PR.AC)**
   - Inventory credentials (`.env`, CI secrets) and ensure rotation + least privilege.
   - Validate use of secret scanners (e.g., GitHub Advanced Security) and pre-commit hooks.
2. **Application & API Security (OWASP ASVS V1–V5, V10–V14)**
   - Code review for authentication, authorization, input validation, SSR/CSR data flows.
   - Dynamic testing of API routes using authenticated and unauthenticated scenarios.
   - Confirm CSRF, XSS, SSRF, and injection defenses with unit/integration tests.
3. **Data Protection & Privacy (OWASP ASVS V7, NIST PR.DS)**
   - Check TLS configurations, HSTS, CSP, secure cookies, and storage encryption for cached data.
4. **Infrastructure & Deployment Hardening (CIS 4–7, NIST PR.IP)**
   - Audit CI runners, dependency caching, Node.js runtime versions, and container configs.
   - Confirm reproducible builds, dependency pinning, and automated vulnerability scans (`npm audit`, Snyk, Dependabot).
5. **Monitoring, Detection & Response (NIST DE + RS, CIS 8)**
   - Ensure audit logging capabilities cover authentication events, configuration changes, and errors.
   - Define alert thresholds and escalation paths for production anomalies.
6. **Supply Chain & Release Integrity (SLSA, CIS 16)**
   - Validate provenance metadata, code signing (if available), and release approvals.

## Methodology
1. **Planning**: Confirm scope, access, test data, and freeze windows with the product owner. Capture assumptions and dependencies.
2. **Recon & Threat Modeling**: Identify trust boundaries, data flows, and potential abuse cases specific to the Lakira metric dashboards.
3. **Control Verification**: Execute manual review, automated scanning, and targeted penetration testing mapped to the benchmark table.
4. **Evidence Collection**: Store artifacts (screenshots, logs, configs) in `documents/project/security-audit-log/` or another agreed location.
5. **Analysis & Prioritization**: Rate findings by likelihood/impact, map to CVSS or OWASP Risk Rating, and align with benchmarks.
6. **Reporting & Debrief**: Summarize results, remediation guidance, and regression test requirements in the Security Audit Log.
7. **Retest & Closure**: Validate fixes, update status, archive evidence, and set reminders for the next cycle.

## Roles & Responsibilities
- **Security Lead / Auditor**: Owns execution of this plan, approves deviations from scope, and maintains the log.
- **Engineering Owner**: Supplies architecture details, fixes issues, and signs off on remediation timelines.
- **DevOps / Platform**: Provides runtime metrics, CI/CD configs, and implements infrastructure controls.
- **Product Owner**: Confirms business impact, prioritizes fixes, and communicates user-facing implications.

## Tooling & Automation Checklist
- Static analysis: ESLint security plugins, TypeScript strict mode, custom lint rules.
- Dependency health: `npm audit`, Dependabot, Snyk (or similar) with blocking thresholds.
- Secret scanning: GitHub Advanced Security, `gitleaks`, or pre-commit hooks.
- Runtime observability: Vercel / Next.js analytics, centralized logging (Datadog, Logtail, etc.).
- Issue tracking: Link audit findings to Jira/Linear tickets with benchmark references.

## Schedule & Cadence
- **Baseline Audit**: Immediately prior to public portfolio release or major demo.
- **Continuous Controls**: Automated scans on every pull request; dependency updates weekly.
- **Quarterly Review**: Re-run targeted ASVS control checks, validate CI/CD posture, and rotate keys.
- **Event-Driven**: Trigger unscheduled audits after security incidents, 0-day disclosures, or major architectural changes.

## Deliverables
1. **Security Audit Log** containing: finding ID, benchmark reference, description, evidence link, severity, owner, remediation target date, and verification status.
2. **Executive Summary** suitable for portfolio reviewers, highlighting maturity level per benchmark.
3. **Remediation Tracker** prioritized backlog items with acceptance criteria tied to the relevant standard.

## Acceptance Criteria
- All in-scope controls are mapped to at least one benchmark.
- Evidence stored and referenced can recreate the audit trail without additional context.
- Deviations or compensating controls are documented, signed off, and scheduled for review.
- Plan reviewed after each audit cycle to keep alignment with evolving project scope and industry standards.
