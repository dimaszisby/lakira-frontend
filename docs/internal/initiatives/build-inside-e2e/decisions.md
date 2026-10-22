# Build inside E2E — Decisions

## D-01 — E2E builds the app itself, with no Cypress cache

> **Promoted to [ADR-0038](../../../explanation/decisions/adr-0038-e2e-builds-the-app-itself.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-22

**Context.** Register rows F-69 and F-71, from
`2026-10-21-todo-ci-install-on-the-critical-path.md`. `frontend-ci`'s critical path was Build,
then E2E, then the gate, with an `npm ci` in each of the first two. E2E's Cypress cache hit and
saved nothing.

**Decision.** The owner chose to do both rows in one PR (2026-10-21).

- E2E runs `npm run build` after its install; the Build job and its `next-build` artifact are
  deleted, and E2E has no `needs`.
- The gate needs the seven remaining jobs.
- E2E's "Cache the Cypress binary" step is deleted.
- `CYPRESS_INSTALL_BINARY=0` stays on the other six jobs. Neither keeping nor removing it is
  backed by a measurement, so it isn't changed here.

ADR-0036's decision that E2E keeps `needs: build` is superseded in part; its gate stands. No
precedent existed for a partial supersede, so ADR-0038's `Related` line names the part, and
ADR-0036's `Related` line points back.

**Options considered.**

- _Keep Build as a job:_ a named failure and a downloadable `.next`, neither used by anything.
- _F-70, cache `node_modules`:_ still deferred, for the reasons in its todo.

**Consequences.**

- A build failure is a failed step in E2E tests, not a failed job.
- The gain is an estimate until the PR's own run measures it; the checklist records that run.
