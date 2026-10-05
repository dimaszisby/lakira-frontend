# SaaS re-audit, 2026-10-04 — Checklist

Grades `dev` at `07df6c9` (#69). No file under `src/` changes in this kit. A defect that needs a
code change is recorded as a finding and filed as a todo.

## Phase 0 — Setup

- [x] Branch `docs/saas-reaudit-2026-10-04` off `dev` at `07df6c9`, no upstream
- [x] `README.md`, this checklist, `decisions.md` with D-01 (severity label) and D-02 (method)
- [x] Node 24.21.0 tarball in the session scratchpad, SHA-256 checked against `SHASUMS256.txt`
- [x] Scratch worktree at `07df6c9` with its own `node_modules` from `npm ci` (not a symlink)

## Phase 1 — Gates, with real exit codes

Each recorded with its exit code and `node -v`. Server commands run with `SENTRY_DSN=` so nothing
is reported to Sentry.

- [x] `npm run lint`
- [x] `npm run lint:css`
- [x] `npm run typecheck`
- [x] `npm run format`
- [x] `npm run test:unit:ci`
- [x] `npm run coverage:check`
- [x] `npm run test:integration`
- [x] `npm run build`
- [x] `npm run api:spec:check`
- [x] `npm run api:types:check`
- [x] `npm run security:scan`
- [x] `npm run test:e2e`
- [x] `npm run test:e2e:stack` — only if backend `:8001` and Mailpit `:8025` answer; otherwise
      recorded as skipped
- [x] `npm run security:audit:full` — recorded outside the verdict; red is expected (braces,
      `docs/internal/todos/2026-10-03-todo-braces-dev-advisory.md`)

## Phase 2 — Vacuity checks (ADR-003 of the audit kit)

Each gate added since 2026-08-29 is made to fail once for the reason it exists, in the scratch
worktree, then restored.

- [x] `format` — an unformatted file fails it
- [x] `lint --max-warnings=0` — a warning-level violation fails it
- [x] `coverage:check --strict` — still fails below a goal
- [x] Proxy matcher-sync test — fails when `src/proxy.ts` and the protected-path list diverge
- [x] `src/features/__tests__/key-tenant-scoping.test.ts` — fails when a key drops `organizationId`
- [x] `@sentry/*` import restriction — an import outside `src/instrumentation.ts` and
      `src/lib/monitoring/**` fails lint
- [x] `import-x/no-extraneous-dependencies` — a devDependency imported from runtime `src/` fails lint

## Phase 3 — Regrade

- [x] Categories 1 to 13, all 79 items, each Pass, Partial or Missing with `file:line` evidence
- [x] C1 to C6 from the 2026-08-29 run, each with a status and evidence
- [x] The seven "smaller items" in `audit-2026-08-29.md` section 7, each still true or not
- [x] README supplementary scans re-run, with `middleware.ts` read as `src/proxy.ts`
- [x] Fresh pass over what the last run could not have seen: `src/lib/monitoring/**`,
      `src/instrumentation.ts`, `/api/observability/client-error`, the proxy's 502 path, the org
      switcher, the dependency-audit split
- [x] Known open items cited, not rediscovered: client-IP forwarding, unvalidated request id,
      braces, the Server Component digest path that was never checked live
- [x] Every grading call that is a judgement gets a `D-NN` entry when it is made

## Phase 4 — Write up

- [x] `docs/internal/audits/saas-readiness/audit-2026-10-04.md` — new file
- [x] `SAAS-BASE-CHECKLIST.md` — verdict, scorecard, gates, caveats, Node pin
- [x] `docs/internal/audits/saas-readiness/README.md` — file list, gate count, the two scans
- [x] `docs/internal/audits/saas-readiness/iteration-plan.md` — Audit history entry; the "closes
      the section 4.5 P0" sentence corrected per D-01
- [x] `docs/internal/audits/saas-readiness/FINAL-AUDIT-SUMMARY.md` — this run added
- [x] `docs/internal/todos/2026-08-24-todo-saas-readiness.md` — Status note
- [x] `README.md` in this kit — status and the deliverable link

## Phase 5 — Loose ends, each its own commit

- [x] `SECURITY.md` — every entry in the known-items list checked against the code; the ones
      that no longer hold removed or reworded. Closes
      `docs/internal/todos/2026-10-04-todo-security-md-stale-known-items.md`
- [x] `docs/internal/initiatives/sentry-error-monitoring/README.md` — Status says merged in #69
      (`07df6c9`)

## Discovered

- [x] Found: the API proxy forwards outside its API base (N1) → out of scope, filed as
      `docs/internal/todos/2026-10-04-todo-proxy-path-escapes-api-base.md`
- [x] Found: a bootstrapped fork fails `format` (N2) → out of scope, filed as
      `docs/internal/todos/2026-10-04-todo-fork-fails-format-gate.md`
- [x] Found: the access token passes through browser JavaScript at sign-in (N3) → out of scope,
      filed as `docs/internal/todos/2026-10-04-todo-token-reaches-browser-javascript.md`
- [x] Found: eight P2 findings (N4 to N11) → out of scope, filed as
      `docs/internal/todos/2026-10-04-todo-reaudit-p2-findings.md`
- [x] Found: two checks not in the approved checklist were worth making → in scope, added to
      Phase 2 and 3: the Jest global threshold (an eighth vacuity check), and a fork test (clone,
      bootstrap twice, eight gates), which is what found N2
- [x] Found: ADR-001 criterion 3 had been passed "with one exception" → in scope as a grading
      call, D-05; the question of amending the gate is left to the owner (audit section 9)

## Acceptance

- [x] A-1 — `audit-2026-10-04.md` exists and states a verdict against each of ADR-001's four
      criteria. _Method:_ read back.
- [x] A-2 — The scorecard's category rows sum to 79 and its totals equal the figures in the
      verdict text and in the root checklist. _Method:_ arithmetic re-done from the per-item grades.
- [x] A-3 — Every non-Pass item, and every item whose grade moved since 2026-08-29, cites
      `file:line` or "no file found". _Method:_ each citation re-opened once before handover.
- [x] A-4 — Every gate in Phase 1 appears in the audit by name with its exit code and Node
      version; a skipped one is named as skipped. _Method:_ compared against the captured logs.
- [x] A-5 — Every Phase 2 check records the failure it produced, or records that the gate could
      not be made to fail, which is then a finding. _Method:_ captured output.
- [x] A-6 — C1 to C6 each carry a status, and the D-01 label question is answered in the audit.
      _Method:_ read back.
- [x] A-7 — `audit-2026-08-24.md` and `audit-2026-08-29.md` are byte-identical to `dev`, and
      nothing under `src/` changed. _Method:_ `git diff --stat dev`.
- [x] A-8 — No entry in `SECURITY.md`'s known-items list describes behaviour the code no longer
      has. _Method:_ each entry checked against the file it names.

## Gates

For the branch itself, which changes documentation only.

- [x] lint — on the branch, exit 0
- [x] css lint — at `07df6c9` in Phase 1; no style file changed since
- [x] typecheck — on the branch, exit 0
- [x] format — on the branch, exit 0. The gate that matters here; Prettier checks Markdown
- [x] unit tests — at `07df6c9` in Phase 1, 755 tests; `git diff --stat dev -- src` is empty
- [x] integration — at `07df6c9` in Phase 1, 127 tests
- [x] spec drift — `api:spec:check` re-run immediately before handover, exit 0
- [x] `security:audit` — re-run immediately before handover, exit 0
- [x] build — at `07df6c9` in Phase 1; not re-run on the branch, which changes Markdown only
- [x] e2e — at `07df6c9` in Phase 1, 18 tests, and the stack suite, 13 tests

All on Node 24.21.0.

## Review

No independent reviewer: subagents were not used (D-02). The audit was checked by script instead:
scorecard rows and the per-item table both sum to 67 / 9 / 3 of 79, every relative link in a
changed file resolves, and every repository path the audit cites exists.
