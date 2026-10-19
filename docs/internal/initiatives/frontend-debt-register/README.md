# Frontend debt register

**Status:** Register and eight analyses written. Twenty-five rows closed since (F-08, F-09,
F-10, F-14 to F-19, F-21, F-27 to F-29, F-32, F-33, F-35 to F-37, F-40, F-42, F-50, F-51, F-53, F-54, F-55). Every row in tiers 1 to 4
waits on the owner, the backend or a package's maintainers. In tier 5, F-52, F-57, F-58, F-59, F-61, F-20
and F-24 to F-26 wait on the backend or the owner, F-30 on the owner and the backend, F-31 is
unexplained, F-22 and F-23 are settled, and F-56, F-34, F-60, F-48 and F-49 wait on the owner
(O-12, O-07, O-13, O-11; F-34's other two items were done in #107); F-41 is deferred (its coverage item was done in #113); the first ready row is F-43.
**Slug:** `frontend-debt-register` · **Branch:** `docs/frontend-debt-register`

The same scheme as lakira-backend's register (lakira-backend #159), so the two can be read side by
side. Rows here are `F-NN`; the backend's are `B-NN`.

- [Register](register.md) — every open item, ranked. **"What's next" is answered from here**
  (`.claude/rules/workflow.md` § What's next)
- [Plan](frontend-debt-register-plan.md) — goals, acceptance criteria, phases
- [Checklist](frontend-debt-register-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries: the ranking rule, the grouping, what is not analysed
- Analyses: one `analysis-<item>.md` per item, linked from its register row
