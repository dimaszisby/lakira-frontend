# Dependency audit split

**Status:** Merged as #64 (77fa8e3, 2026-10-03); D-01 is ADR-0023, accepted in the same PR
(registry rule). Open: AC-3. The first dispatched run failed on an unpatched advisory in `braces`,
a development-only dependency, so no green run exists yet; tracked in
`docs/internal/todos/2026-10-03-todo-braces-dev-advisory.md`.
**Slug:** `dependency-audit-split` · **Branch:** `chore/dependency-audit-split`

- [Checklist](dependency-audit-split-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries; promoted ones point at the ADR registry

Small sweep: no plan file. Origin:
[`2026-09-30-todo-npm-audit-brace-expansion.md`](../../todos/2026-09-30-todo-npm-audit-brace-expansion.md).
