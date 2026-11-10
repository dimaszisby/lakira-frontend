---
name: metrics-list-log-count-review
description: approve w/ suggestions; fix/170-metrics-list-log-count (log mutations now invalidate metrics lists)
metadata:
  type: project
---

Verdict: approve with suggestions, branch fix/170-metrics-list-log-count.

**How to apply:** When a mutation is changed to refresh a derived field (a count, total) shown elsewhere, enumerate every cache whose DTO carries that field by grepping the field name in `view-models.ts`/`mappers.ts`, then confirm each is reached by an existing invalidator root (here the category's metric list shares the metrics cursor root, so one call covers both). For cross-feature imports, check what sibling hooks already import before flagging: lint does not enforce the `features/shared` rule, so precedent in the same folder decides severity. For Cypress column assertions, check the table markup for row-header `th` cells that would shift a header-index lookup.
