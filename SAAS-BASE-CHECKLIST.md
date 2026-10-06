# SaaS Base Checklist

**Audit date:** 2026-10-04 (re-audit)
**Full audit:** [`docs/internal/audits/saas-readiness/audit-2026-10-04.md`](docs/internal/audits/saas-readiness/audit-2026-10-04.md)
**Previous runs:** [`audit-2026-08-29.md`](docs/internal/audits/saas-readiness/audit-2026-08-29.md), [`audit-2026-08-24.md`](docs/internal/audits/saas-readiness/audit-2026-08-24.md) (baseline)
**Roadmap:** [`iteration-plan.md`](docs/internal/audits/saas-readiness/iteration-plan.md)
**Verdict authority:** ADR-001 in [`decisions.md`](docs/internal/audits/saas-readiness/decisions.md)

## Verdict

> **FORK-READY WITH CAVEATS is not reconfirmed.** Three of the four ADR-001 criteria pass: zero P0
> gaps, every empirical gate green on the pinned Node 24, and `LICENSE` plus `.env.example`
> present. Criterion 3 fails, with two of the seven critical categories under 80%. **CI/CD is at
> 67%, unchanged**: the previous run passed it as an exception that ADR-001 does not provide for,
> and this run reads the gate as written. **Forkability is at 71%**: a freshly bootstrapped fork
> fails the `format` gate, so its first CI run is red. Since the previous run the organization
> switcher shipped, the three email-token flows were verified end to end, Sentry went in behind
> the log sink, and lint warnings and formatting became gates. This run also found three new P1s
> by probing: the API proxy can be steered outside its API base, the fork failure above, and the
> access token passing through browser JavaScript at sign-in.

## Fork-ready exit criteria

| #   | Criterion                            | Status (2026-10-04)                           | 2026-08-29              |
| --- | ------------------------------------ | --------------------------------------------- | ----------------------- |
| 1   | Zero P0 gaps remaining               | PASS                                          | PASS                    |
| 2   | All empirical gates green            | PASS — 14 of 14, on Node 24.21.0              | PASS                    |
| 3   | Critical categories at ≥ 80%         | **FAIL — 5 of 7.** CI/CD 67%, Forkability 71% | PASS with one exception |
| 4   | `LICENSE` and `.env.example` at root | PASS                                          | PASS                    |

## Scorecard

| Category                          | Pass   | Partial | Missing | % Pass  | 2026-08-29 | Critical |
| --------------------------------- | ------ | ------- | ------- | ------- | ---------- | -------- |
| 1. Auth & Session                 | 7      | 1       | 0       | 88%     | 88%        | Yes      |
| 2. API Contract & Data Access     | 5      | 1       | 0       | 83%     | 100%       |          |
| 3. Routing & Rendering            | 5      | 1       | 0       | 83%     | 83%        |          |
| 4. Security                       | 7      | 1       | 0       | 88%     | 88%        | Yes      |
| 5. Error Handling & Observability | 5      | 0       | 0       | 100%    | 80%        |          |
| 6. Developer Experience           | 7      | 0       | 0       | 100%    | 100%       | Yes      |
| 7. Testing                        | 6      | 1       | 0       | 86%     | 86%        | Yes      |
| 8. CI/CD & Deployment             | 4      | 0       | 2       | 67%     | 67%        | Yes      |
| 9. Accessibility                  | 4      | 0       | 0       | 100%    | 75%        |          |
| 10. Performance                   | 3      | 1       | 0       | 75%     | 75%        |          |
| 11. Multi-Tenancy & SaaS Surface  | 4      | 0       | 1       | 80%     | 80%        | Yes      |
| 12. Code Architecture             | 5      | 1       | 0       | 83%     | 67%        |          |
| 13. Forkability                   | 5      | 2       | 0       | 71%     | 86%        | Yes      |
| **Total (79 items)**              | **67** | **9**   | **3**   | **85%** | **84%**    |          |

**Severity counts:** P0 = **0** · P1 = **6** · P2 = **14**. The baseline had 8 / 21 / 8.

The total hides two movements: six items closed, and four that had been graded Pass were lowered
because this run probed them and found a defect. The audit lists every item's grade.

## Empirical gates (2026-10-04, Node 24.21.0)

| Command                    | Result                                             |
| -------------------------- | -------------------------------------------------- |
| `npm run lint`             | PASS — `--max-warnings=0`, 0 warnings              |
| `npm run lint:css`         | PASS                                               |
| `npm run typecheck`        | PASS                                               |
| `npm run format`           | PASS                                               |
| `npm run test:unit:ci`     | PASS — 755 tests                                   |
| `npm run coverage:check`   | PASS — `--strict`                                  |
| `npm run test:integration` | PASS — 127 tests                                   |
| `npm run build`            | PASS                                               |
| `npm run api:spec:check`   | PASS                                               |
| `npm run api:types:check`  | PASS                                               |
| `npm run security:scan`    | PASS — production dependencies, 0 advisories       |
| `npm run test:e2e`         | PASS — 18 tests                                    |
| `npm run test:e2e:stack`   | PASS — 13 tests; local backend and Mailpit, not CI |
| `npm ci`                   | PASS                                               |

> `.nvmrc` pins Node 24 and CI reads it. The nightly `dependency-audit` workflow, which audits
> development dependencies too, is red on one advisory in `braces`; see
> `docs/internal/todos/2026-10-03-todo-braces-dev-advisory.md`.

## Open items

|        | Severity |                                                                                                                                                                                                                                                              |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **C4** | P1       | **No deploy job or deployment configuration.** Two items, and the reason CI/CD sits at 67%. Waits on the hosting decision.                                                                                                                                   |
| **N1** | P1       | **Fixed in #72, pending a dated run.** The API proxy forwarded outside its API base.                                                                                                                                                                         |
| **N2** | P1       | **Fixed in #71, pending a dated run.** A bootstrapped fork failed `format`. Forkability stays at 71% until that run.                                                                                                                                         |
| **N3** | P1       | **Fixed, pending a dated run** (ADR-0025). The access token passed through browser JavaScript at sign-in.                                                                                                                                                    |
|        | P1       | **End-to-end coverage.** The three stack specs never run in CI, and creating a metric and logging a value are not covered.                                                                                                                                   |
| **N4** | P2       | **Fixed, pending a dated run** (ADR-0026). The production CSP allowed inline script.                                                                                                                                                                         |
| **C6** | P2       | Two files still quarantined from the layer rule (was six).                                                                                                                                                                                                   |
|        | P2       | Twelve more, listed in the audit: N5 to N11 (**N6 and N7 fixed, pending a dated run**, ADR-0027), no `CODE_OF_CONDUCT.md`, no plan surface, field vitals not aggregated, route groups without error boundaries, and `vizKeys.dashboard` with no invalidator. |

Closed since 2026-08-29: **C1** (organization switcher), **C2** (three unverified flows), **C3**
(vendor error sink, ADR-0024), **C5** (secret scan).

## What is strong

- **Gates that fail when they should.** Eight were broken on purpose in this run, including the
  two that guard tenant isolation and the edge session gate. All eight caught it.
- **Auth lifecycle, verified live.** Registration, email verification, password reset, invite
  acceptance and an organization switch, against a real backend and a real inbox.
- **Tenant isolation.** Every cache key carries the organization id, as a required argument.
- **Environment.** One validated module, and a production build that refuses to start without a
  backend URL.
- **Monitoring that defaults to off.** No vendor code in the browser and no CSP origin; a fork
  without a DSN never loads the SDK.

## Re-running this audit

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run format
npm run test:unit:ci && npm run coverage:check && npm run test:integration
npm run build && npm run api:spec:check && npm run api:types:check && npm run security:scan
npm run test:e2e
```

Write the result to a **new** dated file under
[`docs/internal/audits/saas-readiness/`](docs/internal/audits/saas-readiness/) and update this
checklist to point at it. Prior audits are immutable; this checklist is the only mutable surface.
