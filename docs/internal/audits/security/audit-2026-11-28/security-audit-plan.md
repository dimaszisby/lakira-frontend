# Security audit 2026-11-28 — Plan

- **Status:** In progress
- **Issue:** #217
- **Audited commit:** `2c09771c1dd8ab565e41c23f8022539146f89e8d` (`dev`, the merge of #241). Every
  `file:line` in this run is at that commit.
- **Basis:** [D-01](../decisions.md#d-01--the-basis-owasp-asvs-500-level-2-ranked-by-the-top-102025)
  — OWASP ASVS 5.0.0 Level 2, ranked by the OWASP Top 10:2025, with NIST CSF 2.0 and SLSA v1.0
  appendices.
- **Supersedes:** `audit-2025-12-10/`, a scaffold that was never filled in. `audit-2025-11-21/`
  stays as the previous complete run; it is not diffable with this one (D-01, options).

## Files of this run

| File | Holds |
| --- | --- |
| `security-audit-plan.md` | This plan: scope, sources, grades, phases, gates |
| `threat-model.md` | Data-flow diagram and STRIDE per trust boundary |
| `control-matrix.md` | One row per ASVS 5.0.0 L1 and L2 requirement; NIST CSF 2.0 and SLSA appendices |
| `probe-log.md` | Every dynamic probe: the procedure, its source, the command and the result |
| `findings-log.md` | `S-NN` findings, each with a Top 10:2025 category and a severity |
| `remediation-tracker.md` | One row per finding, its owner and the draft that carries it |

## Sources, pinned

| Source | Pin |
| --- | --- |
| OWASP ASVS 5.0.0 | `OWASP/ASVS`, tag `v5.0.0_release`, commit `5cf9b032440be53ce345ab3c130fda46ba1ce7a2`, `5.0/en/0x10-V1-…` to `0x26-V17-…` |
| OWASP Top 10:2025 | the 2025 edition's ten categories, A01:2025 to A10:2025 |
| NIST CSF 2.0 | the six functions, GV, ID, PR, DE, RS, RC |
| SLSA v1.0 | the build track, levels 1 to 3 |
| Test procedures | `mukul975/Anthropic-Cybersecurity-Skills` at `54a798831d2266a3ca61ce68a7acb80b81160d57`, the ten skills named in the probe log |
| Image scanner | `aquasec/trivy:0.76.2` at `sha256:8f6bb947dbc528902e11f2f5be52f7b519f6a39d5d148f41166f2040499768fb` (D-02) |

## Scope

### Trust boundaries

1. **Browser to the edge gate**, `src/proxy.ts`: every page request; the session check and the
   CSP nonce.
2. **Browser to the API proxy**, `src/app/api/proxy/[...path]/route.ts`, and the proxy to the
   backend.
3. **Browser to the auth routes**, `src/app/api/auth/{logout,revive}/route.ts`, and those routes
   to the backend.
4. **Server-side calls on loopback** (ADR-0050): server components and prefetches to the proxy on
   `127.0.0.1`.
5. **The reverse proxy to the container** (ADR-0047, ADR-0048): the headers it sets, and what the
   app trusts of them.
6. **The three unauthenticated telemetry intakes**, `src/app/api/{observability/client-error,
   observability/web-vitals,security/csp-report}`.
7. **CI to the image**: workflows, action pins, the build, and what the image carries.

### What each ASVS chapter is graded against

| Chapter | Requirements (L1 + L2) | Graded here | Owned elsewhere |
| --- | --- | --- | --- |
| V1 Encoding and Sanitization | 27 | rendering, URL building, the proxy's path handling | injection into backend interpreters (SQL, OS, LDAP) |
| V2 Validation and Business Logic | 11 | client validation, the proxy's input limits | business rules and their server-side enforcement |
| V3 Web Frontend Security | 19 | all of it | — |
| V4 API and Web Service | 10 | the proxy as an API surface | the backend's own endpoints |
| V5 File Handling | 9 | — (no upload or download path in `src/`) | N/A row by row |
| V6 Authentication | 35 | how the frontend carries credentials and sessions | passwords, MFA, account recovery |
| V7 Session Management | 18 | cookies, revival, logout, refresh coalescing | token issuance, revocation, the family |
| V8 Authorization | 7 | the proxy's deny-by-default | object and function-level access control |
| V9 Self-contained Tokens | 7 | the edge gate's reading of the JWT | signature and claims verification |
| V10 OAuth and OIDC | 29 | — (no OAuth or OIDC in `src/`) | N/A row by row |
| V11 Cryptography | 14 | the CSP nonce, transport assumptions | key management, hashing, storage |
| V12 Secure Communication | 9 | HSTS, cookie `Secure`, the loopback hop | TLS termination at the reverse proxy (the VPS) |
| V13 Configuration | 13 | build, headers, secrets, environment | the VPS and its stacks |
| V14 Data Protection | 9 | caching, browser storage, logs | data at rest |
| V15 Secure Coding and Architecture | 13 | dependencies, SBOM, architecture | — |
| V16 Security Logging and Error Handling | 16 | the logger, scrubbing, error bodies | the backend's audit log |
| V17 WebRTC | 7 | — (no WebRTC in `src/`) | N/A row by row |
| **Total** | **253** | | |

The counts are the Level 1 and Level 2 rows of each chapter file at the pinned commit, counted
by their Level column.

### Known inputs, graded rather than rediscovered (from #217)

- The 2026-11-14 SaaS run's findings fixed since: N17 (#218), N19 (#226), N21 (#220), N22 (#216),
  N23 (#221), N24 (#222). Each is confirmed or reopened by a probe or a check.
- N20, a resource-exhaustion finding in the API proxy, open. Its details are not public
  (`SECURITY.md`); this run records its class, severity and status only.
- The repository settings that are off (D-03).
- `.github/workflows/test.yml` has no workflow-level `permissions:`, and most `actions/checkout`
  steps keep the default `persist-credentials`.
- `Dockerfile` takes `node:24-alpine` by tag, not digest, which interacts with ADR-0018's tag check.
- Unverified: whether state-changing requests through the proxy check `Origin`, given that
  `lakira_token` is `SameSite=lax`.

## Grades

| Grade | Means |
| --- | --- |
| **Met** | The requirement holds at the audited commit, with a `file:line` that shows it |
| **Partial** | Part of it holds; the row says which part does not |
| **Not met** | It does not hold. The row names its finding |
| **N/A** | It does not apply to this codebase, or the backend or the VPS owns it; the row says which |

"Enforced by" names the test, lint rule or CI gate that would fail if the control regressed, or
says "nothing enforces it". A Met row that nothing enforces is still Met; the gap is recorded.

## Severity of findings

| Severity | Means |
| --- | --- |
| **High** | Exploitable by an unauthenticated or low-privilege attacker with real impact on users or data |
| **Medium** | Exploitable under conditions, or a missing defence in depth for a likely attack |
| **Low** | Hardening, with little practical impact today |
| **Info** | Not a weakness; a record for the next run |

## Phases

1. **Basis.** The program's `decisions.md` (D-01 to D-03), this plan, the pins.
2. **Threat model.** The data-flow diagram and STRIDE per boundary.
3. **Control matrix.** Static grading of every requirement at the audited commit, and the two
   appendices.
4. **Probes.** Against the production image built at the audited commit, run as a reverse proxy
   would reach it: `Host`, `X-Forwarded-Host`, `X-Forwarded-Proto` and `X-Forwarded-For` set.
   Probes that need a backend use lakira-backend's local stack, recorded by commit. Then Trivy.
5. **Findings.** `S-NN` entries, the remediation tracker, and drafts in the git directory: an
   issue for a finding that is not a security problem, a private advisory for one that is. Nothing
   is filed without the owner's confirmation.
6. **Close.** The gates on the audited commit, the program's pointers, and the review.

## Gates, rerun on the audited commit

lint, css lint, typecheck, format, unit tests, integration, build, `security:audit`,
`security:audit:full`, `api:spec:check` and `api:types:check`. Each is recorded by name with its
exit code in the findings log.

## Disclosure

This folder is public. A security finding that is not fixed is recorded by class, severity and
status only; its reproduction goes into a private advisory draft, never into a file here. A fixed
finding may be described once the fix has merged.
