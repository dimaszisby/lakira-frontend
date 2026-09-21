# Drop withAuth

**Status:** Implementation complete, all nine gates green.
**Slug:** `drop-withauth` · **Branch:** `refactor/drop-withauth-and-dead-auth-shims`

A small sweep, so there is no plan — the [checklist](drop-withauth-checklist.md) carries the
acceptance criteria and is the thing that was approved.

Closes the `withAuth` / `HydrateUser` half of the layer-rule quarantine opened on 2026-08-17 in
`docs/internal/todos/2026-08-17-todo-claude-code-setup.md`. Not by inverting them, as that todo
planned — by establishing that both were dead and deleting them. `Header.tsx` and `Sidebar.tsx`
remain and do need inverting.

- [Checklist](drop-withauth-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-01` delete rather than invert, `D-02` recovery card over redirect
