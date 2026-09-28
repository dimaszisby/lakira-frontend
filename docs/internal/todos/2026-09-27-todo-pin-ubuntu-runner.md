# Pin the CI runner to Ubuntu 26.04

**Purpose:** move CI to Ubuntu 26.04 on this repo's schedule rather than GitHub's, and keep it there.
**Owner:** hardini
**Branch:** `chore/pin-ubuntu-runner` off `dev`
**Found:** 2026-09-24, as a notice on every CI job: "The ubuntu-latest label will migrate to Ubuntu
26 beginning October 19, 2026."

## State on 2026-09-27

From `actions/runner-images` `README.md`: `ubuntu-latest` is Ubuntu 24.04, and `ubuntu-26.04` is
already available as its own label. Every job in `test.yml` (8) and `performance.yml` (1) used
`ubuntu-latest`.

actionlint 1.7.12 (its latest release, 2026-03-30) reports `ubuntu-26.04` as an unknown label. Its
runner list is compiled in and predates 26.04; `actions/runner-images` announces 26.04 as generally
available. The CI run on this branch is the authority, not the linter.

## Decision

**D-1 — Pin the runner to an explicit Ubuntu version instead of `ubuntu-latest`.** Decided
2026-09-27, with the owner.

- Everything else CI depends on is already pinned on purpose: actions by commit SHA, Node by
  `.nvmrc`, Lighthouse by version, gitleaks by version and checksum, install scripts by allowlist.
  `ubuntu-latest` was the one input that changed underneath the repo on someone else's date.
- With `-latest`, an OS migration can turn a build red with no commit to explain it. Pinned, the
  move is a PR that runs the whole pipeline first. `actions/runner-images` itself advises pinning
  when stability matters.
- Rejected, `ubuntu-latest`: least maintenance, but the migration lands unannounced in the
  history. Its one advantage, never forgetting to upgrade, is covered by GitHub's own deprecation
  notices and brownouts, which run well ahead of an image's removal.
- Limit, accepted: the label pins the OS major only. GitHub still updates the tools inside the image
  weekly, so this is not a freeze. Dependabot does not bump runner labels; the next move is manual.

**D-2 — Which version: 26.04, if the pipeline passes on it; otherwise 24.04.** `ubuntu-latest`
becomes 26.04 on 2026-10-19 regardless, and 26.04 has the longer support ahead. The draft PR is
the check: it runs every job on the new image before anything merges.

## Checklist

- [x] `runs-on: ubuntu-26.04` in all 8 `test.yml` jobs and the `performance.yml` job.
- [x] `docs/reference/ci-pipeline/workflows.md`: runner row, and the rule for new jobs.
- [x] `2026-09-24-todo-node20-actions-migration.md`: its Ubuntu note points here.
- [x] Draft PR: all 8 `frontend-ci` jobs green on 26.04, with the runner image named in each job's
      "Set up job" log, not just the green tick. Run `36333848938` on `f691afd`: every job logged
      `Image: ubuntu-26.04`, image version 20260920.143.
- [x] Dispatch `frontend-performance` on the branch; it passes on 26.04. Run `36333848895`: medians
      `/` 96, `/login` 97, `/register` 94, in line with 24.04.
- [x] `e2e` in particular: Cypress needs system libraries a new image may name differently. It
      started and "All specs passed".
- [x] No "ubuntu-latest label will migrate" notice on any job. The only annotation left is the
      known `cypress/screenshots` warning.

## Status

**Complete.** Merged in #55 (`f691afd`); the `dev` run on the merge commit (`36334637117`) passed all
8 jobs on 26.04. Not promoted to an ADR: CI configuration, recorded here and in
`docs/reference/ci-pipeline/workflows.md`.
