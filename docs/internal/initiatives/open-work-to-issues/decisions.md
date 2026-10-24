# Open work to issues — Decisions

## D-01 — Steps 3 and 4 in one PR; open rows and owner questions become issues; issue first, a kit only for two days or more

- **Status:** Accepted
- **Date:** 2026-10-25

> **Promoted to [ADR-0044](../../../explanation/decisions/adr-0044-every-task-starts-from-an-issue.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

**Context.** Register row F-77 holds the rest of the move to GitHub Issues that ADR-0042 began:
step 3 moves the open work, step 4 rewrites the rules, step 6 offers the setup to the backend.
On `dev` at `39e2b40` the register held 23 open rows and 5 owner questions, and 10 todo files had
open boxes. The repository had no issues; the labels and forms shipped in #154.

**Decision.** The owner chose on 2026-10-24:

- **Steps 3 and 4 ship in one pull request,** and step 6, a Notion record, follows its merge.
- **Each open row still to do becomes an issue, and each `O-NN` a `type:decision` issue,** linked
  from the rows it blocks. F-22 and F-23 are settled ("accepted", "kept on purpose") and move to
  `docs/reference/known-gaps.md` instead. F-77 closes with this pull request.
- **Every task starts from an issue.** Its number goes in the branch (`fix/123-slug`) and the
  commit footer (`refs: #123`), and the pull request says `Closes #123`. A kit is written only for
  work sized 2–5 days or more; smaller work has no kit, no todo file and no register row.
- **Todo files stay as dated records.** Each open one names its issue in its Status section, and
  no new todo file is written after 2026-10-25.

**Options considered.** Three pull requests, one per step: rejected, since between them "what's
next" would read a frozen register. Step 3 alone: rejected for the same reason. Filing the settled
rows as issues: rejected, an issue nobody will work is noise in the query. A kit only for
multi-week work: rejected, the 2–5 day kits are where a decisions log has earned its keep. Kits
for every non-trivial task, as before: rejected, it keeps the bookkeeping the move exists to
remove. Folding the todos into issues and archiving them: rejected, the dated file is the
finding's record and links from old PRs point at it.

**Consequences.** "What's next" reads `gh issue list`. The register and its test are frozen
records. The backend's register (lakira-backend #159) has no frontend twin any more; rows that
named a `B-NN` keep the id in the issue body.

## D-02 — Ranking: state, then tier, then severity, then the lower number

- **Status:** Accepted
- **Date:** 2026-10-25

**Context.** The register ranked by its own D-01: tier, then within a tier the P1 first and the
smaller first, written into table order. Labels hold the tier and the severity; nothing holds
the order within them.

**Decision.** "What's next" is the open issue labelled `state:ready` with the lowest `tier:`, then
the lowest `sev:` (none sorts after P3), then the lowest number. The issues are created in register
order, so on the day of the move the number reproduces the register's order within a tier.

**Options considered.** A `size:` label to keep "smaller first": rejected for now, the Task form
already asks for a size and the register rarely knew one. A Project board with a manual order:
deferred, as ADR-0042 deferred it.

**Consequences.** A new issue ranks after older ones of the same tier and severity. When that is
wrong, the remedy is the label, not the order.

## D-03 — How the register's columns map to labels

- **Status:** Accepted
- **Date:** 2026-10-25

**Context.** The register's State and Sev columns hold more shapes than one label each:
"owner (O-01)", "owner, BE", "upstream; revisit 2026-11-03", "low".

**Decision.**

- State: `ready` is `state:ready`; `owner (O-NN)` is `state:owner` with "Blocked by #N" naming the
  decision issue; `BE` is `state:backend` with the `B-NN` in the body; `upstream` is
  `state:upstream` with any revisit date in the body; `deferred` is `state:deferred`. Where a row
  names two, the first is the label and the second is named in the body.
- Sev: `P1` to `P3` map to `sev:P1` to `sev:P3`; F-39's "low" is `sev:P3`, noted in its body; "—"
  has no `sev:` label.
- Type: F-58, a wrong `logCount` in a response, is `type:bug`; every other row is `type:task`.

**Options considered.** Two state labels on a row that names two: rejected, the tracker reference
allows one, and the query would match both.

**Consequences.** An issue's body, not its labels, carries the second blocker and dates.
