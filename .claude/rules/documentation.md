---
paths:
  - docs/**
---

# Documentation

`docs/` is organised by **what the reader is doing**, not by what the artifact is called. Four
[Diátaxis](https://diataxis.fr/) quadrants ship; `internal/` holds this project's working material
and sits beside them rather than inside them.

Canonical standard: [`docs/explanation/documentation-standards.md`](../../docs/explanation/documentation-standards.md).
Index: [`docs/README.md`](../../docs/README.md). This file is the agent-facing summary — when the two
disagree, the standard wins and this file is what needs fixing.

<!-- PLACEMENT-TABLE:START — must stay byte-identical to .claude/agents/doc-writer.md -->

## Where a document goes

Ask what the reader is doing, then place it. Never place by artifact name.

| The document…                                        | Goes to                                          |
| ---------------------------------------------------- | ------------------------------------------------ |
| teaches a newcomer a skill, followed start to finish | `docs/tutorials/`                                |
| gets an experienced reader through one task          | `docs/how-to/<area>/`                            |
| is looked up, not read through                       | `docs/reference/`                                |
| explains a concept, a trade-off, or why something is | `docs/explanation/`                              |
| records an architectural decision                    | `docs/explanation/decisions/adr-NNNN-<slug>.md`  |
| tracks a piece of work — plan, checklist, tracker    | `docs/internal/initiatives/<topic>/`             |
| is a dated one-off note or session TODO              | `docs/internal/todos/`, `docs/internal/dev-log/` |
| is an audit run                                      | `docs/internal/audits/<program>/`                |
| is a postmortem                                      | `docs/internal/incidents/`                       |

Two rules keep the tree honest:

1. **One quadrant per document.** If it both teaches and specifies, split it.
2. **Generated files are never hand-edited.** `docs/reference/api/lakira-backend-openapi.json` is
   synced from `lakira-backend` and drift-gated in CI — run `npm run api:spec:sync` instead.

If a document does not obviously fit, it is usually working material: put it under `docs/internal/`
rather than inventing a new top-level folder.

<!-- PLACEMENT-TABLE:END -->

## Kit sizing

Anything under `docs/internal/initiatives/<topic>/` follows the kit pattern. Match the paperwork to
the work:

| Scope                 | Minimum files                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Multi-week initiative | `README.md`, `<topic>-plan.md`, `<topic>-checklist.md`, `decisions.md`, plus tracker/incidents |
| 2–5 days              | `README.md`, `<topic>-plan.md`, `<topic>-checklist.md`, `decisions.md`                        |
| Small sweep           | `README.md`, `<topic>-checklist.md`, one `decisions.md` entry                                 |
| Single commit         | One `decisions.md` entry with the SHA                                                         |
| Ephemeral             | One `docs/internal/todos/YYYY-MM-DD-todo-<slug>.md`. No kit.                                  |

An ephemeral todo is tracked in git but user-controlled and deletable without a follow-up PR.
Promote it to a kit if it grows into an initiative.

**A document in one of the four shipped quadrants is a single file.** Do not scaffold a kit around it.

## A kit is the spec, and the checklist is the tickets

Do not invent a `specs/` folder or a parallel ticket file. The kit already is both:

| Workflow step | Kit file              |
| ------------- | --------------------- |
| spec          | `<slug>-plan.md`      |
| tickets       | `<slug>-checklist.md` |
| decision log  | `decisions.md`        |
| entry point   | `README.md`           |

The kit directory slug is the task's identity — it is also the branch name and the `refs:` footer on
every commit. See `.claude/rules/workflow.md` § the kit slug is the traceability spine.

## What goes in each kit file

Kits created **on or after 2026-09-19** follow the templates below. Earlier kits are left exactly as
written — see "Finished initiatives are a record, not a spec". Do not retrofit one.

Sizing gates all of this. Which documents a kit owes follows the sizing table above:

| Size                  | plan | checklist | decisions | README | Acceptance criteria live in |
| --------------------- | ---- | --------- | --------- | ------ | --------------------------- |
| Multi-week initiative | yes  | yes       | yes       | yes    | the plan                    |
| 2–5 days              | yes  | yes       | yes       | yes    | the plan                    |
| Small sweep           | no   | yes       | yes       | yes    | **the checklist**           |
| Single commit         | no   | no        | one entry | no     | — no spec is owed           |
| Ephemeral             | no   | no        | no        | no     | — no spec is owed           |

**A small sweep has no plan**, so it has no AC IDs to reference — it states its acceptance criteria
directly in the checklist's `## Acceptance` section. The never-restate rule below binds only when a
plan exists to be restated from. A small sweep also has no Definition of Ready: its checklist is the
thing approved.

Within a full kit, **acceptance criteria and open questions are unconditional**. Rollback, security,
observability and accessibility fire on their triggers. Everything else is shape, not ceremony.

### `<slug>-plan.md` — the spec

```markdown
# <Title> — Plan

- **Status:** Draft | Ready | Approved | In progress | Done
- **Appetite:** <N days> — past that, cut scope rather than extend
- **Date:** YYYY-MM-DD

## Context and goals

Why this exists and what changes when it lands.

## Acceptance criteria

MANDATORY. Observable and checkable. Each gets an ID that threads to the checklist, the tests,
and the PR body, and a `Why:` naming what it serves — a token, a WCAG criterion, an incident, a
design frame. Without it nothing connects AC-3 back to why anyone wanted AC-3, which is the
trace-back this whole contract exists for. "Because it looks better" is not a Why.

Keep each one **singular**. A frontend requirement hides a matrix — theme x component state x
breakpoint — so "the theme toggle works" can be two thirds true while the suite shows green.
Split by state, or state the scope in the criterion itself.

- **AC-1** — Theme toggle persists across reload and respects `prefers-color-scheme`.
  _Why:_ returning users landing in the wrong theme was the original bug report.
- **AC-2** — No component reads a hard-coded color; all resolve through tokens.
  _Why:_ token indirection is what makes the dark-mode switch a one-place change.

## Open questions

MANDATORY heading; an empty list is a valid answer, a missing heading is not. Use
`[NEEDS CLARIFICATION]` inline wherever the ambiguity actually sits, so it greps.

- [ ] **Q-1** — Does the toggle need a system-default third state, or just light/dark?

## Out of scope

What this deliberately does not do.

## Decisions expected

Forks already visible. Each becomes a `D-NN` in `decisions.md` when settled — at the moment it
is settled, never backfilled.

## Phases

### Phase 0 — <name>

Enough detail that the checklist writes itself.

## Risks and trade-offs

## Rollback

CONDITIONAL — required when a deploy or destructive data change is in scope.

## Security and data

CONDITIONAL — required when the change touches a trust boundary, an auth or routing boundary,
secrets, or personal data. The middle two overlap the re-size triggers in
`.claude/rules/workflow.md` § Task flow; the others are narrower and specific to this section.
Public props and dependency bumps force a re-size without being security-relevant, so they do
not fire this one.

## Observability

CONDITIONAL — what you would look at when this breaks at 2am. The four postmortems under
`docs/internal/incidents/` cover routing, auth and caching; their causes recur.

## Accessibility

CONDITIONAL — required for user-facing UI. Contrast, keyboard path, focus order. See
`.claude/rules/accessibility.md`.

**Cite WCAG criteria by number; never paraphrase one.** The number is normative and verifiable
— a hand-written restatement is neither, and it drifts. Cite the criterion even where
`accessibility.md` states only a level: it cites 2.5.3 and 2.5.7 by number but gives the
24x24 pointer target as "WCAG 2.2 AA", and a plan citing 2.5.8 Target Size (Minimum) is the more
useful of the two.

**Record known deviations here rather than leaving them implicit.** Each one names the criterion
violated, why it is accepted, and what would reverse it. A recorded deviation is engineering; an
unrecorded one reads as an oversight to whoever finds it next. A contrast deviation, for
instance, is a deviation from `accessibility.md`'s rule that contrast meets AA against the
semantic tokens in both themes — cite that rule and WCAG 1.4.3, not a paraphrase of either.

## Success metrics

OPTIONAL. If you state one, name where it is read. Otherwise it is a wish, not a metric. If it is
genuinely tracked, it belongs in a tracker file and outlives the kit.

## References
```

A plan's `Status` is its own progression and has nothing to do with the `Proposed` / `Accepted` /
`Superseded` statuses below, which belong to decision records.

### `<slug>-checklist.md` — the tickets

```markdown
# <Title> — Checklist

## Phase 0 — <name>

Items name the artifact, not the intent. "`FormField`, `InputChrome`, `TextField` normalized;
`FieldShell` removed" beats "normalize input primitives" — the first is verifiable a year later.

- [ ] `path/to/file.tsx` — what it must contain

## Discovered

Work found mid-implementation. Two outcomes only, and naming it forces the choice:

- [ ] Found: <thing> → in scope, added to Phase N
- [ ] Found: <thing> → out of scope, filed as `docs/internal/todos/YYYY-MM-DD-todo-<slug>.md`

If a discovery changes a component's public props, a data contract, a dependency, or an
auth/routing boundary, stop and re-size per `.claude/rules/workflow.md`.

## Acceptance

Reference the plan's AC IDs. Do NOT restate the criteria — they drift silently. Name the
**method** as well as the artifact: "a machine checked it", "I checked it" and "nobody checked
it" are three different states, and a column of `jest-axe` references reads as coverage while
leaving roughly two thirds of real issues unverified — see `.claude/rules/accessibility.md`
§ Current tooling gaps.

- [ ] AC-1 — jest-axe · `src/components/__tests__/ThemeToggle.int.test.tsx`
- [ ] AC-4 — **manual keyboard pass** · evidence recorded below

## Gates

Acceptance proves the thing was built; gates prove nothing else broke. Both, separately. Tick them
by name; the commands live in the gate table in `.claude/rules/workflow.md`
§ Gates are named, not asserted, and `/pre-push` runs them in CI's order. The triggers are
inline here because they decide whether a box applies at all.

- [ ] lint
- [ ] css lint — when styles changed
- [ ] typecheck
- [ ] format
- [ ] unit tests — plus coverage when coverage is in scope
- [ ] integration — when data access or routing changed
- [ ] spec drift — when the backend contract or `src/types/dtos/**` is in play
- [ ] build
- [ ] e2e — before a release, or when a user-facing flow changed end to end
```

### `decisions.md` — one entry

```markdown
## D-01 — <decision in one line>

- **Status:** Proposed | Accepted | Superseded by D-NN
- **Date:** YYYY-MM-DD

**Context.** What forced a choice.
**Decision.** What was chosen.
**Options considered.** What was rejected, and why.
**Consequences.** What this costs.

<!-- on promotion, this banner is added directly under the heading. The body stays. -->

> **Promoted to [ADR-NNNN](../../../explanation/decisions/adr-NNNN-<slug>.md)** in the flat
> registry. That record is the durable copy; this entry is the original log.
```

**Promotion adds a banner; it never removes the body.** All 14 promoted entries in
`components-overhaul/decisions.md` keep their full text under exactly that blockquote. Replacing a
body with a pointer would destroy the original log, which is what the immutability rule forbids.
`lakira-backend` does the opposite — see "What differs from `lakira-backend`, on purpose" below.

`Status` carries the same meaning here as in the registry — see "Decisions and ADRs" below.

### `README.md` — the entry point

A pointer, not a summary of the other three files.

```markdown
# <Title>

**Status:** <what phase, what is blocking>
**Slug:** `<slug>` · **Branch:** `feature/<slug>`

- [Plan](<slug>-plan.md) — goals, acceptance criteria, phases
- [Checklist](<slug>-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries; promoted ones point at the ADR registry
```

### What differs from `lakira-backend`, on purpose

This kit format is shared with `lakira-backend`: same documents, same mandatory sections, same
`D-NN` numbering, same Definition of Ready. Four things differ deliberately, each matching its own
repo's history. **Do not unify them.**

| Difference        | Here                                              | `lakira-backend`          |
| ----------------- | ------------------------------------------------- | ------------------------- |
| Gate commands     | this repo's scripts                               | that repo's scripts       |
| Branch prefix     | `feature/`                                        | `feat/`                   |
| Promotion style   | entry keeps its body, gains a banner              | entry collapses to a stub |
| Accessibility     | a conditional plan section                        | no equivalent             |

The branch prefix matches real history — 7 merged `feature/` branches here alongside 8 `fix/`,
5 `docs/`, 4 `chore/` and 3 `refactor/`; `feature/` was never used in `lakira-backend`. Per-repo
consistency with real history beats cross-repo uniformity.

**The promotion row is the one that would do real damage if "fixed".** Collapsing entries to stubs
here would destroy 14 original logs, in a repo whose
[registry README](../../docs/explanation/decisions/README.md) states that kit's `decisions.md`
remains the full working log. Same reasoning as "Finished initiatives are a record, not a spec"
below: the record is what happened, and rewriting it to match a newer layout falsifies it.

## Definition of Ready

The task flow in `.claude/rules/workflow.md` pauses for approval after the checklist. This is what
makes a plan approvable — stated here once, never copied into a plan:

- [ ] Acceptance criteria are stated, and each is checkable
- [ ] No unresolved `[NEEDS CLARIFICATION]` markers remain
- [ ] Out of scope is stated
- [ ] Appetite is set
- [ ] Decisions expected are listed
- [ ] Rollback is stated, if a deploy or destructive change is in scope

`grep -r 'NEEDS CLARIFICATION' docs/internal/initiatives/<slug>/` is the mechanical half.

A small sweep has no plan and so no Definition of Ready — its checklist is the thing approved.

## Decisions and ADRs

A kit's `decisions.md` is a **working log**. A decision that constrains how the system is built — and
would still matter to someone who never saw the initiative — is promoted to
`docs/explanation/decisions/` as its own numbered record, with a pointer left behind.

Decisions that only coordinate the work (phase order, which sweep runs first) stay in the kit. Of the
76 entries in the components-overhaul log, 14 were promoted; the rest were per-component hardening
and test-coverage notes.

Statuses are `Proposed` / `Accepted` / `Superseded`, and a record is **immutable** — supersede it
with a new one rather than editing it. `Proposed` means written down and *not implemented*.

**Two numbering spaces, two prefixes.** Kit-local decisions are `D-01`, `D-02`; the registry keeps
`ADR-NNNN`. A promotion therefore reads `D-03 → ADR-NNNN`, taking the next free number from the registry. Both were written `ADR-NNN` before
2026-09-19, which made every promotion read as one number promoted to another. Existing entries are
immutable — do not renumber them; only new entries use `D-NN`.

See [`docs/explanation/decisions/README.md`](../../docs/explanation/decisions/README.md) for the
format and the next free number.

## Write the decision when it is made, not at the end

A `decisions.md` entry is written **at the moment the decision is taken** — during planning for the
forks already visible, mid-implementation the moment an unplanned one is settled. Never backfilled
at the end of the task.

A record written after the code works is a rationalization. The rejected options and the reason for
rejecting them are exactly what is wanted when someone traces the headache back months later, and
they are exactly what is forgotten first.

The final `docs` step of the task flow is for reference pages, how-to guides, and generated
artifacts. It is **not** the slot for backfilling decisions.

Promotion runs on the opposite clock. Promote at the **end** of the task, against the criteria above
— by then it is clear whether the decision survived implementation, and a record promoted before
that is one you would have to supersede rather than edit.

## Finished initiatives are a record, not a spec

An initiative doc describes a specific rollout and is left factually as-written once complete. Do not
rewrite a finished initiative doc to match today's layout — that falsifies the record. Add a pointer
instead.

## Writing rules

- Every doc must answer a specific question for a specific reader. If you cannot name the reader and
  their question, the doc should not exist.
- Header carries purpose and owner/DRI where one applies. **No YAML frontmatter in `docs/`** — ADRs
  and plans use bold key/value lines under the H1.
- kebab-case filenames; date-prefix anything chronological (`YYYY-MM-DD-*`). `README.md` is each
  folder's entry point.
- Backticked path **mentions** are repo-root-relative (`docs/reference/commands.md`). Markdown
  **links** are relative (`../reference/commands.md`). Relative links break when a file is lifted out
  of its folder — that is how 26 links broke during the Diátaxis restructure.
- **Link, never duplicate.** See `.claude/rules/commands.md` for why.
- Never reformat or condense files under `docs/internal/audits/**` — they are structured records, and
  condensing them destroys required detail.

## Before writing anything

1. Does a document already cover this? Update it. Never create a second copy — duplicated content
   drifts, and the drift is silent.
2. Check the placement table above before choosing a folder.
3. If you add a top-level folder under `docs/`, update `docs/README.md` in the same change.
