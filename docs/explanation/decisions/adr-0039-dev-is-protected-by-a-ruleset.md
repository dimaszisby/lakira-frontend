# ADR-0039 — `dev` is protected by a ruleset that requires "CI passed"

- **Status:** Accepted
- **Date:** 2026-10-22
- **Related:** fulfils [ADR-0036](./adr-0036-ci-runs-its-jobs-in-parallel-behind-a-gate.md)'s
  consequence that the gate guards nothing until it is a required check. `main` is left to
  register row F-25
- **Origin:** kit `dev-ruleset`, D-01 — [`decisions.md`](../../internal/initiatives/dev-ruleset/decisions.md); debt register row F-24

---

## Context

`dev` and `main` had no server-side branch protection and no rulesets (register F-24, first
recorded in `2026-08-17-todo-claude-code-setup.md`). A pull request could merge with
`frontend-ci` red, and anyone with push access could push to `dev` directly, force-push it or
delete it. The only guard was `.claude/hooks/guard-branch.sh`, which binds an agent and not a
person.

ADR-0036 gave `frontend-ci` one gate job, "CI passed", so that one check could be required. Every
first-parent commit on `dev` since September is a pull request's merge commit, and no workflow
pushes to it, so requiring a pull request changes nothing in how work lands.

`main` is still the repository's "Initial commit" and shares no history with `dev` (F-25). The
owner has not yet chosen between a reset and a one-time merge (O-08), and a rule against force
pushes would rule out the reset.

## Decision

The owner chose on 2026-10-22 to protect `dev` now and leave `main` to the change that settles
O-08, and to allow no bypass.

A repository ruleset, "dev (integration gate)" (id 25639339), is active on `refs/heads/dev` with
an empty bypass list. Its rules:

- **No deletion and no force push** (`deletion`, `non_fast_forward`).
- **Changes arrive by pull request** (`pull_request`), with no approval required: the repository
  has one maintainer. Merge, squash and rebase stay allowed, as in the repository's settings.
- **"CI passed" must succeed** (`required_status_checks`), from GitHub Actions
  (`integration_id` 15368), so a job of the same name from another app cannot satisfy it. The
  branch need not be up to date with `dev` first.

The ruleset as applied is kept in `.github/rulesets/dev.json`. GitHub filled in two defaults
(`required_reviewers: []`, `require_extra_approval_for_unattributed_changes: true`), and the
file writes them out so it matches what GitHub stores.

## Options considered

- **Classic branch protection.** The same rules, but one branch per call, with no bypass list as
  a first-class field and no JSON to export. lakira-backend uses rulesets, one per branch, and the
  two repositories read alike this way.
- **Require the branch to be up to date** (strict). Every merge would make every open pull
  request update and rerun. The `dev` push run already tests the merged result, and with one
  maintainer, pull requests seldom overlap.
- **Linear history.** This repository merges with merge commits; requiring linear history would
  change the merge method, which is not F-24's question.
- **An admin bypass.** It would let the owner merge past a red check, which makes the gate a
  default rather than a guarantee. In an emergency, the ruleset is switched off under Settings >
  Rules instead, a visible act.
- **Protect `main` now.** That rules out one answer to O-08, as above.

## Consequences

- **A pull request into `dev` cannot merge until "CI passed" is green,** and nobody, the owner
  included, can push to `dev` directly.
- **Renaming the gate job breaks every merge.** "CI passed" is matched by name; a rename must
  change the ruleset in the same pull request, before it merges.
- **The file and the live ruleset can drift.** Nothing compares them mechanically.
  `docs/reference/ci-pipeline/workflows.md` § Branch rules gives the command that reads the
  live one.
- **`main` stays unprotected** until F-25 is fixed. Its ruleset is part of that fix.
