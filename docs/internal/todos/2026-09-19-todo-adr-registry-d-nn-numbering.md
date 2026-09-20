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

- [x] **Adding one:** state that a kit-local decision is `D-NN` and that its promoted record takes
      the next free `ADR-NNNN`.
- [x] **Origin column:** say that new rows record `D-NN`. Existing values stay as written —
      `ADR-001`…`ADR-076` are immutable history from the components-overhaul kit, and renumbering
      them would falsify the record.
- [x] Check `docs/explanation/documentation-standards.md`, which `Adding one` links to, for the same
      stale assumption.

## Notes

`lakira-backend` is filing the equivalent item; the two registries should end up describing the same
numbering even though their promotion styles differ deliberately (see
`.claude/rules/documentation.md` § What differs from `lakira-backend`, on purpose).

## Status

**Complete**, on branch `docs/adr-registry-d-nn-numbering`.

`docs/explanation/decisions/README.md`:

- The `Origin` bullet was extended rather than rewritten, and a second bullet states that the column
  is deliberately mixed: kit-local decisions were `ADR-NNN` until 2026-09-20 and are `D-NN` after,
  the old values were correct when written, and the column is not to be tidied into one style.
- **Adding one** now says a kit entry starts as `D-NN`, so a promotion reads `D-03 → ADR-NNNN` and
  the new row's `Origin` cell carries the `D-NN`.
- The hardcoded "Take the next free number — **ADR-0017**" became a derivation: the highest number in
  the Records table, plus one. That is the fourth instance of a value hardcoded into an instruction
  that goes stale on the next change — after the `adr-0018` spine example, the backend's ADR-0044
  placeholder, and the promoted-entry count.

`docs/explanation/documentation-standards.md` needed **no change**. Its § Architectural decisions
describes promotion without ever naming a kit-local ID format, and it delegates the number with "See
`decisions/README.md` for the format and the next free number" rather than repeating one. The stale
assumption this todo anticipated is not there.

### The header counts, raised and then removed

The registry header read "**16 records.** 12 accepted, 4 superseded." — accurate that day, stale the
moment ADR-0017 lands. It was first left alone as a judgement call, on the grounds that a summary a
reader may want is not the same as an instruction that misleads.

That reasoning was wrong, and staleness was the symptom rather than the cause: the Records table sits
twenty lines below and **is** that data. A header restating it is `link, never duplicate` broken in a
file that cites the rule. So it is the same correction as the others, not a separate call, and the
counts are gone.

Raising it also surfaced the same line in `lakira-backend` ("**42 records.** 25 accepted, 17
proposed"), which had not been noticed there.

### The pattern underneath all of this

Six instances in two days of one defect: a value hardcoded into a document that nobody recounts.
`adr-0018` in the traceability spine, `ADR-0044` in the backend's promoted pointer, the
promoted-entry count, `ADR-0017` in "Adding one", the `ADR-00N` Origin in the backend's record
template, and this header.

The instructive one is the fifth: it was authored **while fixing the fourth**, in the same edit, and
caught only on read-back. A hand-maintained value reproduces even under active attention, which is
why the fix is always a derivation rather than a more careful value. The registry now says so in
"Adding one" — the same argument it already made about stale `Proposed` entries, turned on its own
header.
