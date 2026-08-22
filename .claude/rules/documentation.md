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

## Decisions and ADRs

A kit's `decisions.md` is a **working log**. A decision that constrains how the system is built — and
would still matter to someone who never saw the initiative — is promoted to
`docs/explanation/decisions/` as its own numbered record, with a pointer left behind.

Decisions that only coordinate the work (phase order, which sweep runs first) stay in the kit. Of the
76 entries in the components-overhaul log, 14 were promoted; the rest were per-component hardening
and test-coverage notes.

Statuses are `Proposed` / `Accepted` / `Superseded`, and a record is **immutable** — supersede it
with a new one rather than editing it. `Proposed` means written down and *not implemented*.

See [`docs/explanation/decisions/README.md`](../../docs/explanation/decisions/README.md) for the
format and the next free number.

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
