---
paths:
  - documents/**
---

# Documentation

Canonical standard: [`documents/documentation/dev-documentation-guidelines.md`](../../documents/documentation/dev-documentation-guidelines.md). Index: [`documents/README.md`](../../documents/README.md). This file is the agent-facing summary — when the two disagree, the standard wins and this file is what needs fixing.

**Before writing any document:** check whether one already exists on the topic, then place it using the table below. Update `documents/README.md` if you add a top-level folder.

## Placement

Ask what the reader is *doing*, then place it. Never place by artifact name.

| The reader is… | Goes in |
|---|---|
| Learning a durable engineering rule that outlives any one rollout | `documents/documentation/engineering/<area>/` |
| Looking up the style system (colour, type, tokens) | `documents/documentation/style/` |
| Looking up the a11y or performance baseline | `documents/documentation/accessibility-guidelines.md`, `documents/documentation/performance-budget.md` |
| Looking up what a command does | `documents/documentation/commands.md` |
| Reading what the product is meant to do | `documents/documentation/product/` |
| Executing a time-bound rollout or migration | the domain folder — `documents/development/`, `documents/tests-plans-and-logs/`, `documents/ci-cd/` |
| Working a short-lived task list | `documents/todos/YYYY-MM-DD-todo-<kebab-title>.md` |
| Running a release or review by hand | `documents/checklists/` |
| Reading what broke and why | `documents/incidents/` |
| Reading a security audit | `documents/security/audit/<date>/` |
| Consuming the backend contract | `documents/openapi/` (generated — never hand-edited) |

**Two invariants:**

1. **One purpose per document.** If it both teaches and specifies, split it.
2. **Generated files are never hand-edited.** See the list in `documents/documentation/commands.md`.

## Two tracks

This repo does **not** use Diátaxis. It uses a two-track model:

- **Standards** (long-lived) live under `documents/documentation/`. They describe how the system should be built, in the present tense, and are kept current.
- **Initiatives** (time-bound) live in domain folders. They describe a specific rollout and are left factually as-written once complete. Do not rewrite a finished initiative doc to match today's layout — that falsifies the record. Add a pointer instead.

## Kit sizing

Match the paperwork to the work:

| Scope | Minimum files |
|---|---|
| Multi-week initiative | `README.md`, `<topic>-plan.md`, `<topic>-checklist.md`, `decisions.md`, plus tracker/incidents as needed |
| 2–5 days | `README.md`, `<topic>-plan.md`, `<topic>-checklist.md`, `decisions.md` |
| Small sweep | `README.md`, `<topic>-checklist.md`, one `decisions.md` entry |
| Single commit | One `decisions.md` entry with the SHA |
| Ephemeral | One `documents/todos/YYYY-MM-DD-todo-<slug>.md`. No kit. |

An ephemeral todo is tracked in git but user-controlled and deletable without a follow-up PR. Promote it to a kit if it grows into an initiative.

## Decisions and ADRs

A kit's `decisions.md` is a working log. Decisions that **constrain how the system is built** get promoted to a numbered ADR (this repo's existing scheme lives inside `documents/development/ui/components-overhaul/decisions.md`, referencing IDs like ADR-030), with a pointer left behind in the kit. Coordination-only decisions stay in the kit.

## Writing rules

- Every doc must answer a specific question for a specific reader. If you cannot name the reader and their question, the doc should not exist.
- Standard sections where they apply: Context, Scope, Risks, Rollback, Decision.
- Header carries purpose and owner/DRI.
- Cross-link with repo-root-relative paths.
- kebab-case filenames; `README.md` as each folder's entry point.
- **Link, never duplicate.** See `.claude/rules/commands.md` for why.
- Never reformat or condense files under `documents/security/audit/**` — they are structured records, and condensing them destroys required detail.
