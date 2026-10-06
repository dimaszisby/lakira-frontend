# A nonce for script in the Content Security Policy — Checklist

## Phase 0 — Kit and baseline

- [x] `README.md`, `csp-script-nonce-plan.md`, this file, `decisions.md` with D-01
- [x] `docs/explanation/decisions/adr-0026-script-runs-by-nonce.md`, `Proposed`
- [x] Baseline on `dev`: Lighthouse on `/`, `/login`, `/register`; time to first byte on `/`,
      `/login`, `/forgot-password`

## Phase 1 — Policy and proxy

- [x] `src/lib/__tests__/csp.test.ts`, `src/__tests__/proxy.test.ts` — written first, watched failing
- [x] `src/lib/csp.ts` — `buildContentSecurityPolicy`, `createNonce`
- [x] `src/proxy.ts` — nonce and headers on every pass-through; matcher widened
- [x] `src/lib/auth-paths.ts`, `src/lib/__tests__/auth-paths.test.ts` — matcher coverage test
- [x] `next.config.ts` — static CSP only for `/api` and `/_next`, without `'unsafe-inline'`

## Phase 2 — Theme script

- [x] `src/app/layout.tsx`, `src/app/providers.tsx` — nonce passed to `ThemeProvider`

## Phase 3 — Mechanism

- [x] `cypress/e2e/csp/public-pages.cy.ts`
- [x] `package.json` — `test:e2e:csp`
- [x] `.github/workflows/test.yml` — step in the `e2e` job
- [x] `docs/reference/commands.md`, `.claude/rules/workflow.md` gate table

## Phase 4 — Docs, after review

- [x] ADR-0026 `Accepted`; registry row; banner on D-01
- [x] `.claude/rules/security.md` § CSP and § Auth and session (the matcher sentence)
- [x] `docs/tutorials/getting-started.md` if it describes the policy
- [x] `SECURITY.md` — N4 removed
- [x] `SAAS-BASE-CHECKLIST.md` — N4 marked fixed, pending a dated run
- [x] `docs/internal/todos/2026-10-04-todo-reaudit-p2-findings.md` — N4 box
- [x] `README.md` in this kit — status

## Loose ends from #73, own commit

- [x] `docs/internal/initiatives/server-set-session-cookie/README.md` — merged in #73 (`e577731`)
- [x] `.claude/agent-memory/code-reviewer/project_server-set-session-cookie_review.md` — points at
      #73
- [x] `CLAUDE.md` — the ADR line carries no count

## Discovered

- [x] Found: with `experimentalCspAllowList: true` Cypress still strips `script-src`, so the first
      run of the new spec enforced nothing → in scope, D-04; the config names the directives
- [x] Found: a script element built by running script is allowed under `'strict-dynamic'` → in
      scope as a recorded limit, D-05; the spec tests the forms that are blocked
- [x] Found: the ordinary stack suite cannot run with the policy enforced, because cypress-axe
      injects itself with `eval` → in scope, `cypress/e2e/csp-stack/app-pages.cy.ts` and
      `npm run test:e2e:csp:stack`, local only
- [x] Found: the matcher skipped any path merely starting with `api`, leaving it with no policy
      (review) → in scope, D-06
- [x] Found: nothing tied the static policy in `next.config.ts` to the builder (review) → in
      scope, a test in `src/lib/__tests__/csp.test.ts`
- [x] Found: `.claude/rules/testing.md`, `.claude/skills/pre-push/SKILL.md` and
      `docs/how-to/testing/run-the-test-suites.md` also list the e2e commands → in scope, updated
- [x] Found: `docs/tutorials/getting-started.md` does not describe the script policy → nothing to
      change there
- [x] Found: the browser test is not known to catch a mistake in `style-src`, `connect-src` or
      `img-src` (review) → out of scope, recorded in ADR-0026

## Acceptance

- [x] AC-1 — unit · `proxy.test.ts`, `csp.test.ts` · and **live** `curl`
- [x] AC-2 — unit · `proxy.test.ts` · and **live** `curl`
- [x] AC-3 — **live** · script elements counted in the served HTML
- [x] AC-4 — **live** · header count on a page, an API route and a static asset
- [x] AC-5 — unit · `proxy.test.ts`, `auth-paths.test.ts` · and **live** `curl` on each section
- [x] AC-6 — Cypress, header enforced · `cypress/e2e/csp/public-pages.cy.ts`
- [x] AC-7 — Cypress, header enforced, local stack · recorded below
- [x] AC-8 — unit · `csp.test.ts` · and the dev server started once
- [x] AC-9 — Cypress, header enforced · `cypress/e2e/csp/public-pages.cy.ts`

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — with `coverage:check`
- [x] integration
- [x] spec drift — `api:spec:check` immediately before handover
- [x] `security:audit` — immediately before handover
- [x] build
- [x] e2e
- [x] e2e (csp) — new in this kit
- [x] e2e (stack)

## Evidence

Node 24.21.0. Production build, backend on `:8001`, Mailpit on `:8025`, 2026-10-05.

- **AC-1, AC-2** — `curl /login` twice: `script-src 'self' 'nonce-…' 'strict-dynamic'`, two
  different nonces, no `'unsafe-inline'`.
- **AC-3** — `/login` 19 script elements, 19 with the response's nonce. `/` 15 of 15,
  `/forgot-password` 19 of 19, a 404 page 15 of 15.
- **AC-4** — one policy header each on `/login`, `/`, `/forgot-password`, a 404, `/apiary`,
  `/api-docs`, `/_next/staticfoo`, `/api/proxy/metrics`, `/api`, a static chunk, `/file.svg` and
  `/robots.txt`. The API responses carry `script-src 'self'`, no nonce.
- **AC-5** — without a cookie, `/dashboard`, `/metrics`, `/metric-categories`, `/account` and
  `/organization` each answer 307 to `/login?returnUrl=…`; a malformed cookie goes to
  `/api/auth/revive`. A request sending its own `x-nonce` and `Content-Security-Policy` headers
  got a page with none of its values in it.
- **AC-6, AC-9** — `npm run test:e2e:csp`: 7 of 7. Run without `E2E_ENFORCE_CSP`, the same spec
  fails 2 of 7, so it does not pass when nothing is enforced.
- **AC-7** — `npm run test:e2e:csp:stack`: 7 of 7, all five signed-in pages and one client-side
  navigation, no violation.
- **AC-8** — `next dev` on a spare port: `script-src 'self' 'nonce-…' 'strict-dynamic'
'unsafe-eval'`. The production header has no `'unsafe-eval'`.
- **Server log after all four suites** — two `csp.violation` lines, both the injection test's own:
  one `script-src-attr`, one `script-src-elem`.
- **Mutations, each caught:** the theme nonce removed (the CSP suite fails 6 of 7, after a
  rebuild); exclusions without a segment boundary (5 unit tests fail); the matcher literal narrowed
  in `src/proxy.ts` (1); the static policy edited alone (1); the static policy sent on every path
  (1); the gate bypassed (4); the policy set on the response only (4).
- **Rendering** — the route table lists `/forgot-password` and `/_not-found` as dynamic; before,
  both were static. Nothing else changed mode.
- **Performance** — Lighthouse 12.8.2, median of 3, before then after: `/` 94 then 95, `/login`
  90 then 92, `/register` 91 then 92; accessibility and best practices 100 throughout. Time to
  first byte on `/forgot-password` 3 ms then 9 ms on this machine. Client JS 2,171,239 bytes of a
  3,000,000 budget.
- **Review** — `code-reviewer` agent, narrow brief. Session gate: no finding, including prefetch
  requests. Policy: no finding beyond D-06. Its findings are the fourth and fifth Discovered items.
