# Frontend debt register

**Status:** Register and eight analyses written. Seven rows closed since (F-08, F-09, F-10, F-14,
F-17 to F-19). Every row in tiers 1 to 4 waits on the owner, the backend or a package's
maintainers. In tier 5, F-15, F-16, F-52 and F-20 wait on the backend or the owner; the first ready
row is F-21.
**Slug:** `frontend-debt-register` · **Branch:** `docs/frontend-debt-register`

The same scheme as lakira-backend's register (lakira-backend #159), so the two can be read side by
side. Rows here are `F-NN`; the backend's are `B-NN`.

- [Register](register.md) — every open item, ranked. **"What's next" is answered from here**
  (`.claude/rules/workflow.md` § What's next)
- [Plan](frontend-debt-register-plan.md) — goals, acceptance criteria, phases
- [Checklist](frontend-debt-register-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries: the ranking rule, the grouping, what is not analysed
- Analyses: one `analysis-<item>.md` per item, linked from its register row
