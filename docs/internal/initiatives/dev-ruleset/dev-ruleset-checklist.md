# dev ruleset — Checklist

Register row F-24. `dev` had no branch protection, so "CI passed" guarded nothing
([D-01](decisions.md), promoted to ADR-0039). `main` is left to F-25.

## Ruleset

- [x] `.github/rulesets/dev.json`: "dev (integration gate)" on `refs/heads/dev`, active, no
      bypass. Rules: `deletion`, `non_fast_forward`, `pull_request` (0 approvals, all three
      merge methods), and `required_status_checks` with "CI passed" (integration 15368, not
      strict)
- [x] Applied 2026-10-22 by posting the file to the repository's rulesets endpoint with
      `gh api --method POST`, which returned id 25639339
- [x] Read back: GitHub added `required_reviewers: []` and
      `require_extra_approval_for_unattributed_changes: true`, which the file now writes out.
      The file and the live ruleset then compare equal, field by field

## Docs and rules

- [x] ADR-0039 and its registry row; D-01 carries the promotion banner
- [x] `docs/reference/ci-pipeline/workflows.md`: the gate paragraph, and a "Branch rules"
      section with the ruleset, how to read it and how to roll it back
- [x] `.claude/rules/workflow.md` § Branching, and the comment in `.claude/hooks/guard-branch.sh`:
      `dev` is enforced server-side, and the hook is the only guard on `main`
- [x] `.github/workflows/test.yml`: the gate job's comment names the ruleset. Comment only;
      written in the scratchpad and copied into place
- [x] `2026-08-17-todo-claude-code-setup.md`: the branch-protection box ticked, with `main`
      pointed at F-25
- [x] Register: F-24 closed with #140; F-25 says `main`'s ruleset comes with its fix; "As of"
      moved to `d4cdcf8`; the register README's status line

## Discovered

- [x] Found: GitHub stores two `pull_request` parameters the request did not send → in scope,
      written into the file so it matches the live ruleset

## Acceptance

- [x] An active ruleset on `refs/heads/dev` with no bypass, with no deletion and no force push,
      a pull request required to merge, and "CI passed" from GitHub Actions required. _Why:_
      F-24; the gate is what ADR-0036 built for this. · **Read back** with
      `gh api repos/dimaszisby/lakira-frontend/rulesets/25639339`, and
      `gh api repos/dimaszisby/lakira-frontend/rules/branches/dev` lists the four rules from
      ruleset 25639339, with "CI passed" as the required check
- [x] This PR's merge state is `BLOCKED` while "CI passed" is pending and `CLEAN` once it is
      green. _Why:_ the read-back shows the rule exists; this shows it binds. ·
      **Checked, met in part.** `gh pr checks 140 --required` lists exactly "CI passed", which
      passed on run 39784707988. GitHub's rule-suite log for the merge push to `dev` (`d4cdcf8`
      to `89d21dc`, rule suite 4664732616) shows all four rules of "dev (integration gate)"
      evaluated, `active`, each `pass`. The merge state was not read while the run was pending,
      because #140 merged first, so `BLOCKED` was not observed: only that the ruleset applied to
      this PR and to its merge.
- [x] `main` is unchanged. _Why:_ the owner's choice; O-08 stays open. ·
      `gh api repos/dimaszisby/lakira-frontend/rules/branches/main` returns no rules
- [x] No doc outside historical records still says `dev` has no server-side protection. _Why:_ a
      stale "the hook is the only enforcement" misleads the next reader. · `grep` for "server-side
      protection", "branch protection", "no rulesets" and "protected=false"; what is left is in
      dated todos, the 08-18 handoff and finished kits, which are records

## Gates

Run 2026-10-22 on Node 24.21.0. No application code changed.

- [x] lint
- [x] typecheck
- [x] format
- [x] unit tests, including `register-todos` and `commands-doc`
- [x] build
- [x] spec drift and `security:audit`
- [x] actionlint on `test.yml`
- [ ] css lint, integration, e2e, e2e (csp), e2e (stack) and e2e (csp, stack): skipped, since
      no application code, style or contract changed
