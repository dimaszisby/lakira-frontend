# ADR-0044 — Every task starts from an issue; a kit only for two days or more

- **Status:** Accepted
- **Date:** 2026-10-25
- **Related:** completes [ADR-0042](./adr-0042-open-work-moves-to-github-issues.md), steps 3 and 4
- **Origin:** kit `open-work-to-issues`, D-01 — [`decisions.md`](../../internal/initiatives/open-work-to-issues/decisions.md)

---

## Context

ADR-0042 put the tracker in the repository and kept the debt register as the source of "what's
next" until its open rows moved to issues. It left kits unchanged. On 2026-10-24 the register held
23 open rows and five owner questions, ten todo files had open boxes, and the repository had no
issues. Every task of any size wrote a kit or a todo, a register row, and, after the merge, a
close-out: the bookkeeping the move to issues exists to remove.

## Decision

The owner chose on 2026-10-24:

1. **Open work is GitHub Issues.** The register's 20 open rows still to do became issues #160 to
   #179, and its five owner questions `type:decision` issues #155 to #159. The two settled rows
   are in `docs/reference/known-gaps.md`. The register is frozen as a record, with a table of
   where each row went.
2. **Every task starts from an issue.** Its number goes in the branch (`fix/123-slug`) and the
   commit footer (`refs: #123`), and the pull request says `Closes #123`, so the merge closes it.
   A finding made during other work is filed as an issue in the same pull request's handover.
3. **A kit only for work of two days or more.** Work sized 2–5 days or multi-week keeps its kit:
   plan, checklist, decisions, README, with the issue number in the README. Smaller work has no
   kit, no todo file and no register row; the issue body and the pull request carry it.
4. **"What's next" is a query:** `gh issue list --state open --label state:ready`, ranked by tier,
   then severity, then the lower number (kit D-02).
5. **Todo files are records.** Each one that still had an open box names its issue; no new todo
   file is written after 2026-10-25.

ADRs are unchanged: a decision that constrains the system is still a record in this registry.

## Options considered

- **Three pull requests, one per step:** rejected. Between them, "what's next" would read a frozen
  register.
- **A kit only for multi-week work:** rejected. The 2–5 day kits are where a decisions log has
  earned its keep, and without one the reasons for a rejected option are lost.
- **A kit for every non-trivial task, linked to its issue:** rejected. It keeps the bookkeeping.
- **Filing the settled rows as issues:** rejected. An issue nobody will work is noise in the query.
- **Folding the todos into issues and archiving them:** rejected. The dated file is the finding's
  record, and merged pull requests link to it.

## Consequences

- `src/__tests__/open-work-records.test.ts` replaces `register-todos.test.ts`: the frozen register
  maps every row, each open todo names its issue, and a todo dated after the freeze fails the unit
  gate.
- Issues do not copy to a fork; `known-gaps.md` and the labels do.
- The backend keeps its register (lakira-backend #159). A frontend issue that came from a row
  naming a `B-NN` keeps the id in its body. The setup is offered to the backend on the Notion page.
- A status change after a merge needs no commit.
