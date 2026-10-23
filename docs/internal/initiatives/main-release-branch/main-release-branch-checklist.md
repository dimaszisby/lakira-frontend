# main release branch — Checklist

Register row F-25, owner question O-08. `main` was one commit with no history in common with
`dev`, so nothing could be promoted to it, and it had no server-side rules
([D-01](decisions.md), promoted to ADR-0041).

## Reset

- [x] `de0db41` tagged `archive/main-initial-commit` on `origin` (owner, 2026-10-23)
- [x] `main` force-pushed to `dev`'s `c7ba8b7` with `--force-with-lease=refs/heads/main:de0db41`
      (owner, 2026-10-23), before any ruleset existed on `main`
- [x] Read back: `origin/main` is `c7ba8b7`, `git merge-base origin/main origin/dev` is `c7ba8b7`,
      and the tag resolves to `de0db41`. `frontend-ci`'s push run on `main`, 39912456144, passed

## Ruleset

- [x] `.github/rulesets/main.json`: "main (release gate)" on `refs/heads/main`, active, no bypass.
      Rules: `deletion`, `non_fast_forward`, `pull_request` (0 approvals, merge commits only),
      and `required_status_checks` with "CI passed" (integration 15368, not strict)
- [x] Applied 2026-10-23 by posting the file to the repository's rulesets endpoint with
      `gh api --method POST`, which returned id 25702940
- [x] Read back: the live ruleset equals the file field by field (both sorted with `jq -S` and
      diffed), and `gh api repos/dimaszisby/lakira-frontend/rules/branches/main` lists the four
      rules from ruleset 25702940

## Docs and rules

- [x] ADR-0041 and its registry row; D-01 carries the promotion banner
- [x] `docs/how-to/releases/promote-dev-to-main.md`: open, check, merge and verify a promotion;
      fixes go through `dev`; what not to do. `release-checklist.md` links to it
- [x] `docs/reference/ci-pipeline/workflows.md` § Branch rules: the `main` ruleset, the read-back
      commands for both, and an "In a fork" paragraph applying both files. The gate paragraph
      and the rename warning name both rulesets
- [x] `CONTRIBUTING.md` § Branch Model: the promotion rule and the rulesets as code
- [x] `.claude/rules/workflow.md` § Branching and the comment in `.claude/hooks/guard-branch.sh`:
      `main` is enforced server-side
- [x] `2026-09-24-todo-main-has-unrelated-history.md`: both open boxes ticked, `## Status` added
- [x] Register: F-25 closed with #146; O-08 removed; F-75 filed; "As of" moved to `c7ba8b7`; the
      register README's status line
- [x] Notion "FE and BE messages", Part 1: the record "`main` shares no history with `dev`; the
      frontend reset its own" and its Index row, Open, P2. Fetched again afterwards

## Discovered

- [x] Found: `main` and `dev` carried different licences, MIT and ISC → in scope, it decided
      against the one-time merge (D-01)
- [x] Found: `CONTRIBUTING.md` still said neither branch had server-side protection, stale since
      #140 → in scope, rewritten
- [x] Found: releases are not versioned (no tags, changelog or GitHub releases) → out of scope by
      the owner's choice, filed as register row F-75
- [x] Found: the backend's `main` has the same unrelated history, and its `main` ruleset requires
      signed commits → out of scope, filed on Notion Part 1 (the backend is read-only from here)

## Acceptance

- [x] `main` shares history with `dev`, and the old root is kept. _Why:_ F-25; a promotion pull
      request needs a merge base. · `git merge-base origin/main origin/dev` is `c7ba8b7`;
      `archive/main-initial-commit` resolves to `de0db41`
- [x] An active ruleset on `refs/heads/main` with no bypass blocks deletion and force pushes,
      requires a pull request merged with a merge commit only, and requires "CI passed" from
      GitHub Actions. _Why:_ ADR-0039 left `main` to this row; merge commits keep `dev`'s commits
      in `main` as they are. · Read back with
      `gh api repos/dimaszisby/lakira-frontend/rulesets/25702940`, equal to the file
- [ ] The first `dev` → `main` promotion merges under the ruleset, offering only a merge commit,
      and `git merge-base --is-ancestor origin/dev origin/main` holds afterwards. _Why:_ the
      read-back shows the rule exists; a promotion shows it binds. · **Not yet checked**: the
      owner's action after #146 merges
- [x] No live doc still says `main` is unprotected or that F-25 is open. _Why:_ a stale "the hook
      is the only enforcement" misleads the next reader. · `grep` for "F-25", "O-08",
      "server-side protection" and "only enforcement"; what is left is in dated todos, finished
      kits and ADR-0039, which are records

## Gates

Run 2026-10-23 on Node 24.21.0. No application code changed.

- [x] lint
- [x] css lint, run though no style changed
- [x] typecheck
- [x] format
- [x] unit tests, 1132, including `register-todos` and `commands-doc`
- [x] build
- [x] spec drift (`api:spec:check`, `api:types:check`) and `security:audit`, 0 vulnerabilities
- [x] `bash -n` on `.claude/hooks/guard-branch.sh`, whose comment changed
- [ ] integration, e2e, e2e (csp), e2e (stack) and e2e (csp, stack): skipped, since
      no application code, style or contract changed
