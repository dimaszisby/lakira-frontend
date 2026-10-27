# Workflow

## Plan mode default

Use plan mode for any non-trivial task — 3+ steps, or anything involving an architectural decision. Explore first, then plan, then execute.

If something goes sideways mid-execution, **stop and re-plan immediately**. Do not push through a plan that has stopped matching reality.

## Task flow

Every task starts from an issue (ADR-0044). One ordering for non-trivial work; each step leaves a
trace the next step can find.

```
issue #N → plan → size → branch → (2+ days: plan.md → checklist.md) → ⏸ approve
        → implement (+ a decision entry at each decision) → gates → review → fix
        → docs → hand over commit → hand over PR (Closes #N)
```

Sizing is the table in `.claude/rules/documentation.md`. **Say which size you picked before
starting.** Work under two days has no kit: the issue body is the plan and the pull request the
record. A single-commit fix that demands a plan, a checklist and an ADR gets bypassed once and
then always, so the light rows are the escape hatch, and using them is correct.

If work with no kit turns out to change a component's public props, a data contract, a
dependency, or an auth/routing boundary, stop and re-size rather than carrying on under the
lighter rules. An ADR is owed for those whatever the size.

No issue yet? File one first, from the form that fits (`.github/ISSUE_TEMPLATE/`), with its labels
(`docs/reference/issue-tracker.md`). Its creation is outward-facing, so confirm it with the owner.

This ordering is the whole of it. Do not run a second, parallel checklist alongside it.

## The issue number is the traceability spine

Every artifact of a task carries its issue number, so a line of code can be walked backwards to the
decision that put it there. This repository uses the tracker's ids, not slugs, as the task id.

```
#123 Tokenize ColorField
  → branch   feat/123-colorfield-tokenization
  → commits  feat(ui): tokenize ColorField  …  refs: #123
  → PR       body says "Closes #123" and links every ADR the work added
  → kit      docs/internal/initiatives/colorfield-tokenization/, only for 2+ days,
             with the issue in its README
  → ADR      docs/explanation/decisions/adr-NNNN-<slug>.md, linking back to the issue or the kit
```

A kit's dir, plan filename, checklist filename and branch slug are the same slug, and its README
names the issue. A promoted ADR links back to the kit; the kit's `decisions.md` entry links forward
to the ADR. Both directions, or the artifacts exist without being able to find each other, which is
the failure this convention exists to prevent.

Before 2026-10-25 the slug alone was the id, and branches and footers read `refs: <slug>`. Those
stay as they are.

## Stop after the checklist

Plan plus checklist is the cheapest place to discover the wrong thing is being built; without a
kit, the plan and the issue's acceptance criteria play that part. Present both, wait for approval, then run implementation through to review without further check-ins unless
something forces a re-size.

What makes a plan approvable is the Definition of Ready in `.claude/rules/documentation.md` — chiefly
that acceptance criteria are stated and no `[NEEDS CLARIFICATION]` marker is left unresolved.

## Branching

**Always branch off `dev`, never off `main`.** Promotion is `feat/* → dev → main`. This repo has no `staging` branch — do not reference one.

The prefix is a Conventional Commit type — `feat/`, `fix/`, `docs/`, `chore/`, `refactor/` — so the branch, the commit type and the PR title are one vocabulary. `feature/` was the one holdover and was retired on 2026-09-20. The 6 merged `feature/` branches keep their names: history is immutable, and mixed history is the normal state after a convention changes.

Fetch and pull first, or the branch starts from a stale `dev`:

```bash
git fetch origin dev && git switch dev && git pull --ff-only origin dev
git switch -c feat/<N>-<slug>
```

If `dev` has uncommitted local changes that the pull would conflict with, stop and tell the user — do not stash, reset, or force the pull.

Every subagent prompt for implementation work must say `branch off dev`.

`.claude/hooks/guard-branch.sh` blocks edits while `main` is checked out and warns while `dev` is. Since 2026-10-22 `dev` also has a server-side ruleset: no direct push, no force push, and a pull request merges only once "CI passed" is green (ADR-0039). Since 2026-10-23 `main` has one too, the release gate: the same rules, except that a pull request into `main` merges only as a merge commit (ADR-0041). `main` changes only by promotion from `dev`, never by a pull request from a feature branch — see `docs/how-to/releases/promote-dev-to-main.md`.

## Commit and PR ownership

**Claude does not run `git commit`, `git push`, `git merge`, `git rebase`, or `gh pr create`.** Only the user does these, manually. This is enforced twice: in `.claude/settings.json` `permissions.deny` and in `.claude/hooks/validate-bash.sh`.

If the user says "commit it," surface the message and the exact commands instead of running them.

End every completed task with a ready-to-use PR message:

- Title in Conventional Commits form (`feat(scope): …`, `fix(scope): …`, `docs: …`, `chore(scope): …`).
- Body covering what changed and why, and how it was verified.
- `Closes #N` for the issue it finishes, so the merge closes it, and links to the kit README, if
  there is one, and every ADR the work promoted.

**Handing over.** The commands are run verbatim, in a shell whose state you cannot see:

- **Never name a path that `git mv` or `git rm` already staged.** Both remove it from the working
  tree, so a later `git add` fails with `pathspec ... did not match` and stops the commit. Run
  `git add --dry-run` on each path before handing over (2026-09-15).
- **One path per `git add` line**, or a directory when all of it belongs to the task. A long line
  wraps on paste and the cut-off path runs as a command, silently; a dry run proves the command, not
  the paste (2026-09-24, #50).
- **No `cd` in a handover.** It outlives the command, and the next block runs in the wrong repo.
  Point the tool at the other repo instead (`git -C`, `docker compose -f`), and make the first line
  prove where it runs, such as a check of the branch. `!` means "run here" only at the Claude Code
  prompt; in plain zsh, `! cmd` inverts the exit status, so a failure reads as success (2026-09-29).

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
| e2e (stack)  | `npm run test:e2e:stack`                           | a signed-in page, the app layout, or an auth or token flow changed; before a release. Needs the local stack |
| e2e (csp)    | `npm run test:e2e:csp`                             | always when `e2e` runs; it is the only suite in which the browser enforces the Content Security Policy |
| e2e (csp, stack) | `npm run test:e2e:csp:stack`                   | the CSP, `src/proxy.ts`, the root layout or a script-emitting dependency changed; before a release. Needs the local stack |

`/pre-push` runs these in CI's own order and is the canonical local sequence — use it rather than
inventing an order here.

**Every gate in this table runs on every pull request except `e2e (stack)` and `e2e (csp, stack)`.**
`format` included as of 2026-09-20 — it is the last step of the `checks` job, so a formatting
failure cannot mask a lint or type error in the same run. For those gates nothing depends on anyone
remembering: `.claude/hooks/format-on-edit.sh` only reformats files an agent edits, which is why
the repo reached 93 unformatted files before the gate existed.

The two stack gates run in CI **nightly and on dispatch**, in their own workflow,
`frontend-stack-e2e` (`.github/workflows/stack-e2e.yml`), against a backend built from
lakira-backend `dev`. They do not run on a pull request, except one that changes that workflow
(kit `stack-suites-in-ci`, D-01, which supersedes `cypress-a11y-e2e` D-01). So a pull request can
still merge with a signed-in page broken, and the nightly run finds it the next morning. When
their trigger applies, run them locally and report them by name, or report them as skipped and
why. CI typechecks and lints their specs on every pull request either way.

**Two gates depend on state outside this repo:** `npm run security:audit` (new advisories) and
`npm run api:spec:check` (the backend's live spec). `api:types:check` compares local files only.
Rerun both immediately before every handover, whatever the change, since an earlier result is
stale. When both are red, fix them in one PR as separate commits: split, each PR fails the other's
gate (2026-10-01, #63).

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

**Agent memory runs the same loop.** `.claude/agent-memory/<agent>/` is tracked in git as of 2026-10-04. Each note is a heuristic and a pointer to the PR it came from, not a record of the findings. A new or changed note is part of the task's diff: read it before handing over, because a heuristic you disagree with is a bug the agent will repeat. One that keeps proving true is promoted into the relevant rules file and deleted from memory; one that is contradicted is deleted.

## Small work is an issue

Since 2026-10-25 nothing new goes in `docs/internal/todos/` (ADR-0044). Work too small for a kit is
an issue: its body holds the checkable items, and the pull request that closes it is the record.
The todo files that exist are dated records; the ones with open boxes name the issue that carries
them now. `src/__tests__/open-work-records.test.ts` fails the unit gate on a todo dated after the
freeze.

## What's next

When the user asks what to do next, with or without a merge to close out, **answer from GitHub
Issues**, ranked by the rule of kit `open-work-to-issues` D-02. Do not rank from memory of the
conversation.

```bash
gh issue list --state open --label state:ready --json number,title,labels
gh issue list --state open --json number,title,labels   # the gaps: what waits, and on whom
```

The rank: `state:ready` only; then the lowest `tier:`; then the lowest `sev:` (none sorts after
P3); then the lower number. The frozen debt register (`docs/internal/initiatives/frontend-debt-register/register.md`)
maps each old `F-NN` and `O-NN` to its issue. The backend keeps its own register (lakira-backend
#159); an issue that came from a row naming a `B-NN` keeps the id in its body.

- **Answer, then wait.** "What's next", with or without a merge, asks for a recommendation, not
  for work. Never start on the strength of an earlier approval; the owner says when, usually "Enter
  plan mode". If half-finished work for the item is in the tree, ask whether to keep it before
  touching anything (2026-10-21).
- **A merge is verified when the `dev` push run for its merge commit has finished,** not when the
  PR's run was green. If it is still running, say so and check it before the next task. A red
  `api-contract` on `dev` alone means "sync the contract", not "the merge broke something"
  (2026-09-27, #52). Before calling a run stuck, compare `date -u` with its `createdAt` and
  `updatedAt` (all UTC); during a GitHub Actions incident an in-progress status is not evidence
  (2026-10-01).
- **Recommend the first issue by the rank**, and cite it by number (`#160`). Read the analysis its
  body links, if any, before proposing a size.
- **Report any issue that outranks it but waits on someone** as a gap, with who it waits on
  (`state:owner`, `state:backend`, `state:upstream`). The owner's open questions are the
  `type:decision` issues; name the ones that block it.
- **Check the issue is still open and unclaimed** before recommending it: a merged PR that
  references it means it should have closed, and closing it comes first.
- **If `FINAL-AUDIT-SUMMARY.md` or `SAAS-BASE-CHECKLIST.md` orders things differently, say so**
  and name both. They record what a dated run asked for; the issues are where that is ranked
  against everything else.
- **A new finding, audit item or Notion record gets an issue**, labelled by the tracker reference,
  filed with the owner's confirmation in the handover of the PR that found it. A "Found, out of
  scope" line in a kit's checklist names its issue.
- **A fix PR says `Closes #N`.** A finding a dated audit must confirm says so in the issue, which
  stays open until the run does.
- **Re-rank only by the labels.** If the rank gives the wrong answer, change the issue's labels,
  or D-02 with a new decision entry.

## Core principles

- **Simplicity first.** The smallest change that fully solves the problem.
- **No laziness.** Fix root causes, not symptoms. No temporary patches presented as fixes.
- **Minimal impact.** Do not widen scope silently. If you find a second problem, name it and finish the first.
- **Demand elegance, in balance.** Match the surrounding code's idiom. Elegance that requires rewriting three neighbouring files is not elegance here.
