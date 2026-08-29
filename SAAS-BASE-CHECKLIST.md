# SaaS Base Checklist

**Audit date:** 2026-08-29 (re-audit)
**Full audit:** [`docs/internal/audits/saas-readiness/audit-2026-08-29.md`](docs/internal/audits/saas-readiness/audit-2026-08-29.md)
**Baseline:** [`audit-2026-08-24.md`](docs/internal/audits/saas-readiness/audit-2026-08-24.md)
**Roadmap:** [`iteration-plan.md`](docs/internal/audits/saas-readiness/iteration-plan.md)
**Verdict authority:** ADR-001 in [`decisions.md`](docs/internal/audits/saas-readiness/decisions.md)

## Verdict

> **FORK-READY WITH CAVEATS.** All four ADR-001 criteria pass: zero P0 gaps, all ten empirical
> gates green, and `LICENSE` + `.env.example` present. Seven remediation phases moved the
> scorecard from 43% to 84% in five days. The changes that mattered: every cache key now carries
> the organization id, with 94 tests and both guards proven to fail on regression; sessions no
> longer break fifteen minutes after login; the proxy denies by default against an allowlist
> derived from the OpenAPI contract; and the gates that could not fail now can. What holds it
> short of a clean verdict is that the **organization switcher cannot be built** against the
> current backend contract, **three flows are implemented but unverified** for want of
> email-token access, and there is **no deploy configuration** — which is the one critical
> category still under 80%.

## Fork-ready exit criteria

| #   | Criterion                            | Status (2026-08-29)                    | Baseline |
| --- | ------------------------------------ | -------------------------------------- | -------- |
| 1   | Zero P0 gaps remaining               | PASS — 8 closed                        | FAIL     |
| 2   | All empirical gates green            | PASS — 10 of 10                        | FAIL     |
| 3   | Critical categories at ≥ 80%         | PASS with one exception — CI/CD at 67% | FAIL     |
| 4   | `LICENSE` and `.env.example` at root | PASS                                   | FAIL     |

## Scorecard

| Category                          | Pass   | Partial | Missing | % Pass  | Baseline | Critical |
| --------------------------------- | ------ | ------- | ------- | ------- | -------- | -------- |
| 1. Auth & Session                 | 7      | 1       | 0       | 88%     | 25%      | Yes      |
| 2. API Contract & Data Access     | 6      | 0       | 0       | 100%    | 67%      |          |
| 3. Routing & Rendering            | 5      | 1       | 0       | 83%     | 50%      |          |
| 4. Security                       | 7      | 1       | 0       | 88%     | 63%      | Yes      |
| 5. Error Handling & Observability | 4      | 1       | 0       | 80%     | 20%      |          |
| 6. Developer Experience           | 7      | 0       | 0       | 100%    | 57%      | Yes      |
| 7. Testing                        | 6      | 1       | 0       | 86%     | 43%      | Yes      |
| 8. CI/CD & Deployment             | 4      | 0       | 2       | 67%     | 33%      | Yes      |
| 9. Accessibility                  | 3      | 1       | 0       | 75%     | 75%      |          |
| 10. Performance                   | 3      | 1       | 0       | 75%     | 75%      |          |
| 11. Multi-Tenancy & SaaS Surface  | 4      | 1       | 0       | 80%     | 0%       | Yes      |
| 12. Code Architecture             | 4      | 2       | 0       | 67%     | 50%      |          |
| 13. Forkability                   | 6      | 1       | 0       | 86%     | 14%      | Yes      |
| **Total (79 items)**              | **66** | **11**  | **2**   | **84%** | **43%**  |          |

**Severity counts:** P0 = **0** (was 8) · P1 = **6** (was 21) · P2 = **9** (was 8).

## Empirical gates (2026-08-29)

| Command                    | Result                         |
| -------------------------- | ------------------------------ |
| `npm run lint`             | PASS — 0 errors, 37 warnings   |
| `npm run lint:css`         | PASS                           |
| `npm run typecheck`        | PASS                           |
| `npm run test:unit:ci`     | PASS — 464 tests (was 243)     |
| `npm run coverage:check`   | PASS — `--strict`              |
| `npm run test:integration` | PASS — 79 tests                |
| `npm run build`            | PASS                           |
| `npm run api:spec:check`   | PASS — was failing at baseline |
| `npm run api:types:check`  | PASS                           |
| `npm run security:scan`    | PASS — 0 vulnerabilities       |

> Gates ran on host Node v26.5.0; CI and `.nvmrc` pin Node 20. CI ran all eight jobs green on
> the same commit, so this is corroborated rather than assumed.

## Open caveats

|        | Severity |                                                                                                                                                                                                          |
| ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1** | P1       | **The organization switcher cannot be built.** No `GET /organizations`, and `User` carries no memberships, so the frontend cannot discover the ids `/auth/switch-org` requires. Backend handoff written. |
| **C2** | P1       | **Three flows built but unverified** — `verify-email`, `reset-password`, and the two-org in-session switch. All consume tokens delivered by email, which this session cannot read.                       |
| **C3** | P1       | **No vendor error sink.** Structured stdout logging with a `setLogSink()` seam; collectable by a log drain, but not an error aggregator.                                                                 |
| **C4** | P1       | **No deploy job or deployment config.** The reason CI/CD sits at 67%.                                                                                                                                    |
| **C5** | P2       | `gitleaks-action` pinned to `v1.6.0`.                                                                                                                                                                    |
| **C6** | P2       | Six files still quarantined from the layer rule.                                                                                                                                                         |

## What is strong

- **Tenant isolation.** Five org-scoped key factories, 94 tests where there were none, and both
  guards verified to fail on regression rather than assumed.
- **Auth.** Refresh-on-401, deny-by-default proxy from the contract, `exp`-checked middleware,
  and a session route that validates before storing.
- **Environment.** One validated module; zero raw `process.env` reads outside it.
- **Forkability.** `scripts/bootstrap-fork.sh`, verified end to end on throwaway clones — a
  forked tree passes lint, typecheck, both test suites and build.
- **Honest gates.** Coverage thresholds that fail when coverage drops, and no gate kept alive
  as an alias for another.

## Re-running this audit

```bash
npm run lint && npm run lint:css && npm run typecheck
npm run test:unit:ci && npm run coverage:check && npm run test:integration
npm run build && npm run api:spec:check && npm run api:types:check && npm run security:scan
```

Write the result to a **new** dated file under
[`docs/internal/audits/saas-readiness/`](docs/internal/audits/saas-readiness/) and update this
checklist to point at it. Prior audits are immutable; this checklist is the only mutable surface.
