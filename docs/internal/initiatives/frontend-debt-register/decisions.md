# Frontend debt register — Decisions Log

`D-NN` entries scoped to this kit. ADR numbers without four digits (ADR-001, ADR-002) refer to
`docs/internal/audits/saas-readiness/decisions.md`, not the flat registry. `B-NN` is a row of the
backend's register, lakira-backend `docs/internal/initiatives/backend-debt-register/register.md`.

---

## D-01 — The ranking rule, fixed before any row is ranked

- **Status:** Accepted
- **Date:** 2026-10-13

**Context.** Open work is recorded in five places that do not rank against each other: the todo
files, the dated audit's findings, `SAAS-BASE-CHECKLIST.md`, the Notion page shared with
lakira-backend, and the backend's own register. The repo's rules name no priority source, so each
"what's next" was ranked from scratch, by whoever was asked. Written before the register has an
order. The backend made the same decision first (lakira-backend #159, its D-01), and the two
registers are meant to be read side by side.
**Decision.** Rows are ordered by these tiers, top first.

1. An item that keeps the audit verdict open, because FORK-READY WITH CAVEATS cannot be
   reconfirmed while it stands (ADR-001 criterion 3; `FINAL-AUDIT-SUMMARY.md` § 8).
2. A P1 or P2 owed to the backend.
3. A P2 security item.
4. Any other P1 or P2.
5. P3.

Within a tier the smaller item comes first. A row's severity is the one its source recorded; where
two sources disagree, the register shows both and ranks by the higher. A row waiting on a decision
keeps its rank and is marked, so the register shows what is blocked and on whom, and "what's next"
names the top row that is ready. A row whose source records no severity ranks in tier 5 and is
marked ungraded; the register lists those for the next dated audit to grade. A todo's own
"Priority: low" or "medium" is shown as written and is not translated into a P-level.
**Options considered.** Ranking by size alone, smallest first: rejected, it would bury the one
item the verdict waits on under the tidy-ups. Ranking by age: rejected, the oldest todos are the
ones nobody needed. A numeric score per row: rejected, it invents precision the sources do not
have. Leaving blocked rows in a separate list: rejected, the top of this repo's backlog has been
blocked on one decision for weeks and a separate list would hide exactly that. A different tier
order from the backend's: rejected, the same rule on both sides is what lets a row on one register
be found on the other.
**Consequences.** The top of the register can be a row that cannot be worked, and the answer to
"what's next" is then that row as a gap plus the first ready row under it. Tier 4 holds P1 beside
P2, because the one open P1 that is not a verdict item has nowhere else to go; inside the tier the
P1 is listed first. The rule says nothing about value to a user of the product; an item moves only
when its recorded severity does.

## D-02 — How rows group into fix PRs

- **Status:** Accepted
- **Date:** 2026-10-13

**Context.** Forty-three rows do not mean forty-three PRs. Some share the same few lines, some are
one edit session on the Notion page, and one must not share a PR because a dated audit run has to
grade it alone.
**Decision.** A fix PR takes one row, with these named exceptions.

- **F-03 with the proxy's part of F-14:** both change which headers
  `src/app/api/proxy/[...path]/route.ts` forwards, and F-03's ADR then covers both
  ([analysis](analysis-client-ip-through-proxy.md), [analysis](analysis-x-request-id.md)). F-14's
  part can also go first, alone; it waits on nothing.
- **F-08 with F-28,** if convenient: once no boundary renders `error.message`, the lint rule
  against it has no exception to carve out.
- **F-17 with F-18 and F-19:** two edits to the Notion page and the two todos they make stale, in
  one sitting.
- **F-04 with F-05,** if their patches ship together: both are lockfile updates.
- **F-32 with F-33,** if the chart's summary is built: the same pages need data to be checked.

**F-01 goes alone.** It is the one item the verdict waits on, and the dated run that follows it
should grade one change. F-02 and F-11 are answered by the same decision and are closed by
filling in the environment table, which is F-01's own acceptance criterion; they close with it and
are not separate PRs.
**Options considered.** One sweep PR for the tier 5 rows: rejected, a reviewer cannot hold thirty
unrelated changes and a revert would take all of them. Strictly one row per PR: rejected, F-17 to
F-19 would be three PRs for one sitting.
**Consequences.** A grouped PR closes several rows, and each row names the PR. The grouping is
advice; a fix's own plan can split a group and should say why.

## D-03 — What is listed and not analysed

- **Status:** Accepted
- **Date:** 2026-10-13

**Context.** The appetite is one session. An in-depth analysis of every row would take several,
and most rows are leftovers whose todo already says what to do.
**Decision.** Eight analyses cover eleven rows: every row in tiers 1, 2 and 4 except F-07 and
F-13, and two tier 5 rows. F-14 is analysed because the backend is party to it and analysed its own
half. One file, on decisions owed between the repositories, is a note per item and covers F-02,
F-10, F-11 and F-16. The other thirty-two rows are listed with their source and nothing more.

Four rows in tiers 3 and 4 are P2 and not analysed:

- **F-04 and F-05** wait on a package's maintainers. Each todo records the trace, what was tried
  and what to run when a patch ships; an analysis would repeat it.
- **F-07,** the missing code of conduct, is one file and one answer from the owner (O-03).
- **F-13,** the plan surface, is a product decision with no code to read (O-10).

**Options considered.** Analysing by tier only, all of tiers 1 to 4 and none of tier 5: rejected,
it would leave out the one row the backend has already analysed from its side. Analysing nothing
and ranking only: rejected, the owner asked for analysis, and writing them changed what three
fixes should be: F-06's found that the backend repository is public now, which removes one of the
three costs its deferral rested on; F-14's found the browser's text in this project's own log
line; F-09's found that one of the two files may need no state at all.
**Consequences.** A tier 5 row picked up later starts from its todo, not from an analysis.
Twenty-seven rows carry no P-level; the next dated audit is asked to grade them, F-32 first, since
a chart with no text alternative is a WCAG 1.1.1 question and reads as more than polish.

## D-04 — What makes a todo open, for the check that every open todo has a row

- **Status:** Accepted
- **Date:** 2026-10-19

**Context.** Row F-43: the rule that a new todo gets a register row in the same PR
(`.claude/rules/workflow.md` § What's next) was enforced by memory only. A check needs a definition
of an open todo that a machine can read. On 2026-10-19, 68 todo files: 14 have an unticked box and
all 14 are named in a row above `## Closed`; the 40 the register never names have no unticked box,
37 being fully ticked checklists with a Status section and 3 being write-ups of finished work with
no boxes at all.
**Decision.** A todo is open when it has a line that begins, after any indent, with `- [ ]`. Every
open todo's filename must appear in `register.md` above the `## Closed` heading.
`src/__tests__/register-todos.test.ts` checks it in the unit gate.
**Options considered.** Every todo must be named somewhere in the register: rejected, it would
demand rows for forty finished todos written before the register existed. A todo is open when it
has no `## Status` section: rejected, eight open todos have one, since a Status section records
progress, not completion. Also checking the inverse, that each todo a row names still exists:
rejected, todos are user-controlled and deletable (`.claude/rules/workflow.md` § Ephemeral todos),
and the check would make deleting one fail CI.
**Consequences.** A finding written as prose, not as a box, is invisible to the check, as is a row
left open after its todo was fully ticked. The "what's next" answer still lists todos newer than
the register's "As of" date by hand, for those cases only.

## D-05 — Closed rows move to their own file

- **Status:** Accepted
- **Date:** 2026-10-23

**Context.** Kit `docs-diet`, D-01. On `dev` at `168291f` the register was 51,086 bytes, and its
`## Closed` section, 53 rows, was 36,644 of them (72%). Every "what's next" reads `register.md` in
full, so it read 53 finished rows to find the open ones. D-04's check bounded the open rows by the
`## Closed` heading.
**Decision.** The Closed table moves, verbatim, to [`register-closed.md`](register-closed.md). A
fix PR moves its row there, appended at the bottom, in the same PR. `register.md` holds open rows,
the owner questions and the notes above them, and points to the closed file. This supersedes D-04's
"above the `## Closed` heading": every row of `register.md` is open, and
`src/__tests__/register-todos.test.ts` checks each open todo against it. The test also fails when
one row id is in both files, which catches a row copied instead of moved.
**Options considered.** Shortening each closed row to one line plus its PR: rejected, it rewrites
53 records and the register would still be read in one piece. Deleting closed rows, since each PR
holds the detail: rejected, the notes record what each fix found, and only some of that is in the
PR body.
**Consequences.** `register.md` dropped to about 14 KB. A closing PR now edits two files instead of
one. The "As of" line still lists closed ids, so it can say which rows a given `dev` has closed
without opening the second file.
