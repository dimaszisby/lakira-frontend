# Secret-scan hardening

**Purpose:** replace the 2021 gitleaks action with a pinned, checksum-verified gitleaks without
losing full-history coverage, and correct the docs that describe a Codecov upload CI does not have.
**Owner:** hardini
**Branch:** `chore/secret-scan-hardening` off `dev`
**Closes:** `2026-08-24-todo-saas-readiness.md` Phase 7 items "`gitleaks-action` v1.6.0 -> v2,
SHA-pinned" and "Reconcile `CODECOV_TOKEN`".

## What was actually running

`test.yml`'s `secret-scan` job used `zricethezav/gitleaks-action@v1.6.0`, a mutable tag. Read from
the action's source at that tag:

- A Docker action built on `zricethezav/gitleaks:v7.4.0` — gitleaks 7, from 2021, with its rule set.
- It declares one input, `config-path`. The workflow's `args: --path . --verbose --redact` **was
  never read.** No harm resulted: the entrypoint passes `--redact` itself, so findings were never
  printed in the clear. But the line misled anyone reading the workflow.
- On `push` it scanned the **entire history**; on `pull_request`, the PR's commits.
- It uses `::set-output`, which CI already flags as deprecated.

## Decisions

**D-1 — Run the gitleaks binary directly, not through an action.** The job downloads gitleaks
8.30.1 from the official release, checks it against a SHA-256 written into the workflow, and runs
`gitleaks git --redact` over the full history on every push and PR — the coverage v1.6.0 had, and
that `.claude/rules/security.md` and the `ci-debugger` agent both promise ("full history in CI").

- No third-party action code runs with the job's token, and there is no Node runtime to deprecate.
- The digest is **hard-coded, not fetched**. Downloading the release's own checksums file at run
  time would only prove the tarball matches whatever the release says today. The pinned digest
  `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` was computed locally from the
  downloaded asset and matched `gitleaks_8.30.1_checksums.txt`.
- The cost is speed: none. A full-history scan takes under a second locally.
- 8.30.1 is also the version the baseline scan below used, so CI and that result agree.

**Rejected: `gitleaks/gitleaks-action` v3, SHA-pinned.** This was the first design, and it did not
survive checking:

- The saas-readiness todo said v2. v2 runs on Node 20, which GitHub removed from hosted runners on
  2026-09-16, so v2 no longer runs. v3.0.0 (commit `e0c47f4`) is the Node 24 release, and it runs
  gitleaks 8.24.3 by default.
- v3 scans only the pushed or PR commits (`--log-opts=--no-merges --first-parent base^..head`),
  and scans full history only on `schedule` and `workflow_dispatch`. The plan was a weekly scheduled
  full scan to make up the difference — but **scheduled and manually dispatched workflows run
  from the default branch**, which here is `main`, holding only `LICENSE` (see
  `2026-09-24-todo-main-has-unrelated-history.md`). The weekly scan would never have run.
- v3 also comments on PRs by default, which needs a write token; the repo default is read-only.

**D-2 — Least privilege.** The job declares `permissions: contents: read`, which is all a checkout
and a local scan need. The repo default is already read-only; declaring it keeps the job correct
if that default is ever widened.

**D-3 — Leave `actions/checkout@v4`.** Every job in every workflow uses it, and CI already warns
that it is being forced from Node 20 onto Node 24. That is a repo-wide migration and should move all
workflows together — filed as `2026-09-24-todo-node20-actions-migration.md`, not done for one job.

## Baseline scan

gitleaks 8.30.1 (Homebrew) over the full history, `gitleaks git . --redact`: **0 findings, 381
commits scanned.** The repo has 390 non-merge commits across all refs; 10 of them add no text lines,
so there is nothing in them to scan. CI runs the same 8.30.1 binary, so the first CI run on this
branch should report the same result.

## Checklist

- [x] `secret-scan` job in `.github/workflows/test.yml`: pinned download, digest check, full-history
      `gitleaks git --redact`, `permissions: contents: read`; the dead `args:` line gone.
- [x] Prove the digest check fails closed: a wrong digest must stop the job before gitleaks runs.
- [x] Prove the scan fails on a secret: a planted fake credential must exit non-zero.
- [x] Codecov: nothing under `.github/` uploads to Codecov, and no workflow references any secret.
      Corrected `docs/how-to/ci-cd/daily-pipeline-playbook.md`, `docs/reference/configuration.md`,
      `docs/reference/environments.md`, `.claude/agents/ci-debugger.md`.
- [x] Stale lines: `2026-08-17-todo-claude-code-setup.md` (`check-accessibility` was removed
      2026-08-27) and `2026-09-12-todo-auth-session-lifecycle.md` (register sets the refresh cookie
      since backend #103).
- [x] File `2026-09-24-todo-node20-actions-migration.md`.
- [x] Tick the two saas-readiness items this closes.

## Proof

The two `run:` scripts were extracted from `test.yml` by parsing it, not copied, and run in an
Ubuntu container (`buildpack-deps:noble-scm`) with the repo mounted read-only:

| Case                                     | Result                                                        |
| ---------------------------------------- | ------------------------------------------------------------- |
| Correct digest, scan this repo           | checksum `OK`, gitleaks 8.30.1, 381 commits, no leaks, exit 0 |
| Digest replaced with zeros               | `sha256sum` `FAILED`, install exits 1, no binary extracted    |
| Random `ghp_` token committed in a clone | `github-pat` in `leak.ts`, exit 1, the token appears 0 times  |

The first planted token was a repeated pattern. gitleaks ignored it as low-entropy, which proved
nothing, so the case was rerun with 36 random characters.

Gates: `lint`, `lint:css`, `typecheck`, `format` clean; `test:unit` 80 suites, 669 tests; `build`
passes. `test:integration`, spec drift and `test:e2e` skipped, not triggered. The job's real proof is
its first CI run on this branch's PR, which should print `OK`, `8.30.1` and "no leaks found".

## Discovered

- [x] Found: `.claude/agents/ci-debugger.md` still said lint warnings do not fail `checks` — stale
      since #44 → in scope, same table, corrected.
- [x] Found: the Node 20 action deprecation across every job → out of scope, filed as
      `2026-09-24-todo-node20-actions-migration.md`.
- [x] Found: `frontend-performance` has **never run**. Scheduled workflows run from the default
      branch, `main`, which does not carry it; GitHub lists only `frontend-ci` → out of scope, added
      to `2026-09-24-todo-main-has-unrelated-history.md` with the six docs that say otherwise.

## Status

**Complete.** The secret scan keeps full-history coverage on every push and PR, now with gitleaks
8.30.1 instead of 7.4.0, a verified binary instead of a mutable third-party tag, and a
least-privilege token. The docs no longer describe a Codecov upload or a CI secret that do not
exist.

**Not promoted to an ADR.** The rationale lives beside the rule in `.claude/rules/security.md`;
nothing here changes an interface, data shape or dependency of the app.
