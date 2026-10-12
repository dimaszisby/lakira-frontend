# Frontend debt register — Plan

- **Status:** In progress
- **Appetite:** one session — past that, cut analyses from the bottom of the list, not depth
- **Date:** 2026-10-13

## Context and goals

Open work is recorded in five places that do not rank against each other: the todo files, the
dated audit's findings, `SAAS-BASE-CHECKLIST.md`, the Notion page shared with lakira-backend, and
the backend's own register. The repo's rules named no priority source, so every "what's next" was
ranked from scratch, and the last three answers ended with "everything left waits on the owner".

The backend built a register for the same reason in lakira-backend #159. This kit is the same
scheme on this side, so the two can be read side by side.

When this lands there is one ranked register that "what's next" is answered from, a written
analysis for each item worth fixing soon, and a rule in `.claude/rules/workflow.md` that says so.

## Acceptance criteria

- **AC-1** — `register.md` has a row for every open source item: each todo file with an open
  item, each open finding of the 2026-10-10 audit, each live Notion record, and each backend
  register row that waits on this repository. _Why:_ a register that misses items is a second
  backlog, not a first.
- **AC-2** — Every row cites its source by path or section, and no row restates a todo's body.
  _Why:_ `.claude/rules/documentation.md`, "Link, never duplicate".
- **AC-3** — D-01 is written before the register is ranked, and the order follows it with no
  exception left unexplained. _Why:_ a rule written afterwards bends to the result.
- **AC-4** — Each analysed item has a file with all eight sections, and every claim about the
  code carries a `file:line` that exists at `f67716e`. _Why:_ an analysis that cannot be checked
  gets redone when the fix starts.
- **AC-5** — Each analysis says what was not verified. _Why:_ the backend's run found a claim
  copied from a todo that the code did not bear out.
- **AC-6** — `.claude/rules/workflow.md` names the register as the source for "what's next" and
  says how a row is added and closed, and `CLAUDE.md` points at it. _Why:_ the owner's request;
  without the rule the register goes stale.
- **AC-7** — `format` passes and no file outside `docs/`, `.claude/rules/` and `CLAUDE.md`
  changes. _Why:_ this is a docs task.

## Open questions

None for this kit. The questions only the owner can answer are about the rows, not about the
register; they are the `O-NN` table in [`register.md`](register.md).

## Out of scope

- Fixing anything. Each fix is its own PR and cites its register row.
- Editing the todos themselves. Where one is stale, the register says so in a row (F-19).
- Editing the Notion page. What this side owes it is two rows (F-17, F-18).
- In-depth analysis of the tier 5 rows, except the one the backend is party to.
- A script that checks the register against the todo folder (F-43).
- Grading the rows that carry no severity. That is the next dated audit's job.

## Decisions expected

- The ranking rule (D-01)
- How rows group into fix PRs (D-02)
- What is listed and not analysed (D-03)

## Phases

### Phase 0 — kit and rule

Branch; README, plan, checklist; D-01 before any row is ranked.

### Phase 1 — the register

Every open todo, audit finding, Notion record and backend row that waits on this side becomes a
row; then the rows are ranked by D-01.

### Phase 2 — the analyses

Eight files, in register order, each read from the code at `f67716e`.

### Phase 3 — the rule

`.claude/rules/workflow.md` § What's next; a pointer in `CLAUDE.md`.

## Risks and trade-offs

- **It goes stale.** A register nobody updates is worse than none. The rule makes a row part of
  filing a todo and part of closing one; nothing enforces it mechanically yet (F-43).
- **Severities are inherited.** The register ranks by what each source recorded. Twenty-seven of the
  43 rows have no P-level and sit in tier 5 until an audit grades them.
- **Most of the top is blocked.** Eleven of the first thirteen rows are waiting on someone, five of
  them on one decision: where the frontend is hosted. The register makes that visible; it does not make it go away.
- **The analyses are one reader's.** They were written by the session that wrote several of the
  changes in question. Each fix's own review is the check.

## References

- lakira-backend #159 (`3277e5d`), kit `docs/internal/initiatives/backend-debt-register/`
- `docs/internal/audits/saas-readiness/audit-2026-10-10.md` § 3.1, § 6, § 7 and § 9
- `docs/internal/audits/saas-readiness/FINAL-AUDIT-SUMMARY.md` § 8
- The Notion page "FE and BE messages" (read 2026-10-13)
