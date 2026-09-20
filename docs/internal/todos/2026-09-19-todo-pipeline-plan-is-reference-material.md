# `cicd/pipeline-plan.md` is reference material wearing a plan's filename

**Purpose:** a 223-line description of CI jobs sits in an initiative kit as if it were a plan.
**Owner:** hardini
**Branch:** `docs/pipeline-plan-to-reference` off `dev`

## What is wrong

`docs/internal/initiatives/cicd/pipeline-plan.md` describes CI jobs, triggers and concurrency. That
is looked up, not read through — `docs/reference/` by the placement table in
`.claude/rules/documentation.md`. A plan states goals, acceptance criteria and phases; this file
states how the pipeline is configured, which outlives the initiative that produced it.

The filename is what disguises it. It was found while surveying kit contents for the kit document
templates, not by anyone looking for CI reference material — which is the cost: nobody looking up how
CI is wired would think to open an initiative kit.

## The fix

- [ ] Move the reference content to `docs/reference/` under the name someone would look it up by.
- [ ] Leave the kit linking to it. The kit is a record of a rollout and stays factually as-written —
      see `.claude/rules/documentation.md` § Finished initiatives are a record, not a spec.
- [ ] Update the inbound references: `docs/internal/todos/2026-02-16-todo-cicd-overview.md` and
      `docs/internal/todos/2026-02-18-tests-structure-overhaul.md` both name the current path.
- [ ] Check the content against the workflows before republishing it as reference — it dates from
      2026-02 and `.github/workflows/` has moved since.

## Out of scope

Not a rewrite of the pipeline docs, and not a change to CI. This is a placement fix plus a freshness
check on what gets moved.
