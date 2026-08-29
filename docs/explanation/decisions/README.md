# Architecture decision records

One decision per file, numbered globally and ordered by the date the decision was made.
Format: [Nygard ADR](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

**15 records.** 14 accepted, 1 superseded.

## Reading these

- **Status is the first thing to check.** `Proposed` means the decision was written down but is
  **not implemented** — do not assume the code matches it. There are no `Proposed` records today.
- **Records are immutable.** A decision that no longer holds is superseded by a new record, not
  edited. The `Related` line links the pair in both directions — see ADR-0001 and ADR-0002.
- **`Origin` points at the kit** the decision was made in. That kit lives under
  [`../../internal/initiatives/components-overhaul/`](../../internal/initiatives/components-overhaul/),
  and its `decisions.md` remains the full working log.

## Records

| №                                                                                   | Decision                                                  | Status         | Date       | Origin    |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------- | ---------- | --------- |
| [ADR-0001](./adr-0001-button-consolidation-and-primarybutton-deprecation-window.md) | Button consolidation and PrimaryButton deprecation window | **Superseded** | 2026-02-13 | `ADR-003` |
| [ADR-0002](./adr-0002-immediate-primarybutton-removal.md)                           | Immediate PrimaryButton removal                           | Accepted       | 2026-02-13 | `ADR-004` |
| [ADR-0003](./adr-0003-standardize-on-formfield-and-remove-fieldshell.md)            | Standardize on FormField, remove unused FieldShell        | Accepted       | 2026-02-13 | `ADR-005` |
| [ADR-0004](./adr-0004-colorfield-tokenization-and-hex-contract.md)                  | ColorField tokenization and hex contract hardening        | Accepted       | 2026-02-14 | `ADR-007` |
| [ADR-0005](./adr-0005-pagination-contract-and-accessibility-guardrails.md)          | Pagination contract rebuild and accessibility guardrails  | Accepted       | 2026-02-14 | `ADR-008` |
| [ADR-0006](./adr-0006-card-primitive-contract.md)                                   | Card primitive contract hardening                         | Accepted       | 2026-02-14 | `ADR-010` |
| [ADR-0007](./adr-0007-table-contract-and-row-interaction-guardrails.md)             | Table contract and row-interaction guardrails             | Accepted       | 2026-02-15 | `ADR-011` |
| [ADR-0008](./adr-0008-visualization-url-state-sync.md)                              | Visualization URL-state sync hardening                    | Accepted       | 2026-02-15 | `ADR-012` |
| [ADR-0009](./adr-0009-select-listbox-trigger-semantics.md)                          | Select listbox trigger semantics and keyboard hardening   | Accepted       | 2026-02-15 | `ADR-015` |
| [ADR-0010](./adr-0010-modal-focus-management-and-close-behaviour.md)                | Modal focus management and close-behaviour hardening      | Accepted       | 2026-02-15 | `ADR-016` |
| [ADR-0011](./adr-0011-sort-controls-and-skeleton-naming.md)                         | Sort controls and skeleton naming standardization         | Accepted       | 2026-02-16 | `ADR-021` |
| [ADR-0012](./adr-0012-closure-gates-and-the-tier-test-minimum.md)                   | Closure gates and the tier test minimum                   | Accepted       | 2026-02-18 | `ADR-023` |
| [ADR-0013](./adr-0013-visualization-url-driven-state-source.md)                     | Visualization URL-driven state source                     | Accepted       | 2026-03-02 | `ADR-053` |
| [ADR-0014](./adr-0014-modal-shared-scroll-lock-coordination.md)                     | Modal shared scroll-lock coordination                     | Accepted       | 2026-03-12 | `ADR-062` |
| [ADR-0015](./adr-0015-cache-keys-are-organization-scoped.md)                        | Cache keys are organization-scoped                        | Accepted       | 2026-08-29 | `ADR-004` |

## Where the other decisions went

The components-overhaul kit logged **76 entries**, all numbered `ADR-001`…`ADR-076` inside that one
initiative. Fourteen were genuine architecture decisions and became the records above, renumbered by
original decision date so the registry reads as a timeline.

The other 62 stayed in the kit. They fall into two groups:

- **Coordination decisions** — the tracking structure, the phasing model. They mean nothing outside
  the initiative that made them.
- **Per-component hardening and test-coverage completions** — "SearchInput escape-clear guard for
  IME composition", "SegmentedControl sequential same-target emit deduping", "MetricForm
  update-failure and prop-reset stability coverage". These record that a specific bug was fixed and
  covered. They are valuable history, but they do not constrain how the system is built, and
  promoting all of them would bury the fourteen that do.

The full log remains at
[`../../internal/initiatives/components-overhaul/decisions.md`](../../internal/initiatives/components-overhaul/decisions.md).

## Adding one

Take the next free number — **ADR-0016** — copy the shape of an existing record, and open with
`Status: Proposed`. Flip it to `Accepted` in the same PR that implements it. A registry full of
stale `Proposed` entries is worse than no registry, because readers cannot tell intent from fact.

A decision made inside an initiative kit starts life in that kit's `decisions.md`. Promote it here
only if it would still matter to someone who never saw the initiative, and leave a pointer behind.
See [`../documentation-standards.md`](../documentation-standards.md).
