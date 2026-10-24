# Open work to issues — Plan

- **Status:** Done
- **Appetite:** 2 days — past that, cut scope rather than extend
- **Date:** 2026-10-25

## Context and goals

ADR-0042 moves open work from Markdown in git to GitHub Issues in stages; step 2, the labels and
forms, shipped in #154. Register row F-77 holds the rest. This kit does steps 3 and 4: the
register's open work becomes issues, the register and the todos become records, and the rules
start every task from an issue. Step 6, offering the setup to lakira-backend, is a Notion record
after the merge.

## Acceptance criteria

- **AC-1** — Each open register row still to do is an issue, and each owner question a
  `type:decision` issue, with the labels kit D-03 maps. _Why:_ "what's next" reads the issues.
- **AC-2** — `register.md` is frozen and says where each of its rows went. _Why:_ a reader of an old
  pull request that cites `F-NN` finds the issue.
- **AC-3** — Each todo with an open box names its issue, and no todo is dated after the freeze.
  _Why:_ D-01, todos are records and intake is an issue.
- **AC-4** — `.claude/rules/workflow.md` answers "what's next" from the issues by D-02, and starts
  every task from an issue. _Why:_ the rule an agent follows is the one that has to change.
- **AC-5** — The kit sizing in `.claude/rules/documentation.md` writes a kit only for work of two
  days or more. _Why:_ D-01.
- **AC-6** — `docs/reference/known-gaps.md` holds the settled rows F-22 and F-23. _Why:_ a fork
  inherits them knowingly.

## Open questions

None open. The owner answered four on 2026-10-24 (D-01), and confirmed each batch of issues before
it was created.

## Out of scope

- A Project board (ADR-0042 deferred it).
- Release versioning, F-75, now #174.
- Moving the backend's register; step 6 only offers it.

## Decisions expected

- D-01: the shape of the move and the paperwork after it.
- D-02: the ranking in labels.
- D-03: the mapping from the register's columns to labels.

## Phases

### Phase 0 — issues, records, rules

Create the decision issues, then the task issues in register order, from a manifest built from the
register, its todos and its analyses; each batch confirmed by the owner. Freeze the register,
link the todos, write `known-gaps.md`, rewrite the rules, and replace the register's test.

## Risks and trade-offs

The issues are public, as the repository is; every row was already public in the register. An
issue's number was predicted before it was created, so the bodies could name each other; the
script stopped at any number that landed differently.

## References

[ADR-0042](../../../explanation/decisions/adr-0042-open-work-moves-to-github-issues.md) ·
[ADR-0044](../../../explanation/decisions/adr-0044-every-task-starts-from-an-issue.md) · kit
[`tracker-as-code`](../tracker-as-code/README.md) · the frozen
[register](../frontend-debt-register/register.md)
