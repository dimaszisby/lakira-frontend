# Move the workflows off Node 20 actions

**Purpose:** clear the Node 20 deprecation from every CI job in one change.
**Owner:** hardini
**Branch:** `chore/node20-actions-migration` off `dev`
**Priority:** medium: CI works today, but only because GitHub forces these actions onto Node 24.
**Found:** 2026-09-24, while hardening the secret scan.

## What CI reports

Every job on `dev` at `6283528` carries this annotation, listing a subset of:

> Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run
> on Node.js 24: actions/checkout@v4, actions/download-artifact@v4, actions/setup-node@v4,
> actions/upload-artifact@v4.

Usage across `.github/workflows/`: `checkout@v4` x9, `setup-node@v4` x8, `upload-artifact@v4` x5,
`download-artifact@v4` x1. Latest releases on 2026-09-24: `checkout` v7.0.1, `setup-node` v7.0.0,
`upload-artifact` v7.0.1, `download-artifact` v8.0.1.

## Breaking changes checked

Release notes read 2026-09-25 for every major between v4 and the target, against both workflows.

| Action              | Target | Breaking change                                                                                               | Affects this repo                                          |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `checkout`          | v7.0.1 | v6 persists credentials to a separate file; v7 refuses fork PRs under `pull_request_target` or `workflow_run` | No: neither trigger is used, and no step pushes            |
| `setup-node`        | v7.0.0 | v5 auto-caches when `package.json` has `packageManager`; v6 limits that to npm                                | No: no `packageManager` field; every job sets `cache: npm` |
| `upload-artifact`   | v7.0.1 | v7 adds opt-in `archive: false`                                                                               | No                                                         |
| `download-artifact` | v8.0.1 | v5 changes the path for a single download by ID; v8 fails on a digest mismatch by default                     | No: downloads by `name`; failing on mismatch is wanted     |

Each target's `action.yml`, read at the pinned commit, declares `using: node24`.

## Decisions

**D-1 — Move to the latest major of each action.** Decided 2026-09-25. The majors since v4 are
runtime and packaging changes; none of the behavioural ones apply (table above). Stopping at an
intermediate major would only schedule the next migration.

**D-2 — Pin every action to a full commit SHA, first-party included.** Decided 2026-09-25.
GitHub's hardening guide calls a full SHA the only immutable reference, and OpenSSF Scorecard's
Pinned-Dependencies check flags tags on `actions/*` too. Tags were rejected: they can be moved to
other code, which is how tj-actions/changed-files was compromised in March 2025. Pinning only
third-party actions was rejected as moot: there are none, and it would leave the only actions this
repo runs unpinned. Format is `@<sha> # vX.Y.Z`. Each SHA was checked to be the commit its release
tag and its major tag both point at on 2026-09-25:

```text
actions/checkout           3d3c42e5aac5ba805825da76410c181273ba90b1  v7.0.1
actions/setup-node         820762786026740c76f36085b0efc47a31fe5020  v7.0.0
actions/upload-artifact    043fb46d1a93c77aae656e7c1c64a875d1fc6a0a  v7.0.1
actions/download-artifact  3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c  v8.0.1
```

**D-3 — Dependabot for `github-actions` only.** Decided 2026-09-25. Pins without an updater go stale
silently, so `.github/dependabot.yml` bumps them weekly in one grouped PR against `dev`, with a
`chore(ci)` commit prefix. npm is deliberately left out: that would open a stream of dependency PRs,
which is a separate decision from keeping CI's actions current.

Not done here: the repository setting that requires SHA pinning on GitHub's side (currently
`sha_pinning_required: false`). It is a settings change only the owner can make, and would turn the
rule in `.claude/rules/security.md` into an enforced one.

## Checklist

- [x] Read each action's release notes between v4 and the target major for breaking changes; the
      artifact pair in particular must move together, since `build` uploads what `e2e` downloads.
- [x] Decide whether to SHA-pin first-party actions too: yes, D-2.
- [x] Update all workflows in one change: 23 `uses:` across `test.yml` and `performance.yml`.
- [x] `.github/dependabot.yml` for `github-actions` (D-3).
- [x] `.claude/rules/security.md` states the pinning rule.
- [x] On the PR: every job green, and no Node 20 annotation in any job's summary. Run
      `36093904901` on `1a3b127`: 8 of 8 green, zero Node 20 annotations; `dev` at `fc3ce5e` just
      before (`36093164573`) still carried one.
- [x] On the PR: `e2e` downloads the `next-build` artifact that `build` uploaded (v7 upload, v8
      download). Same run: "Artifact download completed successfully. Total of 1 artifact(s)
      downloaded", then `home.cy.ts` passed.
- [x] Dispatch `frontend-performance` on the branch; it passes and uploads its reports. Run
      `36109848705`: medians `/` 99, `/login` 97, `/register` 94; `performance-reports` uploaded.
- [x] After merge: Dependabot's first run appears under Insights, Dependency graph, Dependabot, with
      no config error. Run `36109876997`, 9 s after the #51 merge: success, against `dev`, with the
      `chore(ci)` prefix and the `github-actions` group; it read each version from the trailing
      comment and logged "No update needed" for all four, so it opened no PR.
- [ ] Note: `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19 (a CI notice on the same runs).

## Discovered

- [x] Found: `.claude/rules/security.md` said scheduled workflows run from the default branch,
      `main`. The default has been `dev` since 2026-09-24 → in scope, corrected in the same bullet
      list the pinning rule was added to.

## Status

**Complete.** Merged in #51 (`1a3b127`). Every job runs on Node 24 actions pinned by SHA, and
Dependabot keeps the pins current. The `cypress/screenshots` "No files were found" warning on
`e2e` predates this change: Cypress writes screenshots only when a test fails.

**Not promoted to an ADR.** CI-only; the pinning rule lives in `.claude/rules/security.md`, next to
the secret-scan rule it extends, and no application interface, data shape, runtime dependency or
auth boundary changed.
