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

## Prepare the release

A promotion is tagged only when it carries a new version
([ADR-0045](../../explanation/decisions/adr-0045-releases-are-versioned-on-dev-and-tagged-on-main.md)).
Bump it on `dev` first, in an ordinary pull request:

1. On a branch cut from an up-to-date `dev`, run `git fetch origin`, then
   `npm run release:prepare -- minor` (or `major`, `patch`, or an explicit `x.y.z`). It bumps
   `package.json` and `package-lock.json` and adds a `CHANGELOG.md` section listing the commits
   `dev` holds and `main` does not. It commits nothing.
2. Read the new section. The script lists commit subjects as written; edit the section by hand if
   one needs it, but keep its `## <version> - <date>` heading.
3. Commit as `chore(release): <version>`, open the pull request into `dev`, and merge it once "CI
   passed" is green. Merge nothing else into `dev` before promoting, or the changelog misses it.

Skip this section to promote without a new version: the promotion then tags nothing.

## Promote

1. Open the pull request, always naming both branches:

   ```bash
   gh pr create --base main --head dev --title "chore(release): promote dev to main"
   ```

   The body lists the pull requests merged into `dev` since the last promotion:
   `git log --first-parent --oneline origin/main..origin/dev`.

2. Wait for "CI passed" on the pull request. It is matched by commit, so `dev`'s own push run on
   the same commit can satisfy it before the pull request's run finishes. That is safe for a
   promotion, since the merge has the same files as `dev`, but let the pull request's run finish
   too: `gh pr checks <number> --watch`.
3. Merge with **Create a merge commit**, the only method the ruleset offers:

   ```bash
   gh pr merge <number> --merge
   ```

   Do not delete `dev` when GitHub offers to. The ruleset on `dev` refuses it in any case.

4. Confirm the promoted `dev` commit is now in `main`, before anything else merges into `dev`:
   `git fetch origin && git merge-base --is-ancestor origin/dev origin/main && echo ok`.

5. If the promotion carried a new version, confirm the `release` workflow tagged it:
   `gh run list --workflow release.yml --limit 1`, then `gh release view v<version>`. The tag
   points at the promotion's merge commit, and the release notes are the `CHANGELOG.md` section.
   Record the run on the promotion pull request.

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
- **Tag a release by hand, or push a tag.** The `release` workflow makes the tag from
  `package.json`'s version and skips a version whose tag exists. A tag made by hand first would
  make it skip that version, and no release would be created.
