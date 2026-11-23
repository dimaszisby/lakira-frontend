# SaaS Base Checklist

**Audit date:** 2026-11-14 (re-audit; evidence gathered 2026-11-14 to 2026-11-22)
**Full audit:** [`docs/internal/audits/saas-readiness/audit-2026-11-14.md`](docs/internal/audits/saas-readiness/audit-2026-11-14.md)
**Previous runs:** [`audit-2026-10-10.md`](docs/internal/audits/saas-readiness/audit-2026-10-10.md), [`audit-2026-10-04.md`](docs/internal/audits/saas-readiness/audit-2026-10-04.md), [`audit-2026-08-29.md`](docs/internal/audits/saas-readiness/audit-2026-08-29.md), [`audit-2026-08-24.md`](docs/internal/audits/saas-readiness/audit-2026-08-24.md) (baseline)
**Roadmap:** [`iteration-plan.md`](docs/internal/audits/saas-readiness/iteration-plan.md)
**Verdict authority:** ADR-001 in [`decisions.md`](docs/internal/audits/saas-readiness/decisions.md)

## Verdict

> **FORK-READY WITH CAVEATS is not reconfirmed, on two categories, and neither is CI/CD.** Three
> of the four ADR-001 criteria pass: zero P0 gaps, every empirical gate green on the pinned Node 24,
> and `LICENSE` plus `.env.example` present. Criterion 3 fails because **Auth & Session is at
> 75%** and **Forkability at 71%**. Session revival redirects to the server's bind address behind
> a reverse proxy (N17), the return path after sign-in can leave the site (N19), a freshly
> bootstrapped fork fails the unit gate (N18), and `SECURITY.md` routes reporters to a channel
> that is switched off (N22). **CI/CD is at 83%:** the deployment configuration is committed and
> smoke-tested in CI, and the deploy job still waits on #194. Every row this checklist marked
> "pending a dated run" was re-tested; all but field vitals closed.

## Fork-ready exit criteria

| #   | Criterion                            | Status (2026-11-14)                                    | 2026-10-10                   |
| --- | ------------------------------------ | ------------------------------------------------------ | ---------------------------- |
| 1   | Zero P0 gaps remaining               | PASS                                                   | PASS                         |
| 2   | All empirical gates green            | PASS — 17 of 17, on Node 24.22.2                       | PASS — 16 of 16              |
| 3   | Critical categories at ≥ 80%         | **FAIL — 5 of 7.** Auth & Session 75%, Forkability 71% | **FAIL — 6 of 7.** CI/CD 67% |
| 4   | `LICENSE` and `.env.example` at root | PASS                                                   | PASS                         |

## Scorecard

| Category                          | Pass   | Partial | Missing | % Pass  | 2026-10-10 | Critical |
| --------------------------------- | ------ | ------- | ------- | ------- | ---------- | -------- |
| 1. Auth & Session                 | 6      | 2       | 0       | 75%     | 100%       | Yes      |
| 2. API Contract & Data Access     | 6      | 0       | 0       | 100%    | 100%       |          |
| 3. Routing & Rendering            | 6      | 0       | 0       | 100%    | 83%        |          |
| 4. Security                       | 8      | 0       | 0       | 100%    | 100%       | Yes      |
| 5. Error Handling & Observability | 5      | 0       | 0       | 100%    | 80%        |          |
| 6. Developer Experience           | 6      | 1       | 0       | 86%     | 100%       | Yes      |
| 7. Testing                        | 7      | 0       | 0       | 100%    | 86%        | Yes      |
| 8. CI/CD & Deployment             | 5      | 0       | 1       | 83%     | 67%        | Yes      |
| 9. Accessibility                  | 4      | 0       | 0       | 100%    | 50%        |          |
| 10. Performance                   | 3      | 1       | 0       | 75%     | 75%        |          |
| 11. Multi-Tenancy & SaaS Surface  | 4      | 0       | 0       | 100%    | 80%        | Yes      |
| 12. Code Architecture             | 6      | 0       | 0       | 100%    | 83%        |          |
| 13. Forkability                   | 5      | 2       | 0       | 71%     | 86%        | Yes      |
| **Total (78 counted, 1 N/A)**     | **71** | **6**   | **1**   | **91%** | **86%**    |          |

**Severity counts:** P0 = **0** · P1 = **4** · P2 = **7**. The baseline had 8 / 21 / 8.

"Subscription or plan surface" is N/A under ADR-005, so Category 11 counts four items. Seven items
moved up and four down; every one of the four rests on a defect this run found, and only N18 is a
regression since 2026-10-10. The audit lists every item's grade and how it was graded.

## Empirical gates (2026-11-14, Node 24.22.2)

| Command                      | Result                                         |
| ---------------------------- | ---------------------------------------------- |
| `npm ci`                     | PASS                                           |
| `npm run lint`               | PASS — `--max-warnings=0`, 0 warnings          |
| `npm run lint:css`           | PASS                                           |
| `npm run typecheck`          | PASS                                           |
| `npm run format`             | PASS                                           |
| `npm run test:unit:ci`       | PASS — 1237 tests                              |
| `npm run coverage:check`     | PASS — `--strict`                              |
| `npm run test:integration`   | PASS — 180 tests                               |
| `npm run build`              | PASS                                           |
| `npm run api:spec:check`     | PASS — 35 paths                                |
| `npm run api:types:check`    | PASS                                           |
| `npm run security:scan`      | PASS — production dependencies, none at `high` |
| `npm run test:e2e`           | PASS — 18 tests                                |
| `npm run test:e2e:csp`       | PASS — 7 tests                                 |
| `npm run test:e2e:stack`     | PASS — 72 tests; local backend and Mailpit     |
| `npm run test:e2e:csp:stack` | PASS — 8 tests; local backend and Mailpit      |
| `npm run docker:smoke`       | PASS — the production image                    |

> `.nvmrc` pins Node 24 and CI reads it. The stack suites run in CI every night in
> `frontend-stack-e2e`, not on pull requests. 42 of 43 gates broken on purpose in this run failed
> as they should; the one that did not is N24.

## Open items

|         | Severity |                                                                                                                                                |
| ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **N17** | P1       | **Session revival redirects to the server's bind address behind a reverse proxy.** Reproduced in the production image. Keeps the verdict open. |
| **N18** | P1       | **A bootstrapped fork fails the unit gate**: a test reads `docs/internal/`, which the script removes. Keeps the verdict open.                  |
| **C4**  | P1       | **No deploy job.** The configuration is committed; the job waits on #194.                                                                      |
| **N20** | P1       | **Security finding in the API proxy.** Details withheld from this public record.                                                               |
| **N19** | P2       | **Security finding in the sign-in return path.** Details withheld from this public record. Keeps the verdict open.                             |
| **N21** | P2       | A backend outage during session revival signs the user out.                                                                                    |
| **N22** | P2       | Private vulnerability reporting is off, while `SECURITY.md` and the form chooser send reporters there.                                         |
| **N23** | P2       | Three statements that no longer hold: the README's local API port, and two on the accessibility checks.                                        |
| **N24** | P2       | Nothing pins ADR-0050's loopback rule; with it undone, every test passes.                                                                      |
| **N25** | P2       | The dashboard's time zone is fixed to Asia/Jakarta.                                                                                            |
|         | P2       | Field vitals are not aggregated (#167).                                                                                                        |

Closed since 2026-10-10, each re-tested in this run: **N7**, **N12** to **N16**, **C6**, the
route-group error boundaries, the named accessibility step, the WCAG baseline's placeholders,
`CODE_OF_CONDUCT.md`, end-to-end coverage in CI, and the eight items the last run carried. Open
work is in [GitHub Issues](https://github.com/dimaszisby/lakira-frontend/issues).

## What is strong

- **Gates that fail when they should.** Forty-three were broken on purpose in this run, on top of
  the eighteen of the two runs before. All but one caught it; the one that did not is N24.
- **The proxy holds.** Fifteen encodings of the path escape, the client's address on every path to
  the backend, and the token kept out of every response body, all re-attacked on a production build.
- **Script runs by nonce,** on every page, with a fresh nonce per response, and a suite in CI fails
  on one un-nonced script.
- **The signed-in journeys run in CI** every night against a backend built from its `dev`:
  registration, email verification, password reset, invites, an organization switch, a metric
  from creation to the dashboard, and accessibility on pages with data.
- **The production image is checked on every pull request:** non-root, no development
  dependencies, Node from `.nvmrc`, a nonce on every page, and a clean stop.
- **Tenant isolation.** Every cache key carries the organization id, as a required argument.

## Re-running this audit

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run format
npm run test:unit:ci && npm run coverage:check && npm run test:integration
npm run build && npm run api:spec:check && npm run api:types:check && npm run security:scan
npm run test:e2e && npm run test:e2e:csp && npm run docker:smoke
```

Write the result to a **new** dated file under
[`docs/internal/audits/saas-readiness/`](docs/internal/audits/saas-readiness/) and update this
checklist to point at it. Prior audits are immutable; this checklist is the only mutable surface.
