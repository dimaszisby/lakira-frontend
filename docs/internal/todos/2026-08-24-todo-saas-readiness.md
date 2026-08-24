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

## Phase 2 — De-branding + white-label (complete, one item deferred)

- [x] `src/constants/app.ts` — app name, description, title separator, cookie name, cookie
      options, session max-age, theme storage key
- [x] Mapped `constants` in `eslint.config.mjs` `boundaries/elements`. It was unmapped, like
      `src/components/**` was before 2026-08-17, so `utils -> constants` only worked because the
      rule did not run. Mapping it surfaced **zero** new violations (the components mapping
      surfaced 126). `hooks`, `styles` and `test-utils` remain unmapped.
- [x] `middleware.ts` **does** resolve the `@/constants/*` alias despite sitting outside the
      `src/**` element map — verified by typecheck, lint and build. No fork-script fallback needed.
- [x] Replaced all 8 inline `lakira_token` literals
- [x] Reconciled `lakira.theme`. `src/utils/theme.ts` imports the constant;
      `public/scripts/theme-init.js` keeps a literal because it is a blocking inline script with
      no module system, now cross-referenced in both directions and kept in sync by the fork script
- [x] 6 metadata titles collapsed onto a root `title.template`, which also removes the
      inconsistent `-` vs `•` separator split
- [x] 6 visible-copy sites
- [x] `cypress/e2e/home.cy.ts` asserts structure instead of brand copy
- [x] `scripts/api/*.mjs` — covered by Phase 1's fork script, which rewrites the env prefix and
      repoints the owner to `your-org`. No source change needed here.
- [x] `manifest.ts` added; dead `<link rel="icon">` removed from `src/app/layout.tsx`
      (it pointed at `/favicon.ico`, which does not exist in `public/`)
- [ ] `robots.ts` / `sitemap.ts` — **deferred to Phase 3.** Both need a base-URL helper, and the
      only origin-resolution logic lives privately inside `src/services/api/api.ts` with zero test
      coverage. Duplicating the env chain would violate `.claude/rules/environment.md`; extracting
      it is Phase 3's job, once `src/lib/env.ts` exists.
- [x] Fork surface measured: `bootstrap-fork.sh` rewrote **115 files before, 93 after**

## Phase 3 — Env validation + DX (complete)

- [x] `src/lib/env.ts` — Zod schema, public and server segments, no throw at module load
- [x] 17 unit tests in `src/lib/__tests__/env.test.ts`, written **before** the `api.ts` refactor.
      `resolveAppOrigin` had lived unexported and untested inside `src/services/api/api.ts`;
      Phase 2 deferred touching it for exactly that reason.
- [x] Fixed `src/app/api/auth/login/route.ts` — no longer builds `undefined/auth/login`
- [x] Proxy resolves the base URL **per request**, not at module load, and returns a 500 naming
      the missing configuration instead of fetching `undefined/...`
- [x] `src/services/api/api.ts` refactored onto the shared `resolveAppOrigin()`
- [x] Three `NEXT_PUBLIC_ENABLE_DUMMY_ACTIONS` reads replaced with `isDummyActionsEnabled`
- [x] **Resolved the port conflict: `:8001` is canonical, not `:4000`.** The audit and the
      original plan both assumed `:4000` because that is what reference prose said. The executed
      path disagrees: `docs/tutorials/getting-started.md` and
      `docs/how-to/development/run-against-a-local-backend.md` both use `:8001`, both were
      validated by running them verbatim (commit `034442d`), and `:8001` exists to dodge the
      macOS AirPlay clash on the backend's own default of `5000` — which answers 403 rather than
      refusing, so it presents as a broken API. `docs/reference/environments.md` had contradicted
      itself, `:8001` in its table and `:4000` in its prose.
- [x] Corrected `.env.example` from Phase 1, which had `:4000`
- [x] Corrected `.claude/rules/environment.md`: the `.env*` guardrail claim (the global hook
      explicitly allows `.env.example`), the local port, and the resolved-problems list
- [x] Updated `docs/reference/{configuration,environments,routes-and-proxy}.md`,
      `docs/reference/ci-pipeline/backend-handoff.md`, `docs/tutorials/getting-started.md`,
      `docs/how-to/development/run-against-a-local-backend.md`
- [x] Ticked the long-open port item in `docs/internal/todos/2026-08-17-todo-claude-code-setup.md`
- [x] `robots.ts` and `sitemap.ts`, carried over from Phase 2 and unblocked by `resolveAppOrigin()`
- [ ] `next.config.ts` still reads `NEXT_PUBLIC_API_BASE_URL` raw — it runs before the app's
      module graph exists and cannot import from `src/`. Documented as a known exception.

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
