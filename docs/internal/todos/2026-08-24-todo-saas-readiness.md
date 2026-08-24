# TODO — SaaS-base readiness remediation

**Opened:** 2026-08-24
**Branch:** `feature/saas-readiness` (off `dev`)
**Roadmap:** [`../audits/saas-readiness/iteration-plan.md`](../audits/saas-readiness/iteration-plan.md)
**Baseline:** [`../audits/saas-readiness/audit-2026-08-24.md`](../audits/saas-readiness/audit-2026-08-24.md)

Scope chosen by the user: **full remediation** — close every P0 and P1, not just scaffold the
audit. Phases land as separate PRs; this file tracks them.

## Phase 0 — Kit + baseline audit PASS

- [x] Unblock `.env.example` — `!.env.example` at `.gitignore:39`, verified with `git check-ignore`
- [x] Write `.env.example` from the documented env matrix
- [x] Run all eight empirical gates, capture real exit codes
- [x] `docs/internal/audits/saas-readiness/README.md`
- [x] `docs/internal/audits/saas-readiness/audit-2026-08-24.md` — 78 items, 13 categories
- [x] `docs/internal/audits/saas-readiness/decisions.md` — ADR-001..004
- [x] `docs/internal/audits/saas-readiness/iteration-plan.md`
- [x] `SAAS-BASE-CHECKLIST.md` at repo root
- [x] `docs/internal/audits/README.md` — new program index
- [x] Link the kit from `docs/README.md`; fix its stale file count (54/76 → 58/120)

## Phase 1 — Forkability scaffolding (complete)

- [x] `LICENSE` (MIT, matching the backend)
- [x] `CONTRIBUTING.md`
- [x] `SECURITY.md`
- [x] `.nvmrc` pinning Node 20 + `engines.node`
- [x] `scripts/bootstrap-fork.sh --name <slug>`, validated slug, idempotent, portable `sed -i`
- [x] README: licence, deployment, fork/rename sections; fix the quick-start heredoc pointing at
      the staging backend that has been down since 2026-08-22
- [x] Verify the fork flow on a real scratch clone — the backend's caveat C1 was that its own
      script did not work as printed

## Phase 2 — De-branding + white-label

- [ ] `src/constants/app.ts` — app name, cookie name, theme storage key, wordmark
- [ ] Check whether `middleware.ts` resolves the path alias; if not, `bootstrap-fork.sh` owns it
- [ ] Replace 8 inline `lakira_token` literals — **renaming invalidates live sessions once**
- [ ] Reconcile `lakira.theme` between `src/utils/theme.ts` and `public/scripts/theme-init.js`
- [ ] 6 metadata titles; normalise the `-` vs `•` separator split
- [ ] 6 visible-copy sites
- [ ] Fix `cypress/e2e/home.cy.ts:7` — asserts on the brand string
- [ ] Generalise `scripts/api/*.mjs` off `dimaszisby/lakira-backend`
- [ ] `manifest.ts`, `robots.ts`, `sitemap.ts`, `openGraph`; drop the dead favicon link at
      `src/app/layout.tsx:41`

## Phase 3 — Env validation + DX

- [ ] `src/lib/env.ts` — Zod schema, server/client segments, fail-fast
- [ ] Fix `src/app/api/auth/login/route.ts:6` (`undefined/auth/login`)
- [ ] Resolve the three conflicting local port defaults; do not add a fourth
- [ ] Correct `.claude/rules/environment.md` — it says Claude cannot edit `.env*`, but the global
      hook explicitly exempts `.env.example`
- [ ] Update `docs/reference/configuration.md` + `environments.md` in the same commit

## Phase 4 — Observability

- [ ] `@sentry/nextjs` + `instrumentation.ts` + client/server/edge configs
- [ ] `beforeSend` PII scrubber (the backend's open caveat C5 — do not repeat it)
- [ ] Make the CSP report sink persist in production
- [ ] `useReportWebVitals` → the sink
- [ ] Add the ingest origin to the CSP explicitly; never widen to a wildcard

## Phase 5 — Auth lifecycle

- [ ] `/auth/refresh` — retry-once on 401 inside the proxy
- [ ] `/verify-email` + resend affordance
- [ ] `/forgot-password` + `/reset-password`
- [ ] Middleware: decode and check `exp`, not just presence
- [ ] Middleware: de-duplicate the protected-path list
- [ ] `session/route.ts`: validate the token before setting the cookie
- [ ] `logout/route.ts`: clear with matching cookie attributes
- [ ] Invert the proxy allowlist to deny-by-default

## Phase 6 — Multi-tenancy UI (**ADR-004: never partially**)

- [ ] Kit: `docs/internal/initiatives/multi-tenancy-ui/`
- [ ] Read `docs/internal/incidents/` first — cache-key assumptions have bitten this repo before
- [ ] `src/features/organizations/` — switcher, members, invites, roles
- [ ] `/invites/accept` route; `/auth/switch-org` wiring
- [ ] **Org dimension into all six `src/features/*/keys.ts` in one change**
- [ ] One integration test per feature asserting the key changes with the active org
- [ ] Manual two-org cross-check: org A never sees org B's cached data

## Phase 7 — Testing, gates, CI/CD, deploy

- [ ] Ratchet `coverageThreshold.global` off 3/2/3/3; wire `coverage:check` into CI
- [ ] Populate `src/test-utils/msw/handlers.ts`; drop module-level hook mocks
- [ ] Replace or delete the `check-accessibility` stub; name a11y as a CI step
- [ ] Expand Cypress past its single spec
- [ ] `gitleaks-action` v1.6.0 → v2, SHA-pinned
- [ ] Deploy config + gated `deploy_production` job
- [ ] Reconcile `CODECOV_TOKEN`
- [ ] Sync the drifted OpenAPI snapshot (`api:spec:check` is red on `dev`)

## Phase 8 — Re-audit + closeout

- [ ] New dated `audit-YYYY-MM-DD.md`; diff the scorecard against the baseline
- [ ] Update `SAAS-BASE-CHECKLIST.md` verdict
- [ ] `FINAL-AUDIT-SUMMARY.md`
- [ ] Promote stabilised kit ADRs into `docs/explanation/decisions/` from `adr-0015`

## Status

_Phase 0 complete 2026-08-24. Appended per `.claude/rules/workflow.md` as later phases land._
