# Frontend debt register

**Status:** Register and eight analyses written. Fifty-three rows closed since (F-06, F-08, F-09,
F-10, F-14 to F-21, F-24, F-25, F-27 to F-29, F-31 to F-37, F-40, F-42 to F-50, F-51, F-52, F-53, F-54, F-55, F-56, F-57, F-60, F-61, F-62, F-63, F-64, F-66, F-67, F-68, F-69, F-71, F-72, F-74). Every row in tiers 1 to 4 waits on the owner, the backend or a package's maintainers. In tier 5, F-58, F-59, F-73
and F-26 wait on the backend or the owner, F-75 on the owner, F-65 on the backend (B-71), F-30 on the owner and the backend, and F-22 and F-23 are settled; F-41 and F-70 are deferred (F-41's coverage item was done in #113). No tier-5 row is ready.
**Slug:** `frontend-debt-register` · **Branch:** `docs/frontend-debt-register`

The same scheme as lakira-backend's register (lakira-backend #159), so the two can be read side by
side. Rows here are `F-NN`; the backend's are `B-NN`.

- [Register](register.md) — every open item, ranked. **"What's next" is answered from here**
  (`.claude/rules/workflow.md` § What's next)
- [Plan](frontend-debt-register-plan.md) — goals, acceptance criteria, phases
- [Checklist](frontend-debt-register-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries: the ranking rule, the grouping, what is not analysed
- Analyses: one `analysis-<item>.md` per item, linked from its register row
