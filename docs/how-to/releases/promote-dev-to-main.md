# Promote `dev` to `main`

**For:** the maintainer cutting a release. **Decision:**
[ADR-0041](../../explanation/decisions/adr-0041-main-is-reset-onto-dev-and-protected-by-a-release-gate.md).

`main` is the release branch. It changes only by a pull request from `dev`, merged with a merge
commit once "CI passed" is green. The ruleset "main (release gate)" enforces the last two; the
first is this page's rule, since a ruleset cannot name a pull request's head branch.

## Before promoting

- `dev`'s latest push run of `frontend-ci` is green:
  `gh run list --branch dev --limit 1`.
- The release checklists apply: [release checklist](release-checklist.md),
  [accessibility](a11y-release-checklist.md), [performance](performance-release-checklist.md).
- The two stack suites run nightly, not on a pull request. Check the last `frontend-stack-e2e`
  run, or run `npm run test:e2e:stack` and `npm run test:e2e:csp:stack` locally.

## Promote

1. Open the pull request, always naming both branches:

   ```bash
   gh pr create --base main --head dev --title "chore(release): promote dev to main"
   ```

   The body lists the pull requests merged into `dev` since the last promotion:
   `git log --first-parent --oneline origin/main..origin/dev`.

2. Wait for "CI passed" on the pull request.
3. Merge with **Create a merge commit**, the only method the ruleset offers:

   ```bash
   gh pr merge <number> --merge
   ```

   Do not delete `dev` when GitHub offers to. The ruleset on `dev` refuses it in any case.

4. Confirm the promoted `dev` commit is now in `main`, before anything else merges into `dev`:
   `git fetch origin && git merge-base --is-ancestor origin/dev origin/main && echo ok`.

## When something is wrong on `main`

There is no hotfix branch off `main`. Fix it on `dev` with an ordinary pull request (a `git revert`
of the bad merge when the fix is to undo it), then promote again. Every change reaching `main`
through `dev` is what keeps each promotion's diff exactly what `dev` gained.

## What not to do

- **Squash or rebase a promotion.** The ruleset offers neither. Either would put copies of `dev`'s
  commits on `main`, and the next promotion would conflict with them.
- **Merge `main` back into `dev`.** It is never needed: `main` holds only promotion merge commits,
  which add nothing to `dev`.
- **Push to `main`.** The ruleset refuses a direct push, a force push and deletion, with no
  bypass. In an emergency, switch the ruleset off under Settings > Rules, a visible act, and back
  on afterwards.

Versioning a release (tags, a changelog, GitHub releases) is not decided yet: register row F-75.
