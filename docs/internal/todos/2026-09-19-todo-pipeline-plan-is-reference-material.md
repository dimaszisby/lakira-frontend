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

- [x] Move the reference content to `docs/reference/` under the name someone would look it up by:
      `docs/reference/ci-pipeline/workflows.md`, beside `backend-handoff.md`. Rewritten from the
      workflows, not copied: see "Freshness check" below.
- [x] Leave the kit linking to it: a banner at the top of `pipeline-plan.md`, which is otherwise
      unchanged, and a line in the kit README.
- [x] Update the inbound references: the reference lists in `2026-02-16-todo-cicd-overview.md` and
      `2026-02-18-tests-structure-overhaul.md` now name the new page first. The latter's
      `[x] Update pipeline-plan.md` item is a record of past work and is left as written.
- [x] Check the content against the workflows before republishing it as reference.

## Freshness check

Read against `.github/workflows/test.yml`, `performance.yml` and `package.json` on 2026-09-26. What
the plan said that no longer holds:

| Plan said                                | Now                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| Setup Node 20, in every job              | `node-version-file: .nvmrc` (24), ADR-0018                                       |
| `checks` is lint, lint:css, typecheck    | plus `format`, deliberately last                                                 |
| lint warnings are non-blocking           | `--max-warnings=0`: a warning fails                                              |
| `unit` uploads `lcov.info` to Codecov    | no Codecov; `coverage:check --strict` runs, coverage is an artifact only         |
| Secrets required: `CODECOV_TOKEN`        | no job reads a secret                                                            |
| `secret-scan` runs Gitleaks (the action) | a pinned gitleaks 8.30.1 binary, SHA-256 verified                                |
| no `api-contract` job                    | `api:spec:check` and `api:types:check`                                           |
| actions by tag                           | pinned by commit SHA, Dependabot                                                 |
| a list of 16 integration suites          | dropped: 19 suites today, and a list like that is stale the day a suite is added |

## Discovered

- [x] Found: `docs/reference/commands.md` § What CI runs and the playbook's "The workflows" section
      were two more copies of the same description, both missing `format` and `coverage:check` →
      in scope: each is now a short pointer to `workflows.md`, per "link, never duplicate".
- [x] Found: the playbook's failure table said "CI is on 20" → in scope, now points at `.nvmrc`.
      #52's search missed it because the line never says "Node 20".
- [x] Found: the playbook's `checks` reproduction omitted `npm run format` → in scope, added.

## Out of scope

Not a rewrite of the pipeline docs, and not a change to CI. This is a placement fix plus a freshness
check on what gets moved.

## Status

**Complete.** No CI change; this is placement and freshness only.
