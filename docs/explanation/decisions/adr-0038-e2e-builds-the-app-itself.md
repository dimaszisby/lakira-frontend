# ADR-0038 — E2E builds the app itself

- **Status:** Accepted
- **Date:** 2026-10-22
- **Related:** supersedes in part [ADR-0036](./adr-0036-ci-runs-its-jobs-in-parallel-behind-a-gate.md),
  its decision that E2E keeps `needs: build`. The rest of ADR-0036, the gate above all, stands
- **Origin:** kit `build-inside-e2e`, D-01 — [`decisions.md`](../../internal/initiatives/build-inside-e2e/decisions.md); debt register rows F-69 and F-71

---

## Context

After ADR-0036, `frontend-ci` ran every job at once except E2E, which waited for Build's `.next`
artifact. Its critical path was Build, then E2E, then the gate: about 5 minutes. Four runs
measured 5m09s to 6m52s (`2026-10-21-todo-ci-install-on-the-critical-path.md`).

- **Most of the 5 minutes was installs.** Build and E2E each ran `npm ci`, 1m10s to 1m50s each.
  The build itself is about 25 s, and the Cypress steps about 1 minute.
- **E2E's Cypress binary cache measured no gain.** It hit in both of the last two runs, and E2E's
  install still took 1m45s. Skipping the binary in the other jobs did not shorten their installs
  either (kit `ci-in-parallel`, AC-3).

## Decision

The owner chose this on 2026-10-21, both changes in one PR.

- **E2E builds the app itself,** with `npm run build` after its install. It needs no other job and
  starts with the rest. The critical path pays one `npm ci`, and there is no `.next` upload or
  download.
- **The Build job is deleted,** along with its `next-build` artifact.
- **The gate, "CI passed," needs the seven remaining jobs.** It is otherwise unchanged.
- **E2E has no Cypress binary cache.** Cypress's postinstall downloads the binary during `npm ci`.
- **`CYPRESS_INSTALL_BINARY=0` stays on the six jobs that set it.** It is not measured to help,
  and not measured to cost anything. Removing it would be a third change with no evidence for it.

`frontend-stack-e2e` (`stack-e2e.yml`) already built inside its Cypress job; this matches it.

## Options considered

- **Keep Build as its own job.** A build failure is then named by its job, and `.next` is
  downloadable. Neither has been used: no workflow, how-to or test reads `next-build`. The cost
  is a second install on the critical path.
- **Cache `node_modules` to skip `npm ci`** (register F-70). That's the larger gain, about a
  minute on every job, but stale-dependency failures and the install-time checks `npm ci`
  performs argue against it. It stays deferred.
- **Keep the Cypress cache.** It costs a cache entry and a few seconds a run, and it measured
  nothing in return.

## Consequences

- **A build failure shows as a failed "Build app" step in E2E tests,** not as a failed job. "CI
  passed" is red either way.
- **No `next-build` artifact.** To inspect a CI build, build locally with CI's environment.
- **The expected gain is about 1 minute, estimated and not measured when this was written.** The
  kit's checklist records the first measured runs.
- **The gate has seven jobs to keep in step.** As before, a new job must be added to its `needs`;
  nothing checks that mechanically.
