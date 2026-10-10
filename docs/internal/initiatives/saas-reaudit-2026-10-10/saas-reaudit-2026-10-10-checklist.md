# SaaS re-audit, 2026-10-10 — Checklist

Grades `dev` at `90bc252` (#80). No file under `src/` changes in this kit. A defect that needs a
code change is recorded as a finding and filed as a todo.

## Phase 0 — Setup

- [x] Branch `docs/saas-reaudit-2026-10-10` off `dev` at `90bc252`, no upstream
- [x] `README.md`, this checklist, `decisions.md` with D-01 (method), D-02 (ADR-001 as written)
      and D-03 (who grades what)
- [x] Node 24.21.0 from the session scratchpad; the tarball's SHA-256 re-checked against
      `SHASUMS256.txt`
- [x] Scratch worktree at `90bc252` with its own `node_modules` from `npm ci` (not a symlink)
- [x] The backend commit inside the local container recorded, with the image's build time

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
- [x] `npm run test:e2e:csp`
- [x] `npm run test:e2e:stack` — only if backend `:8001` and Mailpit `:8025` answer; otherwise
      recorded as skipped
- [x] `npm run test:e2e:csp:stack` — the same condition
- [x] `npm run security:audit:full` — recorded outside the verdict; red is expected (braces,
      `docs/internal/todos/2026-10-03-todo-braces-dev-advisory.md`)

## Phase 2 — Vacuity checks (ADR-003 of the audit kit)

Each gate added or tightened since 2026-10-04 is made to fail once for the reason it exists, in the
scratch worktree, then restored. A gate that cannot be made to fail is a finding.

- [x] `src/__tests__/commands-doc.test.ts` (N9) — a script removed from
      `docs/reference/commands.md` fails it
- [x] `src/lib/__tests__/auth-paths.test.ts` (N10) — an entry in `PUBLIC_API_PATHS` that the
      contract secures fails it
- [x] Jest global thresholds after the 2026-10-07 ratchet (N5) — one raised above measured fails
- [x] `react/no-danger` (ADR-0028) — a `dangerouslySetInnerHTML` fails lint
- [x] `test:e2e:csp` (ADR-0026) — an inline script without the nonce fails the suite
- [x] The proxy's path containment tests (N1) — fail with the containment check removed
- [x] The telemetry body cap tests (N6) — fail with the cap removed
- [x] The logger scrubbing tests (N7) — fail with the scrub removed
- [x] `src/__tests__/proxy.test.ts` — fails with the policy header removed from the response.
      `src/lib/__tests__/csp.test.ts` — not broken; it failed on its own under an exported
      variable, which is N13

## Phase 3 — Live probes

Against `next start` on the production build, backend on `:8001`. The 2026-10-04 table again, row
for row, plus the rows the fixes since then call for.

- [x] Edge gate: no cookie, and a malformed cookie
- [x] Proxy: `GET /api/proxy/metrics` and `GET /api/proxy/analytics/summary` with no cookie
- [x] N1: `GET /api/proxy/..%2f..%2fhealth` and two other encodings of the same escape
- [x] N3: `POST /api/auth/session` (route deleted in #73), and the sign-in response body and
      `Set-Cookie` as the browser receives them
- [x] N4: response headers on `/login` and on a signed-in page
- [x] N6: a telemetry body over the cap, to each of the three endpoints
- [x] N7: a Server Component that throws with an email address in its message (temporary page,
      scratch worktree only), and the stdout line it produces

## Phase 4 — Fork test

- [x] `git clone` of the tree at `90bc252`, `./scripts/bootstrap-fork.sh --name acme-app`, twice
- [x] On the fork: `lint`, `typecheck`, `format`, `test:unit`, `test:integration`, `build`,
      `api:types:check`, `api:spec:check`
- [x] Brand left in tracked files, listed

## Phase 5 — Regrade

- [x] The 79 items sorted into regraded, carried and independent, by the rule in D-01 and D-03;
      the sorting recorded before any grade is given
- [x] Regraded items, each Pass, Partial or Missing with `file:line` evidence from this run
- [x] Carried items, each citation re-opened
- [x] Independent items: "End-to-end coverage" and the four Accessibility items, graded by one
      `code-reviewer` subagent under D-03
- [x] N1 to N11, each Closed, Reduced or Open
- [x] C4 and C6, and the seven "smaller items" from `audit-2026-08-29.md` section 7
- [x] README supplementary scans re-run
- [x] Known open items cited, not rediscovered: client-IP forwarding, unvalidated request id,
      upstream error bodies, braces, the four open Notion Part 1 records and two Part 2 records
- [x] Findings from the work since 2026-10-04, entered as findings: a second log in the same
      minute is refused with a generic message; the dashboard invalidation has no browser
      evidence; the time picker observation, marked unreproduced
- [x] Every grading call that is a judgement gets a `D-NN` entry when it is made

## Phase 6 — Write up

- [x] `docs/internal/audits/saas-readiness/audit-2026-10-10.md` — new file, same section order as
      the last run
- [x] `SAAS-BASE-CHECKLIST.md` — verdict, scorecard, gates, open items
- [x] `docs/internal/audits/saas-readiness/README.md` — file list
- [x] `docs/internal/audits/saas-readiness/iteration-plan.md` — Audit history entry
- [x] `docs/internal/audits/saas-readiness/FINAL-AUDIT-SUMMARY.md` — this run added
- [x] `docs/internal/todos/` — one todo per new finding that needs code
- [x] `README.md` in this kit — status and the deliverable link
- [x] `decisions.md` — D-01 to D-03 and any later entry set to Accepted

## Discovered

- [x] Found: the unit gate exits 1 when `NEXT_PUBLIC_API_BASE_URL` is exported in the shell, as
      this run first had it (N13) → out of scope, filed in
      `docs/internal/todos/2026-10-10-todo-reaudit-findings.md`. The gate is recorded as CI runs it
- [x] Found: Next prints a Server Component's error to stdout unscrubbed (what is left of N7) →
      out of scope, same todo
- [x] Found: four forms print the transport error, not the server's message (N12) → out of scope,
      same todo; a grading call, D-07
- [x] Found: the development-only audit reports six advisories, one critical (N14) → out of scope,
      same todo
- [x] Found: the independent grader lowered two Accessibility items that had been carried at Pass
      → in scope as a grading call, D-06
- [x] Found: three statements that no longer hold (N16) → out of scope, same todo
- [x] Found: the fork's `format` gate is red until the step the script prints is run → in scope as
      a grading call, D-04
- [x] Found: the item "Session route validates the token" names a route that #73 deleted → in
      scope as a grading call, D-05
- [x] Found: nothing on the backend answers 200 outside `/api/v1`, and its log does not print the
      path, so the double-encoded escape could not be judged from the response alone → in scope:
      judged from `src/lib/auth-paths.ts:125-146`, which re-encodes every segment

## Acceptance

- [x] A-1 — `audit-2026-10-10.md` exists and states a verdict against each of ADR-001's four
      criteria. _Method:_ read back.
- [x] A-2 — The scorecard's category rows sum to 79 and its totals equal the per-item table, the
      verdict text and the root checklist. _Method:_ arithmetic by script from the per-item grades.
- [x] A-3 — Every non-Pass item, and every item whose grade moved since 2026-10-04, cites
      `file:line` or "no file found". _Method:_ each citation re-opened once before handover.
- [x] A-4 — Every gate in Phase 1 appears in the audit by name with its exit code and Node
      version; a skipped one is named as skipped. _Method:_ compared against the captured logs.
- [x] A-5 — Every Phase 2 check records the failure it produced, or records that the gate could
      not be made to fail, which is then a finding. _Method:_ captured output.
- [x] A-6 — N1 to N11, C4 and C6 each carry a status whose evidence was gathered in this run, not
      taken from a kit README or a pull request body. _Method:_ each traced to a Phase 1 to 5
      result.
- [x] A-7 — `audit-2026-08-24.md`, `audit-2026-08-29.md` and `audit-2026-10-04.md` are
      byte-identical to `dev`, and nothing under `src/` changed. _Method:_ `git diff --stat dev`.
- [x] A-8 — Each of the 79 items states how it was graded, and the five independent items name
      the subagent as grader. _Method:_ the method column counted by script.

## Gates

For the branch itself, which changes documentation only. Ticked when run; see the handover.

- [x] lint — on the branch
- [x] css lint — at `90bc252` in Phase 1; no style file changes on the branch
- [x] typecheck — on the branch
- [x] format — on the branch. The gate that matters here; Prettier checks Markdown
- [x] unit tests — at `90bc252` in Phase 1; `git diff --stat dev -- src` empty
- [x] integration — at `90bc252` in Phase 1
- [x] spec drift — `api:spec:check` re-run immediately before handover
- [x] `security:audit` — re-run immediately before handover
- [x] build — at `90bc252` in Phase 1
- [x] e2e, e2e (csp), e2e (stack), e2e (csp, stack) — at `90bc252` in Phase 1
