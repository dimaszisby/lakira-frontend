# ADR registry does not know about `D-NN`

**Purpose:** the decision registry still describes the kit-local numbering that the kit templates replaced.
**Owner:** hardini
**Branch:** `docs/adr-registry-d-nn-numbering` off `dev`

## What is wrong

`.claude/rules/documentation.md` now separates the two numbering spaces: kit-local decisions are
`D-01`, `D-02`; the registry keeps `ADR-NNNN`. A promotion reads `D-03 → ADR-NNNN`.

`docs/explanation/decisions/README.md` has not caught up:

- The **Origin** column records kit-local refs in the old style — `ADR-003`, `ADR-004`, `ADR-053`.
- **Adding one** explains taking the next free number and promoting from a kit's `decisions.md`, but
  says nothing about `D-NN`.

So the registry documents a convention the kits have stopped using.

## Why it is time-sensitive

This activates the moment a new kit writes `D-01`. It should land before the first kit built under
the templates, or the first promotion will have nowhere consistent to record its origin.

## The fix

- [ ] **Adding one:** state that a kit-local decision is `D-NN` and that its promoted record takes
      the next free `ADR-NNNN`.
- [ ] **Origin column:** say that new rows record `D-NN`. Existing values stay as written —
      `ADR-001`…`ADR-076` are immutable history from the components-overhaul kit, and renumbering
      them would falsify the record.
- [ ] Check `docs/explanation/documentation-standards.md`, which `Adding one` links to, for the same
      stale assumption.

## Notes

`lakira-backend` is filing the equivalent item; the two registries should end up describing the same
numbering even though their promotion styles differ deliberately (see
`.claude/rules/documentation.md` § What differs from `lakira-backend`, on purpose).
