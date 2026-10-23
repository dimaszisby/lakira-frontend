# ADR-0041 — `main` is reset onto `dev` and protected by a release gate

- **Status:** Accepted
- **Date:** 2026-10-23
- **Related:** completes [ADR-0039](./adr-0039-dev-is-protected-by-a-ruleset.md), which left
  `main` to register row F-25
- **Origin:** kit `main-release-branch`, D-01 — [`decisions.md`](../../internal/initiatives/main-release-branch/decisions.md); debt register row F-25, owner question O-08

---

## Context

The branch model is `feat/* → dev → main` (`CONTRIBUTING.md`), but `main` could not take a
promotion. It was one commit, `de0db41` "Initial commit" (2025-03-14), holding only an MIT
`LICENSE`, and it shared no history with `dev`, which had 671 commits and an ISC `LICENSE` chosen
to match lakira-backend (`b157e14`). With no merge base, a `dev` → `main` pull request could not
be opened, and `main` had no server-side rules at all.

`dev` became the default branch on 2026-09-24, so scheduled workflows and pull requests opened
without `--base` already go to `dev`. `dev`'s ruleset (ADR-0039) left `main` unprotected so that a
reset stayed possible.

## Decision

The owner chose on 2026-10-23 to reset `main` onto `dev` and then protect it.

1. **The old root is kept as a tag.** `de0db41` is `archive/main-initial-commit`.
2. **`main` was reset once** to `dev`'s tip `c7ba8b7`, with `--force-with-lease` on `de0db41`.
   Its push run of `frontend-ci` (39912456144) passed.
3. **A repository ruleset, "main (release gate)"** (id 25702940), is active on `refs/heads/main`
   with an empty bypass list. Its rules:
   - **No deletion and no force push** (`deletion`, `non_fast_forward`).
   - **Changes arrive by pull request**, with no approval required, and **merge commits only**
     (`allowed_merge_methods: ["merge"]`).
   - **"CI passed" must succeed**, from GitHub Actions (`integration_id` 15368). The branch need
     not be up to date with `main` first.
4. **Promotion is a `dev` → `main` pull request.** A fix needed on `main` lands on `dev` first and
   is promoted; nothing is committed to `main` alone. The steps are in
   [`promote-dev-to-main.md`](../../how-to/releases/promote-dev-to-main.md).

The ruleset as applied is kept in `.github/rulesets/main.json`, beside `dev.json`. Its read-back
from GitHub equalled the file field by field.

## Options considered

- **A one-time merge with `--allow-unrelated-histories`.** It keeps both roots, but `LICENSE`
  conflicts, and history would carry a second root holding a licence the project chose against,
  a misleading record for anyone forking. The tag keeps that commit findable.
- **Squash or rebase promotions.** Both put copies of `dev`'s commits on `main` instead of the
  commits themselves, so the merge base never moves past the reset and the next promotion
  conflicts with the copies. A merge commit brings `dev`'s commits in as they are.
- **Require the branch to be up to date** (strict). A promotion's head is `dev`, which never
  contains `main`'s merge commits, so it is never up to date. Updating it means merging `main`
  into `dev`, which `dev`'s ruleset allows only by pull request: a back-merge PR before every
  promotion, to satisfy a check that the `main` push run makes anyway.
- **Require signed commits**, as lakira-backend's `main` gate does. `dev`'s feature commits are
  unsigned; only GitHub's merge commits are signed. Every promotion would be blocked.
- **Only `dev` may be the head of a pull request into `main`.** Rulesets cannot express it; a
  workflow check could. It is a stated rule in the how-to for now.
- **Version and tag releases in the same change.** A separate decision (scheme, tooling, who cuts
  a release), filed as register row F-75.

## Consequences

- **A pull request into `main` cannot merge until "CI passed" is green, and only as a merge
  commit.** Nobody, the owner included, can push to `main` directly, force-push it or delete it.
- **Every promoted `dev` commit is in `main`,** and `main` adds only promotion merge commits, as
  long as every change reaches it by promotion. The merge base of the two is the last promoted
  `dev` commit, so each promotion's diff is exactly what `dev` gained since the last one, and
  `main` never needs merging back into `dev`.
- **Renaming the gate job now breaks two rulesets.** "CI passed" is matched by name in
  `dev.json` and `main.json`; a rename changes both in the same pull request.
- **A fork applies both rulesets itself.** Rulesets are not copied by forking; the two JSON files
  and `docs/reference/ci-pipeline/workflows.md` § Branch rules are how a fork gets the same gates.
- **Releases are still unversioned** until F-75 is decided.
