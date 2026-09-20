# Workflow

## Plan mode default

Use plan mode for any non-trivial task — 3+ steps, or anything involving an architectural decision. Explore first, then plan, then execute.

If something goes sideways mid-execution, **stop and re-plan immediately**. Do not push through a plan that has stopped matching reality.

## Task flow

One ordering for non-trivial work. Each step leaves a trace the next step can find.

```
plan → size the kit → branch → plan.md → checklist.md → ⏸ approve
     → implement (+ decisions.md entry at each decision) → gates → review → fix
     → docs → hand over commit → hand over PR
```

Sizing is the kit table in `.claude/rules/documentation.md`. **Say which size you picked before
starting.** A single-commit fix that demands a plan, a checklist, and an ADR gets bypassed once and
then always — the single-commit and ephemeral rows are the escape hatch, and using them is correct.

If a small sweep turns out to change a component's public props, a data contract, a dependency, or
an auth/routing boundary, stop and re-size rather than carrying on under the lighter rules.

This ordering is the whole of it. Do not run a second, parallel checklist alongside it.

## The kit slug is the traceability spine

Every artifact of a task carries the same slug, so a line of code can be walked backwards to the
decision that put it there.

```
colorfield-tokenization
  → kit      docs/internal/initiatives/colorfield-tokenization/
  → plan     …/colorfield-tokenization-plan.md
  → tickets  …/colorfield-tokenization-checklist.md
  → log      …/decisions.md
  → ADR      docs/explanation/decisions/adr-NNNN-<slug>.md, linking back to the kit
  → branch   feat/colorfield-tokenization
  → commits  feat(ui): tokenize ColorField  …  refs: colorfield-tokenization
  → PR       body links the kit README and every ADR the work promoted
```

Kit dir, plan filename, checklist filename, and branch name use the **same slug**. A promoted ADR
links back to the kit; the kit's `decisions.md` entry links forward to the ADR. Both directions, or
the artifacts exist without being able to find each other — which is the failure this convention
exists to prevent.

Ephemeral todos are exempt: the dated filename is their identity.

## Stop after the checklist

Plan plus checklist is the cheapest place to discover the wrong thing is being built. Present both,
wait for approval, then run implementation through to review without further check-ins unless
something forces a re-size.

What makes a plan approvable is the Definition of Ready in `.claude/rules/documentation.md` — chiefly
that acceptance criteria are stated and no `[NEEDS CLARIFICATION]` marker is left unresolved.

## Branching

**Always branch off `dev`, never off `main`.** Promotion is `feat/* → dev → main`. This repo has no `staging` branch — do not reference one.

The prefix is a Conventional Commit type — `feat/`, `fix/`, `docs/`, `chore/`, `refactor/` — so the branch, the commit type and the PR title are one vocabulary. `feature/` was the one holdover and was retired on 2026-09-20. The 6 merged `feature/` branches keep their names: history is immutable, and mixed history is the normal state after a convention changes.

Fetch and pull first, or the branch starts from a stale `dev`:

```bash
git fetch origin dev && git switch dev && git pull --ff-only origin dev
git switch -c feat/<slug>
```

If `dev` has uncommitted local changes that the pull would conflict with, stop and tell the user — do not stash, reset, or force the pull.

Every subagent prompt for implementation work must say `branch off dev`.

`.claude/hooks/guard-branch.sh` blocks edits while `main` is checked out and warns while `dev` is. Neither branch has server-side protection, so that hook is the only enforcement — treat it as a real boundary, not a formality.

## Commit and PR ownership

**Claude does not run `git commit`, `git push`, `git merge`, `git rebase`, or `gh pr create`.** Only the user does these, manually. This is enforced twice: in `.claude/settings.json` `permissions.deny` and in `.claude/hooks/validate-bash.sh`.

If the user says "commit it," surface the message and the exact commands instead of running them.

End every completed task with a ready-to-use PR message:

- Title in Conventional Commits form (`feat(scope): …`, `fix(scope): …`, `docs: …`, `chore(scope): …`).
- Body covering what changed and why, and how it was verified.
- Links to the kit README and every ADR the work promoted.

Note that this repo's commit history is only partly conventional — the older half is free-form (`update …`, `add …`), and there is no commitlint or husky. Write conventional messages anyway; that is the direction the recent history moved in.

## Gates are named, not asserted

**Never mark a task complete without proving it works.** Run the gates and report each **by name**
with its result. A gate that was skipped is reported as skipped, not omitted. If a gate fails, say so
and paste the failure. "Tests pass" is not a status.

| Gate         | Command                                            | When                                    |
| ------------ | -------------------------------------------------- | --------------------------------------- |
| lint         | `npm run lint`                                     | always                                  |
| css lint     | `npm run lint:css`                                 | always; the gate that matters on styles |
| typecheck    | `npm run typecheck`                                | always                                  |
| format       | `npm run format`                                   | always (`prettier --check .`)           |
| unit tests   | `npm run test:unit` (`npm run test:unit:ci` + `npm run coverage:check` when coverage is in scope) | always |
| integration  | `npm run test:integration`                         | data access or routing changed          |
| spec drift   | `npm run api:spec:check` / `npm run api:types:check` | the backend contract or `src/types/dtos/**` is in play |
| build        | `npm run build`                                    | always                                  |
| e2e          | `npm run test:e2e`                                 | before a release, or a user-facing flow changed end to end |

`/pre-push` runs these in CI's own order and is the canonical local sequence — use it rather than
inventing an order here.

**Every gate in this table runs in CI**, `format` included as of 2026-09-20 — it is the last step of
the `checks` job, so a formatting failure cannot mask a lint or type error in the same run. Nothing
here depends on anyone remembering: `.claude/hooks/format-on-edit.sh` only reformats files an agent
edits, which is why the repo reached 93 unformatted files before the gate existed.

For anything touching routing, auth, or caching, check `docs/internal/incidents/` first — four logged postmortems cover exactly those areas, and their causes recur.

The bar: would a staff engineer approve this as-is?

## Review before docs

Review can invalidate an implementation choice, and documentation written before that lands gets
written twice. Order is gates → review → fix → docs.

## Subagents

Use subagents to keep the main context clean. One task per subagent. Give each one enough context that it does not have to re-derive what you already know — file paths, the trace you followed, the constraint you are working under.

Available in this repo: `code-reviewer`, `test-writer`, `doc-writer`, `ci-debugger`.

## Self-improvement loop

After **any** correction from the user, append the pattern to `.claude/lessons.md` using the format at the top of that file: `**Mistake**` / `**Rule**` / `**Why**`.

Read `.claude/lessons.md` at session start. Iterate on it until the mistake rate drops. A lesson that stabilises — one that keeps proving true — should be promoted into the relevant `.claude/rules/*.md` file and removed from the lessons log.

## Ephemeral todos

Work that sizes to the ephemeral row gets one `docs/internal/todos/YYYY-MM-DD-todo-<kebab-title>.md` with checkable items instead of a kit. Check items off as they land, and append a `## Status` review section to the **same** file when done.

Todo files are tracked in git but user-controlled — deletable without a follow-up PR. If one grows into a real initiative, promote it to a kit under the relevant domain folder (see `.claude/rules/documentation.md`).

## Core principles

- **Simplicity first.** The smallest change that fully solves the problem.
- **No laziness.** Fix root causes, not symptoms. No temporary patches presented as fixes.
- **Minimal impact.** Do not widen scope silently. If you find a second problem, name it and finish the first.
- **Demand elegance, in balance.** Match the surrounding code's idiom. Elegance that requires rewriting three neighbouring files is not elegance here.
