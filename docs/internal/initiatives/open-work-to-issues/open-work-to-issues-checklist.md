# Open work to issues — Checklist

Register row F-77. Plan: [`open-work-to-issues-plan.md`](open-work-to-issues-plan.md). Decisions:
[D-01 to D-03](decisions.md),
[ADR-0044](../../../explanation/decisions/adr-0044-every-task-starts-from-an-issue.md).

## Phase 0 — issues, records, rules

- [x] `src/__tests__/open-work-records.test.ts` replaces `register-todos.test.ts`; three of its six
      cases failed before the records changed
- [x] Decision issues #155 to #159 (O-01, O-03, O-05, O-09, O-10), created after the owner
      confirmed the dry run
- [x] Task issues #160 to #179, in register order, created after the owner confirmed the dry run;
      eight name their decision issue as "Blocked by"
- [x] `register.md`: the frozen banner and "Where each row went"; F-77 moved to
      `register-closed.md` with #180; the register README's status
- [x] Ten open todos: an `**Issue:**` or `**Issues:**` line at the top of their Status section
- [x] `docs/reference/known-gaps.md` with F-22 and F-23, linked from `docs/README.md` and
      `issue-tracker.md`
- [x] `.claude/rules/workflow.md`: task flow, the issue number as the spine, "Small work is an
      issue", "What's next" from the issues, `Closes #N` in the PR message
- [x] `.claude/rules/documentation.md`: kit sizing under two days is an issue; the placement row
      for work to do, kept identical in `.claude/agents/doc-writer.md`; `docs/README.md` follows
- [x] `CLAUDE.md`: task ids are issue numbers; the documentation map points at the issues
- [x] `docs/reference/issue-tracker.md`: the ranking rule and the query
- [x] ADR-0044 and its registry row; this kit under Done in the initiatives index

## Discovered

- [x] Found: the issue listing lags a just-created issue, so the runner's number check stopped after
      #155 → in scope: it waits for the listing to catch up, and the numbers were verified as they
      landed

## Acceptance

- [x] AC-1 — **a machine checked it**: the read-back of `gh issue list` against the manifest, 25
      issues, 0 mismatches in title, labels or body
- [x] AC-2 — **a machine checked it**: `open-work-records.test.ts`, "says where every row of
      register.md went" and "maps each row to an issue"
- [x] AC-3 — **a machine checked it**: `open-work-records.test.ts`, "names the issue that carries
      each open todo" and "refuses a todo dated after the freeze"
- [x] AC-4 — **I checked it**: `.claude/rules/workflow.md` § What's next and § Task flow
- [x] AC-5 — **I checked it**: `.claude/rules/documentation.md` § Kit sizing
- [x] AC-6 — **I checked it**: `docs/reference/known-gaps.md`

## Gates

- [x] lint
- [x] typecheck
- [x] format
- [x] unit tests
- [x] spec drift and `security:audit`
- [x] build
- [ ] css lint, integration, e2e, e2e (csp), e2e (stack) and e2e (csp, stack): skipped, no
      application code, style or flow changed
