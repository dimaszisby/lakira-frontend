# Frontend debt register

**Status:** Frozen on 2026-10-25 as a record. Fifty-seven rows were closed here; the other 20
open rows and the five owner questions moved to GitHub Issues, #155 to #179, and F-22 and F-23 to
[`known-gaps.md`](../../../reference/known-gaps.md) (kit
[`open-work-to-issues`](../open-work-to-issues/README.md), ADR-0044). The mapping is at the top of
[`register.md`](register.md).
**Slug:** `frontend-debt-register` · **Branch:** `docs/frontend-debt-register`

The same scheme as lakira-backend's register (lakira-backend #159), so the two can be read side by
side. Rows here are `F-NN`; the backend's are `B-NN`.

- [Register](register.md) — every open item, ranked. **"What's next" is answered from here**
  (`.claude/rules/workflow.md` § What's next)
- [Closed rows](register-closed.md) — every closed row, with the PR that closed it
- [Plan](frontend-debt-register-plan.md) — goals, acceptance criteria, phases
- [Checklist](frontend-debt-register-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries: the ranking rule, the grouping, what is not analysed
- Analyses: one `analysis-<item>.md` per item, linked from its register row
