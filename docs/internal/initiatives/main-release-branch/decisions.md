# main release branch — Decisions

## D-01 — `main` is reset onto `dev` and protected by a release gate that allows merge commits only

> **Promoted to [ADR-0041](../../../explanation/decisions/adr-0041-main-is-reset-onto-dev-and-protected-by-a-release-gate.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-23

**Context.** Register row F-25 and owner question O-08, from
`2026-09-24-todo-main-has-unrelated-history.md`. `main` was one commit, `de0db41` "Initial
commit" (2025-03-14), holding only an MIT `LICENSE`. `dev` was 671 commits with an ISC `LICENSE`,
chosen in `b157e14` to match lakira-backend. The two had no merge base, so a `dev` → `main` pull
request could not be opened. `dev` has been the default branch since 2026-09-24, and its ruleset
(ADR-0039) left `main` to this row.

**Decision.** The owner chose on 2026-10-23:

- **Reset, and tag the old root first.** `de0db41` was tagged `archive/main-initial-commit`, then
  `main` was force-pushed to `dev`'s tip `c7ba8b7` with a lease on `de0db41`. `main` then shared
  `dev`'s history, and its push run of `frontend-ci` (39912456144) passed.
- **A ruleset, applied after the reset**, because it forbids force pushes. "main (release gate)",
  id 25702940, active on `refs/heads/main` with no bypass:
  - `deletion` and `non_fast_forward`;
  - `pull_request` with 0 approvals and merge commits only;
  - `required_status_checks` with "CI passed" from GitHub Actions (15368), not strict.
- **Promotion is a `dev` → `main` pull request merged with a merge commit.** A fix needed on
  `main` lands on `dev` first and is promoted, so nothing exists only on `main`.
- **Versioning is not part of this decision.** Tags, a changelog and GitHub releases on `main` are
  register row F-75.

**Options considered.**

- _A one-time merge with `--allow-unrelated-histories`:_ `LICENSE` conflicts, and history would
  keep a second root holding a licence the project chose against. The tag keeps that root
  findable without it.
- _Squash or rebase promotions:_ both put copies of `dev`'s commits on `main`, so the merge base
  never moves past the reset and the next promotion conflicts with the copies.
- _Strict (up to date):_ a promotion's head is `dev`, which never contains `main`'s merge commits.
  Bringing it up to date means merging `main` into `dev`, which `dev`'s ruleset allows only by
  pull request, so every promotion would need a back-merge PR first.
- _Required signatures, as lakira-backend's `main` has:_ `dev`'s feature commits are unsigned;
  only GitHub's merge commits are signed. Every promotion would be blocked.
- _Restricting the head of a promotion to `dev`:_ rulesets cannot express it; a workflow check
  could. The how-to states it as the rule instead.

**Consequences.**

- Nobody pushes to `main` directly or force-pushes it, the owner included.
- A promotion offers one merge button, "Create a merge commit".
- The "CI passed" rename hazard of ADR-0039 now applies to two rulesets.
- The file and the live ruleset can drift. `docs/reference/ci-pipeline/workflows.md` gives the
  commands to compare them.
