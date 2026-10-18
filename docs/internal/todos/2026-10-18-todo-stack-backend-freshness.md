# 2026-10-18 - Todo: refuse a stack run against a backend image older than backend `dev`

**Context:** debt register row F-51. Nothing checked the local backend's age before a stack run.
Twice before it ran days behind `dev`: 2026-10-08 (`2026-10-08-todo-dashboard-count-assertions.md`)
and 2026-10-13 (`2026-10-13-todo-relative-range-includes-today.md`).

A third time was under way when this started. The container `node_app` ran an image created
2026-10-13 13:08 UTC, and backend `dev` had merged 18 commits since, #165 to #182. Every stack run
reported for #103 to #110 ran against it.

## Checklist

- [x] `cypress/support/backend-image.ts`, on the Node side:
  - It reads the creation time of the image the container runs, not of the container, because
    `up -d` without `--build` recreates a container from an old image.
  - It reads backend `dev`'s commits since then from the GitHub API. The repository is public, so
    no token is needed.
  - The result is memoised, so a run asks GitHub once.
- [x] `assessBackendFreshness` decides: `fresh`, `stale`, `allowed` or `unknown`. A stale message
      names the count, up to five commits, the rebuild command and the override.
- [x] `cypress.config.ts`: a `backendFreshness` task, reading `E2E_BACKEND_CONTAINER` (default
      `node_app`) and `E2E_ALLOW_STALE_BACKEND`.
- [x] `preflightStack()`: stale fails the run. An allowed run, or one whose age could not be read,
      is logged, and the specs go on.
- [x] `src/__tests__/backend-image-freshness.test.ts`: five cases for the decision. Written before
      the module, but the module followed at once, so they were not seen to fail on their own.
- [x] Seen to fail for real: against the 2026-10-13 image, `npm run test:e2e:stack` failed all 9
      specs at preflight, naming 18 commits.
- [x] The two other paths, run on one spec each:
  - with `E2E_ALLOW_STALE_BACKEND=1`, it logged "Running anyway" and passed;
  - with `E2E_BACKEND_CONTAINER=no_such_container`, it logged "not checked" and passed.
- [x] The owner rebuilt the backend (image 2026-10-18 15:34 UTC, after `dev`'s newest commit at
      15:25).
- [x] Docs:
  - `docs/how-to/testing/run-stack-e2e.md` § 1;
  - `docs/reference/environments.md` and `.claude/rules/environment.md` list the two variables;
  - `.claude/rules/testing.md` names the check.
- [x] Gates

## Status

Done 2026-10-18 on `test/stack-backend-freshness`. Node 24.21.0, production build.

On the rebuilt backend the check passed silently, and both suites passed:

- stack: 50 of 50;
- CSP stack: 8 of 8.

That also re-ran, against current backend `dev`, everything #103 to #110 had asserted against the
2026-10-13 image. Unit 1030, integration 142.

Found, out of scope: the check is by date, because the backend reports no commit. Its `/health`
answers `release: "unknown"` locally, so an image built from another branch after the newest `dev`
commit passes. An exact check needs the backend to report the commit it was built from: register
row F-61.
