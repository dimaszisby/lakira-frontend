# Frontend debt register — Checklist

## Phase 0 — kit and rule

- [x] `docs/frontend-debt-register` cut from `dev` at `f67716e`; HEAD and no upstream verified in
      the same call
- [x] `README.md`, `frontend-debt-register-plan.md`, this file
- [x] `decisions.md` D-01, the ranking rule, written before any row was ranked

## Phase 1 — the register

- [x] `register.md` — 43 rows (`F-01` to `F-43`), ten owner questions (`O-01` to `O-10`), a note
      of what was settled just before it
- [x] Every todo file with an open item has a row: 16 files. Seven more have no checkboxes or
      read as open and were read by hand; two of them yield rows (`todo-security-20251126.md`,
      two of its four "next cycle" items; `2026-09-15-todo-phosphor-icons-migration.md`, its "Not
      done" note) and five are closed
- [x] Every item of `audit-2026-10-10.md` § 3.1 not at Pass, and every line of its § 7, has a row
      or was closed by #82 to #88
- [x] Every live record of the Notion page has a row: four in Part 1, two in Part 2
- [x] Each of the seven backend rows that meet this side is named in a row: B-02, B-03, B-04,
      B-05, B-13, B-14, B-15
- [x] `decisions.md` D-02 (grouping) and D-03 (what is not analysed)

## Phase 2 — the analyses

- [x] `analysis-c4-deploy-configuration.md` — F-01
- [x] `analysis-decisions-owed-between-repos.md` — F-02, F-10, F-11, F-16
- [x] `analysis-client-ip-through-proxy.md` — F-03
- [x] `analysis-stack-suites-in-ci.md` — F-06
- [x] `analysis-route-group-error-boundaries.md` — F-08
- [x] `analysis-c6-quarantined-layout-files.md` — F-09
- [x] `analysis-field-vitals.md` — F-12
- [x] `analysis-x-request-id.md` — F-14, with F-17

## Phase 3 — the rule

- [x] `.claude/rules/workflow.md` § What's next
- [x] `CLAUDE.md` § Documentation map — a pointer to the register

## Discovered

- [x] Found: the backend repository is public now, so one of the three costs that
      `cypress-a11y-e2e` D-01 gave for deferring the stack suites in CI no longer holds → in scope
      of F-06's analysis, § 3; raised as O-02
- [x] Found: the proxy writes the response's `x-request-id` on its own log line, so a browser's
      text reaches this project's logs too → in scope of F-14's analysis, § 1
- [x] Found: `Header.tsx` is rendered only by the `(auth)` layout and may need no user state at
      all → in scope of F-09's analysis, § 4, with what would have to be confirmed first
- [x] Found: twenty-seven of 43 rows carry no P-level → named in the plan's risks and D-03, with
      F-32 put forward for grading first
- [x] Found: the handover from the backend counted about 56 open todo files; 16 hold an open
      item. The count there was by status line, which this repo's todos mostly do not have →
      counted by open checkbox, then the files without checkboxes read by hand
- [x] Found: two "next cycle" items of `todo-security-20251126.md` are done and unmarked (lint
      violations cleared; `.github/dependabot.yml` exists) → no row; out of scope to edit the todo
- [x] Not done: no reproduction was run for this kit. Every reproduction cited is from the audit
      of 2026-10-10, from #82 to #88, or from the Notion records, and each analysis says which

## Acceptance

- [x] AC-1 — a loop over `docs/internal/todos/` found every file with an open checkbox named in
      `register.md`, none missing; the audit, Notion and backend rows were matched by hand, as
      listed under Phase 1
- [x] AC-2 — rows are one line with a source; no todo body is restated
- [x] AC-3 — D-01 was the first file written on the branch; the places the order needs explaining
      are in the register (the P1 inside tier 4, F-14's two states)
- [x] AC-4 — seven analyses have all eight sections; the eighth, on decisions owed, is a note per
      item, as the backend's is. 23 full `path:line` references were checked by script (file
      exists, line within the file); the 21 bare ones were read against the code by hand
- [x] AC-5 — each analysis ends with "Not verified"
- [x] AC-6 — `.claude/rules/workflow.md` § What's next; `CLAUDE.md` § Documentation map
- [x] AC-7 — `git status` shows only `docs/`, `.claude/rules/workflow.md` and `CLAUDE.md`

## Gates

- [x] lint
- [ ] css lint — not run: no style changed
- [ ] typecheck — not run: no source file changed
- [x] format
- [x] unit tests — one suite reads `docs/reference/commands.md`
- [ ] integration — not run: no data access or routing changed
- [x] spec drift — `api:spec:check`, run before handover as always
- [ ] build — not run: no source file changed
- [ ] e2e — not run: no user-facing flow changed
