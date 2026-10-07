# The remaining P2 findings from the 2026-10-04 re-audit — Checklist

This file was written after the code, not before it, which is the wrong order: the README linked
it from the start and review found the link dead. The items below are what was done.

## Phase 0 — the dashboard invalidator

- [x] `src/features/data-visualizations/cache.ts` — `invalidateDashboardVisualizations`, matching
      the prefix `["viz", organizationId, "dashboard"]`
- [x] `src/features/metric-logs/hooks/` — create, create-dummy, update and delete call it
- [x] `src/features/metrics/hooks/` — create, create-dummy, update and delete call it
- [x] `src/features/metric-settings/hooks/` — create, update, update-display, update-goal and
      delete call it
- [x] `src/features/metric-categories/hooks/` — update and delete call it

## Phase 1 — the audit findings

- [x] N5: `jest.config.ts` thresholds at 42/43/37/41; `CLAUDE.md` and `.claude/rules/testing.md`
      quote the same figures
- [x] N8: `dompurify` gone from `package.json`; `react/no-danger` an error in
      `eslint.config.mjs`; `.claude/rules/security.md` and `forms-and-validation.md` reworded
- [x] N9: `src/__tests__/commands-doc.test.ts`; `docs/reference/commands.md` and
      `.claude/rules/commands.md` name it
- [x] N10: `src/lib/__tests__/auth-paths.test.ts` — `PUBLIC_API_PATHS matches the contract`
- [x] N11: `src/lib/monitoring/scrub.ts`, `docs/reference/ci-pipeline/backend-handoff.md`,
      `SECURITY.md`

## Discovered

- [x] Found: two of the audit's five N11 statements were already corrected
      (`src/lib/auth-paths.ts`, `scripts/bootstrap-fork.sh`), and #75 left `SECURITY.md` saying
      the telemetry endpoints have no limit → in scope, Phase 1
- [x] Found in review: the first version invalidated the dashboard from seven mutations and
      missed eight that also write its payload, the metric-settings ones among them → in scope,
      D-04
- [x] Found in review: the contract test for public paths compared paths only, so a path with an
      open POST and a secured GET would pass; and an empty requirement object was read as secured
      → in scope. The walk is keyed by method and path, and a third test asserts no public path
      has a secured method
- [x] Found in review: the commands test counted any mention of a script name, so a deleted
      table row passed wherever the name was also used in a sentence → in scope. Only the first
      cell of a table row counts
- [x] Found in review: the decisions log said the rule files "now say" things the diff had not
      yet changed, and the lint comment cited an ADR that did not exist → in scope; both written
      in the docs step
- [x] Found: the re-audit todo asked for thresholds "just under measured (37/42/32/36)". The
      sweep's own tests moved the measurement twice, so the thresholds were set last
- [ ] Found in review: `.claude/rules/architecture.md` says cross-feature imports go through
      `src/features/shared/` only. `metric-logs` already imported another feature's `cache.ts`,
      every feature imports the `organizations` context, and lint cannot see it because
      `features` is one boundary element. This sweep adds three more such imports → out of scope.
      Either the rule or the code has to change, and that is a decision about the layer rule, not
      a P2 finding
- [ ] Found in review: the new call is awaited, so a mutation's callback waits for the dashboard
      refetch when a dashboard query is mounted → out of scope. No page mounts both today (D-04)
- [ ] Found: no browser test logs a value and then opens the dashboard, so the fix is verified
      at the level of the query being marked stale, not on screen → out of scope. It is the
      audit's open P1 on end-to-end coverage

## Acceptance

A small sweep has no plan, so the criteria are stated here.

- [x] **AC-1** — Every mutation that writes a field of the dashboard payload marks the dashboard
      query stale for its own organization and no other. _Method:_ unit test per call site, four
      `hooks/__tests__/dashboard-invalidation.test.tsx` files
- [x] **AC-2** — The invalidator matches every dashboard key of the organization whatever its
      range or limit, and no per-metric chart. _Method:_ unit test ·
      `src/features/data-visualizations/__tests__/cache.test.ts`
- [x] **AC-3** — The unit gate fails if global coverage falls more than two points from today's
      on any axis. _Method:_ `npm run test:unit:ci` with the new thresholds
- [x] **AC-4** — `dangerouslySetInnerHTML` fails lint. _Method:_ a probe component, linted and
      deleted; evidence below
- [x] **AC-5** — A script missing from `commands.md`, or a script the doc names that does not
      exist, fails the unit gate. _Method:_ unit test · `src/__tests__/commands-doc.test.ts`
- [x] **AC-6** — `PUBLIC_API_PATHS` differing from the contract's unsecured operations, in either
      direction, fails the unit gate. _Method:_ unit test · `src/lib/__tests__/auth-paths.test.ts`
- [x] **AC-7** — No rule file, comment or reference page names `sendDefaultPii` as a live setting,
      an active staging backend, or DOMPurify as installed. _Method:_ I read each; `grep` for the
      three terms outside audits, archive and dated records
- [x] **AC-8** — `npm run security:audit` reports no advisory. _Method:_ the gate

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests — 942, with `coverage:check`
- [x] integration — 125
- [x] spec drift — `api:spec:check` and `api:types:check`, immediately before handover
- [x] `security:audit` — immediately before handover
- [x] build
- [x] e2e — 18
- [x] e2e (csp) — 7
- [x] e2e (stack) — 13
- e2e (csp, stack) — not run: no policy, proxy or layout change

## Evidence

Node 24.21.0. Production build on `127.0.0.1:3000`, backend on `:8001`, Mailpit on `:8025`,
2026-10-07. Every gate was run again after the review fixes; the figures are from that run.

- **AC-3** — measured 43.54 / 44.32 / 38.01 / 42.55 (statements, branches, functions, lines);
  thresholds 42 / 43 / 37 / 41. Before the sweep: 39.21 / 42.78 / 33.18 / 38.24 against
  29 / 29 / 26 / 29.
- **AC-4** — a component with `dangerouslySetInnerHTML`:
  `error  Dangerous property 'dangerouslySetInnerHTML' found  react/no-danger`. The whole repo
  lints clean with the rule on.
- **AC-6** — the snapshot has no top-level `security`; exactly seven operations, all `POST`
  under `/auth/`, declare none.
- **AC-8** — `sharp` 0.35.4 to 0.35.5 with its 26 platform packages; `dompurify` removed;
  `found 0 vulnerabilities` at 14:39 UTC.
- **Mutations, each caught** (22, one at a time, the file compared and restored after each): the
  invalidator's prefix wrong (9 tests fail); the organization ignored (8); the whole
  visualization root invalidated (1); the call dropped from each of the fifteen mutations in turn
  (1 each); a secured path added to `PUBLIC_API_PATHS` (3); a public path removed (2); a script's
  table row lost while its name stayed in prose (1); a script the doc invents (1). The last
  four were also run against the first version of the two contract tests, before review tightened
  them.
- **Review** — `code-reviewer` agent, narrow brief, verdict request changes. No finding on the
  key prefix, on a rejected refetch failing a mutation, or on `react/no-danger` scoping. Its
  findings are the second to fifth, seventh and eighth Discovered items.
