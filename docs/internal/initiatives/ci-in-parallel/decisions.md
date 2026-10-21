# CI in parallel — Decisions

## D-01 — The jobs run side by side behind a gate, and only E2E downloads the Cypress binary

> **Promoted to [ADR-0036](../../../explanation/decisions/adr-0036-ci-runs-its-jobs-in-parallel-behind-a-gate.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-21

**Context.** Register row F-68, from the Notion "FE CI Handoff" of 2026-10-21. It was written by a
backend CI session after lakira-backend #204 (ADR-0081) took the backend's CI from about 12.5 to
about 3.5 minutes.

- **Time.** `frontend-ci` took 12 to 14 minutes. Five jobs were a `needs:` chain, and each spent
  1m13s to 1m56s in `npm ci` for 6 to 37 seconds of work.
- **Inputs.** Only E2E consumes another job's output, the build.
- **Required checks.** No check is required on `dev` (F-24).

**Decision.**

- **No chain.** Every job starts at once except E2E, which needs Build.
- **A gate.** `ci`, "CI passed," needs all eight jobs, runs `if: always()`, and fails on any
  result but `success`.
- **The Cypress binary.** `CYPRESS_INSTALL_BINARY=0` on the six jobs that run no Cypress. E2E
  caches `~/.cache/Cypress` on the lockfile.

**Options considered.**

- _Only skip the binary:_ keeps five installs in series.
- _Each job required instead of a gate:_ eight names to keep in step with the settings.
- _The build inside Static checks, as on the backend:_ puts lint and typecheck on E2E's path.
- _Split E2E's Cypress runs:_ about a minute of Cypress, against an install and an app start per
  job.
- _No `--runInBand`:_ the suites take under a minute.

**Consequences.**

- **What the gate does not do yet.** "CI passed" is the name F-24 should require. Until it is
  required, it guards nothing.
- **Failures arrive together.** A red run can name several jobs at once.
- **A new job joins the gate's `needs`.** Review is the only check of that.
