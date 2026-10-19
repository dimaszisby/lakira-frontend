# 2026-10-19 - Todo: check the register against the todo folder

**Context:** debt register row F-43. `.claude/rules/workflow.md` § What's next says a new todo gets
a register row in the same PR, and nothing enforced it. The definition of an open todo the check
uses is the register's [D-04](../initiatives/frontend-debt-register/decisions.md).

## Checklist

- [x] D-04 in `docs/internal/initiatives/frontend-debt-register/decisions.md`, written before the
      check: a todo is open when a line begins, after any indent, with `- [ ]`, and every open todo
      is named in a row above `## Closed`.
- [x] `src/__tests__/register-todos.test.ts`, in the unit gate, two cases:
  - the todo folder, its open todos and the register's `## Closed` heading are all found, so the
    check cannot pass against nothing;
  - every open todo's filename is in the register above `## Closed`.
- [x] Seen to fail, each mutation restored and checked with `git status`:
  - a probe todo with one indented `- [ ]` fails the second case, naming it;
  - the `## Closed` heading renamed fails both cases.
- [x] `.claude/rules/workflow.md` § What's next: the paragraph saying nothing checks this now names
      the test, and keeps the by-hand read only for what it cannot see.
- [x] `frontend-debt-register-plan.md` § Risks: one sentence added, pointing at the test.
- [x] Register: F-43 closed; README names the next ready row.
- [x] Gates

## Status

Done 2026-10-19 on `test/register-todo-check`. On the tree measured, 68 todos: 14 open, all named
above Closed. The 40 the register never names have no unticked box: 37 fully ticked checklists and
3 write-ups with no boxes (`2026-09-15-todo-map-space-tokens.md`,
`2026-09-15-todo-phantom-colour-classes.md`, `2026-09-15-todo-widen-token-lint-rules.md`).

Not covered, by design (D-04): a finding written as prose, a row left open after its todo was
ticked, and the inverse check that a named todo still exists, since todos are deletable.
