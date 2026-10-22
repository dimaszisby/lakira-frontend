# dev ruleset — Decisions

## D-01 — A ruleset on `dev` requires a pull request and "CI passed", with no bypass

> **Promoted to [ADR-0039](../../../explanation/decisions/adr-0039-dev-is-protected-by-a-ruleset.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-22

**Context.** Register row F-24, from `2026-08-17-todo-claude-code-setup.md`. `dev` and `main`
had no branch protection and no rulesets, so "CI passed" (ADR-0036) guarded nothing. `main` has
no history in common with `dev` (F-25), and O-08, reset or one-time merge, is open.

**Decision.** The owner chose on 2026-10-22:

- protect `dev` only. `main`'s ruleset comes with the fix for F-25, so a force-push rule does not
  rule out the reset;
- no bypass, as in lakira-backend's rulesets.

The ruleset "dev (integration gate)", id 25639339, has these rules:

- `deletion` and `non_fast_forward`;
- `pull_request` with 0 approvals and all three merge methods;
- `required_status_checks` with "CI passed" from GitHub Actions (15368), not strict.

It was applied with `gh api --method POST` from `.github/rulesets/dev.json`. The read-back
showed two defaults GitHub adds, which the file now writes out.

**Options considered.**

- _Classic branch protection:_ no first-class bypass list and no exportable JSON; the backend
  uses rulesets.
- _Strict (up to date):_ every merge would rerun every open PR; the `dev` push run covers the
  merged result.
- _Linear history, signed commits, thread resolution:_ each changes how work lands, and none is
  F-24's ask.
- _Admin bypass:_ it turns the gate into a default.

**Consequences.**

- Nobody pushes to `dev` directly, the owner included.
- A rename of the "CI passed" job must change the ruleset in the same PR.
- The file and the live ruleset can drift. `docs/reference/ci-pipeline/workflows.md` gives the
  command to compare them.
