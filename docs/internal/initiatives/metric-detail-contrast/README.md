# Contrast on the metric detail page, and its first browser test

**Status:** Implemented on `fix/metric-detail-contrast`, all gates green; awaiting merge. Five acceptance
criteria met. D-01 and D-02 stay in the kit, as `cypress-a11y-e2e` D-08 and D-09 did.
**Slug:** `metric-detail-contrast` · **Branch:** `fix/metric-detail-contrast`

- [Checklist](metric-detail-contrast-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries; promoted ones point at the ADR registry

Two labels on the metric detail page fail WCAG 1.4.3, and no browser test had ever opened that
page. This sweep fixes the labels and adds the end-to-end spec that found them, which also covers
the open P1 on end-to-end coverage in
[`audit-2026-10-04.md`](../../audits/saas-readiness/audit-2026-10-04.md): creating a metric and
logging a value.

A small sweep, so there is no plan file: the acceptance criteria are in the checklist.
