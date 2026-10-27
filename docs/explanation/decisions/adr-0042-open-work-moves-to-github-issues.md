# ADR-0042 — Open work moves to GitHub Issues, with the tracker kept as code

- **Status:** Accepted
- **Date:** 2026-10-24
- **Related:** follows the docs diet (kit `docs-diet`, #149), step 1 of the same path
- **Origin:** kit `tracker-as-code`, D-01 — [`decisions.md`](../../internal/initiatives/tracker-as-code/decisions.md)

---

## Context

Open work, its status and its ranking live as Markdown in git: the debt register
(`docs/internal/initiatives/frontend-debt-register/register.md`), dated todos and a kit per task.
Every change of status is a commit. That is why a finished task needed a close-out PR, and why
each piece of evidence was written three times, in the kit, the PR body and the register. The
common setup for a GitHub project keeps decisions and shipped docs in git and puts open work in
GitHub Issues, where a pull request that says `Closes #N` closes its issue on merge.

The repository had no issue forms, no pull request template, and only GitHub's default labels
plus the two Dependabot applies. Issues do not copy to a fork; files in `.github/` do.

## Decision

Open work moves to GitHub Issues in stages. The owner chose the shape on 2026-10-24.

1. **The tracker is defined in the repository,** so a fork gets the same setup without the
   upstream backlog:
   - labels in `.github/labels.json`;
   - issue forms in `.github/ISSUE_TEMPLATE/` (task, bug, decision), with blank issues off;
   - a pull request template, `.github/pull_request_template.md`.
2. **Ranking is labels:** `type:*`, `tier:1` to `tier:5` (the register's D-01 tiers), `sev:P1`
   to `sev:P3`, and `state:*` (the register's State column). `gh issue list --label state:ready`
   is the query "what's next" will run. A Project board may be added later, on top of the
   labels; it is not the source of the ranking.
3. **`labels.json` is the whole set.** `npm run labels:sync` makes the repository's labels
   match it: it creates, updates and deletes, so GitHub's defaults go. `dependencies` and
   `github_actions` stay because the file lists them.
4. **The sync is run by hand,** dry by default and with `--apply` to write, as the rulesets in
   `.github/rulesets/` are applied. No workflow holds a token that can edit labels.
5. **The register stays the source of "what's next"** until its open rows move to issues (step
   3, register row F-77). Kits and ADRs are unchanged by this record.

## Options considered

- **A Project board now, with Tier, Severity, Size and Waiting-on fields:** deferred. A board
  belongs to the owner's account rather than the repository, so a fork does not get it. It needs
  the `project` scope that `gh` does not have here, and it would be empty until step 3.
- **Keeping GitHub's default labels beside the new set:** rejected. `bug` beside `type:bug`, and
  `question` beside `type:decision`, are two names for one thing.
- **A workflow that syncs labels on push:** rejected. It needs a job with `issues: write`,
  where no job holds a write token today, to save a command run a few times a year.
- **Staying with Markdown in git:** rejected by the owner. It is what costs the close-out PRs.

## Consequences

- A fork runs `npm run labels:sync -- --apply` once (`docs/reference/issue-tracker.md`).
- Until step 3, the tracker exists with no issues in it. A form used before then files an issue
  the register does not rank.
- Deleting a label removes it from every issue and pull request carrying it. On 2026-10-24 none
  carried a default label; one Dependabot pull request, #98, carries the two kept ones.
- The backend keeps its own register (lakira-backend #159) until it chooses otherwise; step 6
  offers it this setup.
