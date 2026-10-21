# 2026-10-21 - Todo: what is left of frontend CI's wall-clock time

**Context:** found while measuring kit `ci-in-parallel` (#134, #135, ADR-0036). `frontend-ci` now
takes about 5 minutes, down from 12 to 14. These are the remaining levers, measured but not
started. Register rows F-69, F-70 and F-71.

## Measured

Four runs after #134:

| Run         | Wall clock | Cypress cache |
| ----------- | ---------- | ------------- |
| 39631209683 | 5m37s      | miss          |
| 39632717440 | 5m16s      | miss          |
| 39635953351 | 6m52s      | hit           |
| 39637019459 | 5m09s      | hit           |

- **The critical path:** Build, then E2E, then the gate.
- **What it spends:** each of Build and E2E runs `npm ci`, 1m10s to 1m50s. The build itself is
  about 25 s, the Cypress steps about 1 min, and job setup a few seconds.
- **So the installs are the bulk:** about 3 of the 5 minutes.
- **The slow run:** 39635953351's first Cypress launch took 65 s, against about 20 s in the others.
  It was seen once and is not explained.

## Items

- [ ] **F-69: run the build inside the E2E job.**
  - **Gain:** one `npm ci` on the critical path instead of two, and no `.next` upload and download.
    Estimated about 1 minute, not measured.
  - **Cost:**
    - Build stops being its own job: a build failure shows as a failed "Build app" step in E2E;
    - `next-build` is no longer an artifact anyone can download;
    - the gate's `needs` lists seven jobs, not eight.

  It needs the owner's say-so to edit `.github/workflows/test.yml` (the repo hook blocks it) and
  a line in ADR-0036's successor or a superseding entry, since it changes the job graph that ADR
  records.

- [ ] **F-71: remove the Cypress binary cache step from E2E.**
  - **Why:** it hit in both of the last two runs, and E2E's install still took 1m45s. Skipping
    the binary in the other jobs did not shorten their installs either (kit `ci-in-parallel`,
    checklist AC-3). The binary is not where the time goes, so the step adds a cache entry and a
    few seconds for nothing.
  - **Cost:** none measured. Keep `CYPRESS_INSTALL_BINARY=0` on the other jobs, or drop it too;
    decide when it is done.

## Considered, not recommended

- **F-70: cache `node_modules` and skip `npm ci` when the lockfile is unchanged.**
  - **Gain:** the larger one, about a minute on every job.
  - **Why not now:** a restored `node_modules` is a known source of stale-dependency failures that
    pass locally. Cypress's install script would need its own handling under `allowScripts`. A
    restored tree also bypasses the install-time checks `npm ci` performs.

  It is recorded so that nobody re-proposes it without these costs. Deferred, not rejected: it
  is worth revisiting only if 5 minutes becomes a real cost.

## Noted, no row

The Security Scan job runs `security:scan`, which is `lint` and `lint:css` again, then the audit.
That repeats part of Static checks. It runs alongside the other jobs, off the critical path, so it
costs no wait. Change it only if the job is touched for another reason.
