# SaaS Base Checklist

**Audit date:** 2026-10-10 (re-audit)
**Full audit:** [`docs/internal/audits/saas-readiness/audit-2026-10-10.md`](docs/internal/audits/saas-readiness/audit-2026-10-10.md)
**Previous runs:** [`audit-2026-10-04.md`](docs/internal/audits/saas-readiness/audit-2026-10-04.md), [`audit-2026-08-29.md`](docs/internal/audits/saas-readiness/audit-2026-08-29.md), [`audit-2026-08-24.md`](docs/internal/audits/saas-readiness/audit-2026-08-24.md) (baseline)
**Roadmap:** [`iteration-plan.md`](docs/internal/audits/saas-readiness/iteration-plan.md)
**Verdict authority:** ADR-001 in [`decisions.md`](docs/internal/audits/saas-readiness/decisions.md)

## Verdict

> **FORK-READY WITH CAVEATS is not reconfirmed, on one category.** Three of the four ADR-001
> criteria pass: zero P0 gaps, every empirical gate green on the pinned Node 24, and `LICENSE` plus
> `.env.example` present. Criterion 3 fails because **CI/CD is at 67%**: there is no deploy job and
> no deployment configuration, which waits on the hosting decision. The owner chose on 2026-10-10
> to leave ADR-001 as written, so that is the one thing between this repository and the verdict.
> The other six critical categories are at 80% or more. Since the previous run the three P1s it
> found by probing are closed and were re-tested on a production build: the proxy no longer leaves
> its API base, a bootstrapped fork is green, and no token reaches browser JavaScript. Two
> categories fell without a change in the code: Accessibility, on a stricter independent reading,
> and Error Handling, on a defect this run found in four forms.

## Fork-ready exit criteria

| #   | Criterion                            | Status (2026-10-10)              | 2026-10-04                                    |
| --- | ------------------------------------ | -------------------------------- | --------------------------------------------- |
| 1   | Zero P0 gaps remaining               | PASS                             | PASS                                          |
| 2   | All empirical gates green            | PASS — 16 of 16, on Node 24.21.0 | PASS — 14 of 14                               |
| 3   | Critical categories at ≥ 80%         | **FAIL — 6 of 7.** CI/CD 67%     | **FAIL — 5 of 7.** CI/CD 67%, Forkability 71% |
| 4   | `LICENSE` and `.env.example` at root | PASS                             | PASS                                          |

## Scorecard

| Category                          | Pass   | Partial | Missing | % Pass  | 2026-10-04 | Critical |
| --------------------------------- | ------ | ------- | ------- | ------- | ---------- | -------- |
| 1. Auth & Session                 | 8      | 0       | 0       | 100%    | 88%        | Yes      |
| 2. API Contract & Data Access     | 6      | 0       | 0       | 100%    | 83%        |          |
| 3. Routing & Rendering            | 5      | 1       | 0       | 83%     | 83%        |          |
| 4. Security                       | 8      | 0       | 0       | 100%    | 88%        | Yes      |
| 5. Error Handling & Observability | 4      | 1       | 0       | 80%     | 100%       |          |
| 6. Developer Experience           | 7      | 0       | 0       | 100%    | 100%       | Yes      |
| 7. Testing                        | 6      | 1       | 0       | 86%     | 86%        | Yes      |
| 8. CI/CD & Deployment             | 4      | 0       | 2       | 67%     | 67%        | Yes      |
| 9. Accessibility                  | 2      | 2       | 0       | 50%     | 100%       |          |
| 10. Performance                   | 3      | 1       | 0       | 75%     | 75%        |          |
| 11. Multi-Tenancy & SaaS Surface  | 4      | 0       | 1       | 80%     | 80%        | Yes      |
| 12. Code Architecture             | 5      | 1       | 0       | 83%     | 83%        |          |
| 13. Forkability                   | 6      | 1       | 0       | 86%     | 71%        | Yes      |
| **Total (79 items)**              | **68** | **8**   | **3**   | **86%** | **85%**    |          |

**Severity counts:** P0 = **0** · P1 = **3** · P2 = **13**. The baseline had 8 / 21 / 8.

The total moved by one item and hides seven: four items closed, and three that had been graded Pass
were lowered, two by an independent grader's stricter reading and one by a defect this run found.
The audit lists every item's grade and how it was graded.

## Empirical gates (2026-10-10, Node 24.21.0)

| Command                      | Result                                             |
| ---------------------------- | -------------------------------------------------- |
| `npm ci`                     | PASS                                               |
| `npm run lint`               | PASS — `--max-warnings=0`, 0 warnings              |
| `npm run lint:css`           | PASS                                               |
| `npm run typecheck`          | PASS                                               |
| `npm run format`             | PASS                                               |
| `npm run test:unit:ci`       | PASS — 943 tests                                   |
| `npm run coverage:check`     | PASS — `--strict`                                  |
| `npm run test:integration`   | PASS — 125 tests                                   |
| `npm run build`              | PASS                                               |
| `npm run api:spec:check`     | PASS                                               |
| `npm run api:types:check`    | PASS                                               |
| `npm run security:scan`      | PASS — production dependencies, 0 advisories       |
| `npm run test:e2e`           | PASS — 18 tests                                    |
| `npm run test:e2e:csp`       | PASS — 7 tests                                     |
| `npm run test:e2e:stack`     | PASS — 28 tests; local backend and Mailpit, not CI |
| `npm run test:e2e:csp:stack` | PASS — 7 tests; local backend and Mailpit, not CI  |

> `.nvmrc` pins Node 24 and CI reads it. The unit gate is recorded with no `NEXT_PUBLIC_*` variable
> exported, as CI runs it; one test fails when `NEXT_PUBLIC_API_BASE_URL` is exported (N13). The
> nightly `dependency-audit` workflow, which audits development dependencies too, is red on six
> advisories, one of them critical in `handlebars` through `ts-jest` (N14).

## Open items

|         | Severity |                                                                                                                                                                                                                                                                      |
| ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C4**  | P1       | **No deploy job or deployment configuration.** Two items, and the only reason criterion 3 fails. Waits on the hosting decision.                                                                                                                                      |
|         | P1       | **End-to-end coverage.** Every core journey has a spec now, including creating a metric and logging a value. None of the specs that sign in runs in CI.                                                                                                              |
| **N12** | P2       | **Four forms print the transport error, not the server's message.** A 409 reads "Request failed with status code 409".                                                                                                                                               |
| **N7**  | P2       | **Reduced.** The application's log lines are scrubbed (ADR-0027). Next prints a Server Component's error itself, unscrubbed.                                                                                                                                         |
| **C6**  | P2       | Two files still quarantined from the layer rule.                                                                                                                                                                                                                     |
|         | P2       | Ten more, listed in the audit: N13 to N16, the accessibility check in CI is unnamed and covers public pages only, the WCAG baseline is unfinished, no `CODE_OF_CONDUCT.md`, no plan surface, field vitals not aggregated, and route groups without error boundaries. |

Closed since 2026-10-04, each re-tested in this run: **N1** (proxy path escape), **N2** (fork fails
`format`), **N3** (token in browser JavaScript), **N4** (inline script in the CSP), **N5**, **N6**,
**N8** to **N11**, and the dashboard invalidator. Findings that need code are in
[`docs/internal/todos/2026-10-10-todo-reaudit-findings.md`](docs/internal/todos/2026-10-10-todo-reaudit-findings.md).

## What is strong

- **Fixes that held up under the probe that found the defect.** The proxy escape, the token, the
  CSP and the telemetry cap were re-attacked on a production build.
- **Gates that fail when they should.** Eighteen have now been broken on purpose across two runs,
  including the two that guard tenant isolation and the edge session gate. All eighteen caught it.
- **Auth lifecycle, verified live.** Registration, email verification, password reset, invite
  acceptance and an organization switch, against a real backend and a real inbox. The session
  cookie is set by the server and never passes through the browser's JavaScript.
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
