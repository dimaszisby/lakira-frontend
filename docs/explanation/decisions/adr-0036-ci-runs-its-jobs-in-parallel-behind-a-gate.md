# ADR-0036 — CI runs its jobs in parallel, behind a gate

- **Status:** Accepted
- **Date:** 2026-10-21
- **Origin:** kit `ci-in-parallel`, D-01 — [`decisions.md`](../../internal/initiatives/ci-in-parallel/decisions.md); debt register row F-68
- **Related:** lakira-backend ADR-0081, "CI runs each test suite once, in parallel, behind a gate
  that keeps the required check" (backend #204)

---

## Context

`frontend-ci` (`.github/workflows/test.yml`) took 12 to 14 minutes on a pull request; run
39624288837 took 12m14s.

**The chain.** Five of its jobs were a `needs:` chain: Static checks, then Unit tests, then
Integration tests, then Build, then E2E tests. API Contract Drift, Security Scan and Secret Scan
ran alongside.

**What each job spent.** Each job starts on a fresh runner and runs `npm ci`, which took 1m13s to
1m56s per job, against 6 to 37 seconds of real work in most of them. Five installs ran one after
another, so about 8 of the 12 minutes was dependency install.

**Inside the install.** The Unit job's install had 66 seconds of silence after its last
deprecation warning. `package.json` `allowScripts` permits one postinstall, Cypress's, which
downloads its binary. `actions/setup-node`'s `cache: npm` keeps `~/.npm`, not `~/.cache/Cypress`.

**What the chain did not do.** Nothing in it consumed an earlier job's output, except E2E, which
runs the `.next` artifact Build uploads. `dev` has no branch protection and no rulesets (register
F-24), so no check is required, and the chain was not guarding a merge either. It only meant that
E2E's green implied every job before it had passed.

## Decision

- **Every job starts at once except E2E,** which keeps `needs: build`, its one input.
- **A gate job, `ci`, named "CI passed," needs all eight jobs.** It runs with `if: always()` and
  fails unless every result is `success`, so a failed, skipped or cancelled job fails it.
  - **Why `if: always()`:** without it, a failed dependency leaves the gate skipped, and GitHub
    counts a skipped required check as passing.
  - **What it's for:** it's the one check to require when F-24 sets up branch protection.
- **Jobs that run no Cypress set `CYPRESS_INSTALL_BINARY=0`.** Typecheck compiles
  `cypress/tsconfig.json` against the package's bundled types, which do not need the binary.
- **E2E caches `~/.cache/Cypress`** with `actions/cache`, keyed on the runner OS and
  `package-lock.json`.
- **Job ids and names are unchanged,** so every document and rule that names a job stays true.

## Options considered

- **Keep the chain and only skip the binary.** About 6 to 7 minutes instead of 12 to 14, by the
  handoff's estimate, and still five installs in series.
- **Make each job a required check instead of a gate.** Eight names to keep in step with the
  settings, and a renamed job silently stops being required. One gate is one name.
- **Move the build into Static checks, as the backend moved its build into lint.** E2E would then
  wait for lint and typecheck as well as the build. Build is on the critical path here, and lint
  is not.
- **Split E2E's three Cypress runs into jobs.** About a minute of Cypress in total, and each job
  would pay its own install and app start.
- **Drop Jest's `--runInBand`.** The suites take 26 and 34 seconds; not worth reopening why it was
  chosen.

## Consequences

- **The critical path is Build, then E2E, then the gate.** The checklist records the first
  measured run; the estimate was 4 to 5 minutes.
- **Each job still runs its own `npm ci`.** The repository is public, so the extra concurrent
  runners cost no Actions minutes.
- **A lint failure no longer stops the tests from starting.** The run shows every failure at
  once, and "CI passed" is red either way.
- **A new job must be added to the gate's `needs`,** or the gate will not wait for it. That is a
  review finding; nothing checks it mechanically.
- **The gate guards nothing until F-24 makes "CI passed" a required check.** That is a repository
  settings change, which is the owner's to make.
