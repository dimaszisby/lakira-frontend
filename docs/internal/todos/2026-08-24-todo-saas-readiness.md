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

## Phase 4 — Observability (4a complete; 4b pending a provider decision)

Split deliberately. 4a closes everything that needs no external account; 4b is the vendor
adapter, which needs a provider choice, a DSN, and a new CSP origin.

### 4a — provider-agnostic layer (done)

- [x] `src/lib/logger.ts` — structured JSON to stdout, one object per line, matching the
      backend's "logs as an event stream" change. No dependency added.
- [x] `SENSITIVE_KEY_PATTERN` is **substring-matched, not suffix-anchored**. The backend's is
      anchored with `$`, so it misses `authorization`, `cookie`, `bearer` and `dsn` — its own
      caveats C6 and F2. Verified by test and by a runtime smoke run.
- [x] `setLogSink()` — the seam an APM adapter registers against
- [x] CSP report sink **persists in production** instead of discarding, with an 8 KB body cap,
      per-field truncation, and a 204 response so a violating page never retries
- [x] Core Web Vitals RUM via `useReportWebVitals` -> `/api/observability/web-vitals`, using
      `sendBeacon` so unload-time CLS and LCP survive. Same-origin, so `connect-src 'self'`
      already covers it — **no CSP change needed**.
- [x] `src/app/global-error.tsx` and `src/app/not-found.tsx` (audit section 4.3 P1). Only two
      route subtrees had an `error.tsx`; everything else showed the raw Next.js default.
- [x] `/api/observability/client-error` receives boundary reports, schema-validated and capped
- [x] 38 tests in `src/lib/__tests__/logger.test.ts`, run under `@jest-environment node`
      because the logger no-ops in the browser and the unit default is jsdom
- [x] `docs/how-to/development/plug-in-error-monitoring.md`

### 4b — vendor adapter (blocked on a decision)

- [ ] Choose a provider. Needs a DSN, a dependency, and an explicit CSP ingest origin.
- [ ] Register it through `setLogSink()` in `instrumentation.ts`
- [ ] PII scrubber at the SDK level (`beforeSend` or equivalent) — the logger redacts by key,
      but an SDK also captures breadcrumbs, request bodies and locals it never sees
- [ ] Absent configuration must disable reporting, not throw

**Audit status:** section 4.5's P1s (RUM, discarded CSP reports, production diagnostics being
console-only) are closed. The **P0 "no error monitoring of any kind" is downgraded, not
closed** — structured stdout is collectable by any log drain, but it is not an error
aggregator. 4b closes it.

## Phase 5 — Auth lifecycle (5a complete; 5b is the UI flows)

Split like Phase 4: 5a hardens existing surface, 5b adds the five missing flows. 5a needs no
running backend to verify; 5b does.

### 5a — security fixes to existing surface (done)

- [x] `src/lib/jwt.ts` — dependency-free payload decode plus `exp` check. `jose` verifies
      signatures we deliberately do not check; `jwt-decode` is a few lines of base64url.
- [x] `middleware.ts` validates `exp`, not just cookie presence, and clears a stale cookie on
      redirect so the browser stops presenting a token every request will reject
- [x] `src/lib/auth-paths.ts` — one home for both "which pages need a session" and "which API
      paths are public"
- [x] **Proxy inverted to deny-by-default.** `PUBLIC_API_PATHS` lists the seven unauthenticated
      auth entry points from the contract; everything else needs a token. Verified against the
      OpenAPI spec: every operation declares `security` except those seven. `analytics/*` and
      `admin/_ping` were both exposed by the old protected-segment allowlist.
- [x] Whole-path matching, not prefix — a prefix match on `auth` would expose `auth/profile`,
      `auth/switch-org` and `auth/resend-verification`, all secured upstream
- [x] `/api/auth/session` validates structure, expiry, and backend acceptance before setting the
      cookie. A network failure during verification falls back to the structural checks rather
      than making login unavailable whenever the backend blips.
- [x] `/api/auth/login` guards JSON parsing and rejects a malformed upstream token instead of
      storing it — that failure used to surface later as an unexplained 401
- [x] 58 tests across `jwt.test.ts` and `auth-paths.test.ts`
- [x] Matcher drift guard, **proven to fail on drift** rather than assumed: temporarily changing
      `/account` to `/billing` in `middleware.ts` failed the test; restoring it passed
- [x] Updated `.claude/rules/{data-access,security}.md`, `docs/reference/routes-and-proxy.md`,
      `docs/how-to/security/run-a-security-audit.md`

**One audit finding withdrawn.** Section 4.1 listed "`login/route.ts` calls the backend directly,
bypassing the proxy" as a defect. It is not. The proxy exists so the _browser_ never reaches the
backend; `login/route.ts` is already server-side, so calling the backend is exactly what the proxy
itself does. Routing it through would make the server issue an HTTP request to itself — an extra
hop and an absolute URL to resolve, for no security gain.

**Deferred to 5b.** `config.matcher` must be a static literal — Next.js fails the build with
"matcher needs to be a static string or array of static strings" if it is derived. The list is
therefore duplicated, with a test enforcing that it matches `PROTECTED_APP_MATCHERS`.

### 5b — the five missing flows (needs a running backend)

- [x] `/auth/refresh` — retry-once on 401 inside the proxy. **Verified end to end against a
      live backend**, not just unit-tested: an expired access token now returns 200 where it
      previously returned 401, and `proxy.refreshed` appears in the log stream.
- [x] **Found: the access token lives 15 minutes** while the session cookie had a 7-day
      `maxAge`. The app broke a quarter of an hour after login — silent 401s before Phase 5a,
      a bounce to `/login` after. Refresh was load-bearing, not optional.
- [x] **Fixed a pre-existing bug in `/api/auth/login`**: it read `token` and `user` from the
      top level of the response, but the backend wraps everything in `{status, message, data}`.
      Both were always `undefined`, so the cookie was set to the string "undefined". Phase 5a's
      token validation turned that silent failure into a visible 502, which is how it surfaced.
- [x] **Fixed a bug of my own, caught only by the live test**: the refresh cookie was first
      scoped to `/api/auth`, but the proxy that redeems it is at `/api/proxy`, so the browser
      never sent it. Re-scoped to `/api`. Unit tests would not have caught this.
- [x] Backend rotation verified: consecutive refreshes work, so the rotated cookie is being
      persisted; replaying a spent one is rejected by the backend as designed.
- [x] Proxy strips upstream `Set-Cookie` — the backend scopes its refresh cookie to
      `Path=/api/v1/auth/refresh`, which is dead on this origin.
- [ ] `/verify-email` plus a resend affordance
- [ ] `/verify-email` plus a resend affordance
- [ ] `/forgot-password` and `/reset-password`
- [ ] Manual pass through all five against a live backend. `docs/reference/environments.md`
      records the staging backend as down since 2026-08-22, so this needs a local backend on
      `:8001`.

## Phase 6 — Multi-tenancy UI (**ADR-004: never partially**)

- [ ] Kit: `docs/internal/initiatives/multi-tenancy-ui/`
- [ ] Read `docs/internal/incidents/` first — cache-key assumptions have bitten this repo before
- [ ] `src/features/organizations/` — switcher, members, invites, roles
- [ ] `/invites/accept` route; `/auth/switch-org` wiring
- [ ] **Org dimension into all six `src/features/*/keys.ts` in one change**
- [ ] One integration test per feature asserting the key changes with the active org
- [ ] Manual two-org cross-check: org A never sees org B's cached data

## Phase 7 — Testing, gates, CI/CD, deploy (gates done; deploy deferred)

### Vacuous gates (done)

- [x] Global coverage thresholds ratcheted from 3/2/3/3 to **29/29/26/29**, just below measured
      coverage (statements 29.56, branches 30.21, functions 26.97, lines 29.61). **Proven to
      fail**: temporarily set to 95% the run exited 1 with "coverage threshold for statements
      (95%) not met: 29.56%"; restoring passed.
- [x] `coverage-goals.json` ratcheted from 1-5% to 15-80%, at real measured levels
- [x] **Removed the phantom `src/components/pages` goal.** That directory does not exist, so
      `coverage:check` reported 0.00% against a 1% goal and could never pass — which is why
      nothing ran it.
- [x] `coverage:check` now defaults to `--strict` and is wired into CI's unit job, reusing the
      coverage output the preceding step already produces
- [x] Removed the `check-accessibility` stub (`npm install axe-core && echo`). **Not replaced:**
      all 16 integration suites already carry `toHaveNoViolations`, so a dedicated script would
      be an exact alias for `test:integration`, which gates CI. Replacing a fake gate with an
      alias would be no more honest.

### The MSW finding was wrong (corrected, not fixed)

The audit, `CLAUDE.md` and `.claude/rules/testing.md` all claimed integration tests "mock feature
hooks at the module level" because `handlers.ts` is empty. **Verified false on 2026-08-27:**

- 11 of 16 suites call `server.use()` with real MSW HTTP mocking
- the other 5 are layout components that make no network calls
- **zero** suites mock a feature hook at module level

The empty global array is correct design, and stricter than a shared handler list: with
`onUnhandledRequest: "error"`, every suite must declare exactly what it expects. Proven by probe
— an undeclared `fetch` produces "[MSW] Error: intercepted a request without a matching request
handler".

Corrected in `handlers.ts`, `CLAUDE.md` and `.claude/rules/testing.md` rather than "fixed".
Adding global handlers would have **weakened** the harness.

### Deferred

- [ ] Expand Cypress past its single spec — belongs with Phase 5b's auth flows, which need a
      running backend
- [ ] `gitleaks-action` v1.6.0 -> v2, SHA-pinned
- [ ] Deploy config and a gated `deploy_production` job — needs a hosting decision
- [ ] Reconcile `CODECOV_TOKEN`, documented but absent from both workflows

## Phase 8 — Re-audit + closeout

- [ ] New dated `audit-YYYY-MM-DD.md`; diff the scorecard against the baseline
- [ ] Update `SAAS-BASE-CHECKLIST.md` verdict
- [ ] `FINAL-AUDIT-SUMMARY.md`
- [ ] Promote stabilised kit ADRs into `docs/explanation/decisions/` from `adr-0015`

## Status

_Phase 0 complete 2026-08-24. Appended per `.claude/rules/workflow.md` as later phases land._
