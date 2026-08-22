# Workflow

## Plan mode default

Use plan mode for any non-trivial task — 3+ steps, or anything involving an architectural decision. Explore first, then plan, then execute.

If something goes sideways mid-execution, **stop and re-plan immediately**. Do not push through a plan that has stopped matching reality.

## Branching

**Always branch off `dev`, never off `main`.** Promotion is `feature/* → dev → main`. This repo has no `staging` branch — do not reference one.

```bash
git switch dev && git switch -c feature/<slug>
```

Every subagent prompt for implementation work must say `branch off dev`.

`.claude/hooks/guard-branch.sh` blocks edits while `main` is checked out and warns while `dev` is. Neither branch has server-side protection, so that hook is the only enforcement — treat it as a real boundary, not a formality.

## Commit and PR ownership

**Claude does not run `git commit`, `git push`, `git merge`, `git rebase`, or `gh pr create`.** Only the user does these, manually. This is enforced twice: in `.claude/settings.json` `permissions.deny` and in `.claude/hooks/validate-bash.sh`.

If the user says "commit it," surface the message and the exact commands instead of running them.

End every completed task with a ready-to-use PR message:

- Title in Conventional Commits form (`feat(scope): …`, `fix(scope): …`, `docs: …`, `chore(scope): …`).
- Body covering what changed and why, and how it was verified.
- The `Co-Authored-By` trailer.

Note that this repo's commit history is only partly conventional — the older half is free-form (`update …`, `add …`), and there is no commitlint or husky. Write conventional messages anyway; that is the direction the recent history moved in.

## Verification before done

**Never mark a task complete without proving it works.** Run the gates, read the output, report what actually happened. If tests fail, say so and paste the failure. If a step was skipped, say which and why.

The bar: would a staff engineer approve this as-is?

For anything touching routing, auth, or caching, check `documents/incidents/` first — four logged postmortems cover exactly those areas, and their causes recur.

## Subagents

Use subagents to keep the main context clean. One task per subagent. Give each one enough context that it does not have to re-derive what you already know — file paths, the trace you followed, the constraint you are working under.

Available in this repo: `code-reviewer`, `test-writer`, `doc-writer`, `ci-debugger`.

## Self-improvement loop

After **any** correction from the user, append the pattern to `.claude/lessons.md` using the format at the top of that file: `**Mistake**` / `**Rule**` / `**Why**`.

Read `.claude/lessons.md` at session start. Iterate on it until the mistake rate drops. A lesson that stabilises — one that keeps proving true — should be promoted into the relevant `.claude/rules/*.md` file and removed from the lessons log.

## Task management

For any multi-step task:

1. Plan it.
2. Write `documents/todos/YYYY-MM-DD-todo-<kebab-title>.md` with checkable items.
3. Verify the plan against the code before executing.
4. Track progress by checking items off as they land.
5. Explain what changed and why.
6. Append a `## Status` review section to the **same** todo file when done.
7. Capture any corrections in `.claude/lessons.md`.

Todo files are tracked in git but user-controlled — deletable without a follow-up PR. If one grows into a real initiative, promote it to a kit under the relevant domain folder (see `.claude/rules/documentation.md`).

## Core principles

- **Simplicity first.** The smallest change that fully solves the problem.
- **No laziness.** Fix root causes, not symptoms. No temporary patches presented as fixes.
- **Minimal impact.** Do not widen scope silently. If you find a second problem, name it and finish the first.
- **Demand elegance, in balance.** Match the surrounding code's idiom. Elegance that requires rewriting three neighbouring files is not elegance here.
