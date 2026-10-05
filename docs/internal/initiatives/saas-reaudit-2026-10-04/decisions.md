# SaaS re-audit, 2026-10-04 — Decisions

Kit-local `D-NN` entries. Grading calls are added here at the moment they are made, not at the end.

## D-01 — Phase 4b closed a P1, not a P0

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** `docs/internal/audits/saas-readiness/iteration-plan.md` says of phase 4b: "That closes
the section 4.5 P0". The 2026-08-29 run counted zero P0 and carried the same item as caveat C3 at
P1. The two labels cannot both be right, and the roadmap's rule for when a re-audit is owed
("after each phase that closes a P0") depends on which is.

**Decision.** P1 is right. The baseline graded "No error monitoring of any kind" P0
(`audit-2026-08-24.md` section 4.5). Phase 4a shipped structured logging, the CSP sink and RUM, and
the 2026-08-29 run downgraded what was left, the missing vendor sink, to C3 at P1. The roadmap
itself says so three paragraphs earlier: "its P0 is downgraded, not closed". Phase 4b therefore
closed C3, a P1 that was the residue of a baseline P0. The audit states it that way, and the
roadmap sentence is corrected to match.

**Options considered.**

- _Keep "closes the P0"._ Rejected: it contradicts the severity count of the last dated run, which
  is the immutable record, and it would make this run report a P0 closing when none was open.
- _Reopen the item as P0 retroactively._ Rejected: a dated audit is not regraded after the fact,
  and nothing about the 2026-08-29 downgrade was wrong on the evidence it had.

**Consequences.** The "closes a P0" rule is not what triggers this run. ADR-002's on-demand cadence
is, together with a root checklist whose caveat table has gone stale. The run says so in its header.

## D-02 — Full regrade from the code, on the pinned runtime, by one grader

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** 135 commits separate this run from the last. A delta pass over the six caveats would
be cheaper, but it would trust every grade the last run gave to code that has since changed. The
backend's 2026-10-03 run used subagents because the session grading a fix had also written it.

**Decision.**

- All 79 items are regraded from the tree at HEAD, in the baseline's category structure. Kit
  READMEs, commit messages and the handoff are leads, not evidence.
- Gates run on Node 24.21.0 from a checksum-verified tarball, after a fresh `npm ci` in a scratch
  worktree. `.nvmrc` pins 24 and the host has 26.5.0.
- Gates added since the last run are checked for vacuity under ADR-003 of the audit kit: each is
  made to fail once for the reason it exists.
- One grader, the main thread. No subagents.

**Options considered.**

- _Delta pass only._ Rejected for the reason above. It is also how a stale claim survives two runs.
- _Gates on the host's Node 26._ Rejected: the last run did that and had to lean on CI to
  corroborate it. The pinned version removes the caveat.
- _Independent subagent graders, as the backend did._ Not taken: this session wrote none of the
  fixes it grades, which is the condition that practice guards against. The owner approved the run
  without a second grader on 2026-10-04.

**Consequences.** The run takes longer than a delta pass. A grade that moves in either direction is
explained against the 2026-08-29 grade for the same item.

## D-03 — Per-item grades are published, and three items follow the last run's precedent

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** `audit-2026-08-29.md` gives category counts but no grade per item, so this run cannot
say which item moved, only which category did. Three items have no gap that code can close, and
their grade is a convention rather than an observation.

**Decision.** The audit carries a table with all 79 items and their grades, so the next run can
diff item by item. Where the 2026-08-29 counts leave only one reading, that reading is kept:

- `secure: true` on the session cookie is **Pass**. It is deliberate and documented. Security was
  7 Pass and 1 Partial on 2026-08-29 with the gitleaks pin open, which leaves no room for a second
  Partial.
- The subscription and plan surface is **Missing**, P2. Nothing exists in either repository.
- `SECURITY.md` and `CODE_OF_CONDUCT.md` is **Partial**, P2. One of the two files exists.

**Options considered.**

- _Category counts only, as before._ Rejected: it is why this run cannot name what moved.
- _Regrade `secure: true` as Partial, as the baseline did._ Rejected: it would move Security for a
  reason that is not a change in the code.

**Consequences.** Comparison with 2026-08-29 is by category. From this run on it is by item.

## D-04 — A new finding that contradicts a Pass lowers that item's grade

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** Four checks in this run found a defect in something the baseline graded Pass: the
proxy forwards outside its API base, the access token passes through browser JavaScript at sign-in,
the production CSP allows inline script, and a bootstrapped fork fails the `format` gate. The
baseline items are worded as the absence of a gap, so a new gap has no row of its own.

**Decision.** Each finding lowers the item it contradicts to Partial, and is also listed as a
numbered finding with its own severity. The audit kit's README already says a category cannot be
Pass if its verification fails.

**Options considered.**

- _List the findings beside an unchanged scorecard._ Rejected: the scorecard would then report
  100% for a category with a reproduced defect in it. That is the vacuity ADR-003 exists to stop.
- _Add new rows._ Rejected: the 79-item denominator is what makes runs comparable.

**Consequences.** Auth, API Contract, Security and Forkability each lose one Pass for a reason that
is not a regression in the code since 2026-08-29, or not only that. The audit says which is which.

## D-05 — Criterion 3 is read by the letter, and it fails

- **Status:** Accepted
- **Date:** 2026-10-04

**Context.** ADR-001 of the audit kit makes the frontend fork-ready only when all seven critical
categories are at 80% Pass or more. The 2026-08-29 run recorded CI/CD at 67% and called the
criterion "PASS with one exception". ADR-001 has no exceptions, and amending it needs an appended
ADR, which nobody wrote. In this run CI/CD is still at 67% and Forkability is at 71%.

**Decision.** Criterion 3 is recorded as **FAIL, 5 of 7**, and the verdict says FORK-READY WITH
CAVEATS is not reconfirmed. The audit states plainly that CI/CD has not moved since the run that
passed it, so the change in the criterion is one of reading for CI/CD and one of evidence for
Forkability. Whether deploy configuration should be a named exception to ADR-001 is the owner's
decision and is raised as an open question, not settled here.

**Options considered.**

- _Keep "PASS with exceptions", now two._ Rejected: an exception list that grows with each run is
  not a gate. One unrecorded exception was already a soft reading; two is rounding up.
- _Append an ADR-005 to the audit kit that exempts Category 8 until hosting is decided._ Not taken
  in this run: it changes the gate, and the session that grades should not also move the bar. It
  would still leave Forkability under 80% until the fork's `format` failure is fixed.

**Consequences.** The headline verdict is worse than the last run's while the repository is, on
almost every item, better. The audit has to carry that without either softening the criterion or
implying a regression that did not happen.
