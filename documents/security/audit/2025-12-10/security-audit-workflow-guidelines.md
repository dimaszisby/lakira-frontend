**Timestamp (UTC): 2025-12-10T00:00:00Z**

# Lakira Frontend – Security Audit Workflow (Cycle 2025-12-10)

> This revision strengthens the November workflow by closing the biggest gaps we observed: inconsistent evidence capture, insufficient CI coverage, limited runtime verification, and lack of deployment-grade guardrails. Use it as the authoritative playbook for every post-release hardening sprint.

## Guiding Principles & Benchmarks
- **Standards alignment**: Map every activity to OWASP ASVS v4.0.3 L2, OWASP Top 10 (2021), CIS Controls v8 (IG2), NIST CSF PR/DE/RS, and SLSA 1–2. Use ISO 27001 Annex A IDs for any governance/process findings.
- **Production realism**: All validation must occur against staging/prod-parity builds with the same env flags, headers, middleware, and feature toggles that ship to users.
- **Evidence or it didn’t happen**: Store logs, screenshots, tool outputs, and diffs under `documents/security/audit/<cycle>/artifacts/` and reference the artifact path in the audit log.
- **LLM guardrails**: Never paste secrets, private keys, or full env files into prompts. Summarize sensitive sections manually and restrict prompts to minimal necessary context.
- **Shift-left automation**: Any fix or control we validate should be wired into CI/CD (`security:scan`, Dependabot/Snyk, secret scanning, lint/tests) so regressions are impossible without a red build.

## Phase 0 – Intake & Environment Hardening
1. **Spin up the audit folder**: `documents/security/audit/2025-12-10/` must contain: plan snapshot, workflow guidelines (this file), threat model, control matrix, audit log, remediation tracker, and `/artifacts`.
2. **Branching & approvals**: Cut `chore/security-audit-2025-12-10` from `main`. Register the effort in issue tracking (Linear/Jira) with stakeholders (security lead, FE owner, platform lead).
3. **Environment parity checklist**:
   - Confirm `.env` for dev/staging matches prod flag layout (no test-only overrides).
   - Document `next.config.ts` security headers, middleware routes, and feature flags.
   - Capture current CI pipelines (`.github/workflows/*.yml`) and Vercel project settings for evidence.

## Phase 1 – Context Refresh & Threat Modeling
1. **Artifact refresh**: Update `threat-model.md` with any new features/routes introduced since the last audit (metrics automation, logging changes, etc.). Include data flows, trust boundaries, and assets.
2. **Abuse case expansion**: Enumerate threat scenarios per OWASP Top 10, tying each to components and expected mitigations.
3. **Impact rating**: Assign CVSS v3.1 base scores to each scenario to guide prioritization.

## Phase 2 – Control Matrix Calibration
1. **Import benchmarks**: Copy the previous matrix, add new controls if scope expanded (e.g., ASVS V9, SOC 2 CC8/CC9 if relevant).
2. **Status validation**: For every row, provide evidence references (`artifact://...`) before moving a control from “Gap/In Progress” to “Implemented”.
3. **Coverage heatmap**: Highlight controls lacking automated enforcement so they can be targeted later.

## Phase 3 – Code & Config Review Sprints
Split the codebase into review packs to keep LLM prompts focused and auditable:
1. **Authentication & Session Management**: middleware, proxy routes, auth hooks, logout flows, cookie flags.
2. **Authorization & Access Control**: server components, route handlers, RBAC logic, API proxy filters.
3. **Input Validation & Output Encoding**: forms, schemas, sanitizers, DOMPurify usage, React render paths.
4. **Error Handling & Logging**: `handleApiError`, telemetry exports, console logging, log redaction.
5. **Configuration & Secrets**: `next.config.ts`, env usage, feature flags, URL builders, CSP scripts.
6. **Frontend Supply Chain**: npm scripts, package-lock, third-party libs, build tooling.
7. **Observability & Response**: CSP report handler, monitoring hooks, alert routing.

**Process per pack**:
- Gather architectural context + file excerpts (≤800 tokens) and run an LLM review focusing on the relevant ASVS/Top 10 controls.
- Tag findings immediately in `security-audit-log.md` with IDs (`FE-<Area>-###`), severity, benchmarks, and links.
- Update the control matrix entry for any control affected.

## Phase 4 – Automated & Manual Testing
1. **Static analysis gates**:
   - Run `npm run security:scan` (ESLint + `npm audit`). Triage CVEs; document CVSS scores and upgrade paths.
   - Execute `gitleaks`/secret scanning locally; capture logs even if clean.
   - Use `npx @snyk/cli test` or Dependabot alerts for additional SCA coverage if enabled.
2. **Dynamic & runtime checks**:
   - Follow an abuse-test script covering auth bypass, CSRF, XSS payloads, header validation, and role tampering.
   - Inspect cookies (`Secure`, `HttpOnly`, `SameSite=strict/lax`) and response headers (CSP, HSTS, Permissions-Policy, COOP/COEP).
   - Replay key flows with JavaScript disabled to ensure middleware/SSR gating works.
3. **Infrastructure validation**:
   - Review Vercel/hosting logs for CSP violations and blocked middleware events.
   - Confirm rollout of rate limits, WAF rules, and bot protection if managed outside the repo.

## Phase 5 – Evidence Capture & Reporting
1. **Artifact logging**: For every finding or verification, add a short Markdown note under `artifacts/<id>.md` with reproduction steps, screenshots, command output, and commit hashes.
2. **Audit log assembly**: Update `security-audit-log.md` with structured columns (ID, control refs, description, severity, owner, due date, status, artifact link).
3. **Executive summary**: Draft a one-page overview highlighting posture, key mitigations, open risks, and next sprint proposals.
4. **Stakeholder review**: Circulate the summary + remediation tracker to engineering/security leadership for sign-off.

## Phase 6 – Remediation, Automation & Retest
1. **Remediation tracker**: Triage findings into High/Med/Low, assign owners, and define acceptance criteria (code tests, telemetry checks, feature flag updates).
2. **Automate controls**:
   - Update CI/CD to block merges without passing `security:scan`, `npm audit`, and secret scanning jobs.
   - Add guardrails like `lint-staged`, commit hooks, or GitHub branch protection as needed.
3. **Verification**:
   - After fixes merge, run targeted regression tests or Playwright suites.
   - Update the audit log status to `Verified` with artifact evidence.

## LLM Prompt Playbook (Quick Reference)
- **Threat modeling**: “Summarize assets/trust boundaries from these docs and map to ASVS V1/V2/V4.”
- **Code review**: “Given this excerpt, identify ASVS control violations and safer alternatives.”
- **Tool triage**: “Cluster these `npm audit` results by root cause and remediation strategy.”
- **Report drafting**: “Convert these findings into a markdown table with severity, owner, due date, and evidence links.”

## Exit Criteria for the Cycle
- Every control in the matrix has a status justified by evidence.
- No High findings remain open without documented compensating controls and target dates.
- CI/CD pipelines enforce the relevant gates (lint, tests, audit, secrets) introduced during the cycle.
- Threat model, audit log, remediation tracker, and artifacts directory are complete and versioned in git.

Maintain this document alongside the audit plan; update both whenever processes or standards evolve.
