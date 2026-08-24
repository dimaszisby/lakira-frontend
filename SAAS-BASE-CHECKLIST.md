# SaaS Base Checklist

**Audit date:** 2026-08-24 (baseline)
**Full audit:** [`docs/internal/audits/saas-readiness/audit-2026-08-24.md`](docs/internal/audits/saas-readiness/audit-2026-08-24.md)
**Roadmap:** [`iteration-plan.md`](docs/internal/audits/saas-readiness/iteration-plan.md)
**Kit overview:** [`README.md`](docs/internal/audits/saas-readiness/README.md)
**Verdict authority:** ADR-001 in [`decisions.md`](docs/internal/audits/saas-readiness/decisions.md)

## Verdict

> **NOT FORK-READY — the frontend does not implement the tenancy model its own contract
> declares.** Seven of eight empirical gates are green and the craft is good: eight enforced
> layer boundaries, 71 passing test suites, a full CSP and security-header set, a session token
> that genuinely never reaches JavaScript, and a 116-file Diátaxis documentation tree. What
> blocks fork-readiness is structural. The vendored contract exposes `/organizations/*`,
> `/memberships/*`, `/invites/accept`, and `/auth/switch-org`; a grep of `src/` matches only the
> generated types file. There is no organization concept in the UI and none of the six
> `keys.ts` cache-key factories carry an org dimension — the same defect the backend patched as
> N1/N2. Alongside it: no `LICENSE`, no environment validation, no error monitoring, no
> deployment configuration, and five auth-lifecycle flows that exist in the contract and not in
> the app. Four gates pass vacuously and are graded as findings.

## Fork-ready exit criteria

All four must hold (ADR-001):

| #   | Criterion                                    | Status (2026-08-24)                     |
| --- | -------------------------------------------- | --------------------------------------- |
| 1   | Zero P0 gaps remaining                       | FAIL — 8 open                           |
| 2   | All eight empirical gates green              | FAIL — `api:spec:check` exits 1         |
| 3   | Seven critical categories at ≥ 80% Pass      | FAIL — best is Security at 63%          |
| 4   | `LICENSE` and `.env.example` present at root | FAIL — `.env.example` yes, `LICENSE` no |

## Scorecard

| Category                          | Pass   | Partial | Missing | % Pass  | Critical |
| --------------------------------- | ------ | ------- | ------- | ------- | -------- |
| 1. Auth & Session                 | 2      | 3       | 3       | 25%     | Yes      |
| 2. API Contract & Data Access     | 4      | 1       | 1       | 67%     |          |
| 3. Routing & Rendering            | 3      | 2       | 1       | 50%     |          |
| 4. Security                       | 5      | 3       | 0       | 63%     | Yes      |
| 5. Error Handling & Observability | 1      | 1       | 3       | 20%     |          |
| 6. Developer Experience           | 4      | 1       | 2       | 57%     | Yes      |
| 7. Testing                        | 3      | 1       | 3       | 43%     | Yes      |
| 8. CI/CD & Deployment             | 2      | 2       | 2       | 33%     | Yes      |
| 9. Accessibility                  | 3      | 0       | 1       | 75%     |          |
| 10. Performance                   | 3      | 1       | 0       | 75%     |          |
| 11. Multi-Tenancy & SaaS Surface  | 0      | 0       | 5       | **0%**  | Yes      |
| 12. Code Architecture             | 3      | 3       | 0       | 50%     |          |
| 13. Forkability                   | 1      | 0       | 6       | 14%     | Yes      |
| **Total (79 items)**              | **34** | **18**  | **27**  | **43%** |          |

**Severity counts:** P0 = **8** · P1 = **21** · P2 = **8**.

## Empirical gates (2026-08-24)

| Command                    | Result                                             |
| -------------------------- | -------------------------------------------------- |
| `npm run lint`             | PASS exit 0 — 0 errors, 43 warnings                |
| `npm run lint:css`         | PASS exit 0                                        |
| `npm run typecheck`        | PASS exit 0                                        |
| `npm run test:unit`        | PASS exit 0 — 55 suites / 243 tests                |
| `npm run test:integration` | PASS exit 0 — 16 suites / 74 tests                 |
| `npm run build`            | PASS exit 0                                        |
| `npm run api:spec:check`   | **FAIL exit 1** — snapshot 2 paths behind upstream |
| `npm run api:types:check`  | PASS exit 0 (in sync with the stale snapshot)      |
| `npm run security:scan`    | PASS exit 0 — 0 vulnerabilities                    |

> Gates ran on host Node v26.5.0. CI pins Node 20 and the README asserts Node 20, but no
> `.nvmrc` exists — nothing enforces it. Re-confirm parity in CI.

## Top gaps

1. **[P0] No tenant representation in the UI**, against a contract that declares one — and six
   cache-key factories with no org dimension.
2. **[P0] `LICENSE` absent.** A base advertised as forkable, with no licence, is legally unforkable.
3. **[P0] No environment validation.** `src/app/api/auth/login/route.ts:6` builds
   `undefined/auth/login` when `API_URL` is unset.
4. **[P0] No error monitoring.** CSP violation reports are accepted and discarded in production.
5. **[P0] No token refresh**, despite `/auth/refresh` in the contract.
6. **[P1] `api:spec:check` is red on `dev` today** — the drift gate is working and unactioned.

## Gates that pass vacuously

Graded as findings per ADR-003, because this repo's `.claude/lessons.md` records
documented-but-unenforced gates as its recurring failure mode:

| Gate                          | Why it cannot fail                                           |
| ----------------------------- | ------------------------------------------------------------ |
| `coverageThreshold.global`    | Set to 3/2/3/3 %                                             |
| MSW integration harness       | `handlers` is `[]`; tests mock feature hooks at module level |
| `npm run check-accessibility` | Body is `npm install axe-core && echo '…(Placeholder)'`      |
| `npm run coverage:check`      | Not in CI; only fails under `--strict`, which nothing passes |

## What is already strong

- **Documentation** — 116-file Diátaxis tree, 14 ADRs with a registry, four incident postmortems.
- **Layer discipline** — eight elements, `default: "disallow"`, error-level, six exceptions
  quarantined in the open rather than hidden.
- **Session handling** — the token never reaches JavaScript; the proxy hop is applied consistently.
- **Security headers** — CSP with derived `connect-src`, DOMPurify everywhere, gitleaks on full
  history, zero dependency vulnerabilities.
- **Accessibility** — `jest-axe` assertions across ten integration suites.

## Re-running this audit

```bash
npm run lint && npm run lint:css && npm run typecheck && \
npm run test:unit && npm run test:integration && npm run build && \
npm run api:spec:check && npm run api:types:check && npm run security:scan
```

Write the result to a **new** file `docs/internal/audits/saas-readiness/audit-YYYY-MM-DD.md`
(do not overwrite a prior audit) and update this checklist to point at it. See the kit
[`README.md`](docs/internal/audits/saas-readiness/README.md) for the full recipe.
