# Stack suites in CI — Decisions

## D-01 — The stack suites run in CI nightly and on dispatch, not on every pull request

- **Status:** Accepted (merged in #127, 2026-10-21)
- **Date:** 2026-10-21

Supersedes [`cypress-a11y-e2e` D-01](../cypress-a11y-e2e/decisions.md), which kept every spec that
needs the backend on developers' machines.

**Context.** Register row F-06, P1: no spec that signs in runs in CI. `cypress/e2e/stack/` and
`cypress/e2e/csp-stack/` are the only evidence for every signed-in page and journey, and the audit
of 2026-10-10 holds "End-to-end coverage" and the signed-in half of the accessibility gate at
Partial because nothing runs them unless someone remembers. `cypress-a11y-e2e` D-01 gave three
costs for running them in CI: a token to check out a private repository, five services on the
runner, and a backend build per run. The first is gone, since lakira-backend is public. The second
and third remain: no backend workflow publishes an image (checked 2026-10-21; `image-smoke.yml`
builds one and discards it), so a run has to build the backend from source.
**Decision.** The owner chose this on 2026-10-21 (register question O-02). A separate workflow,
`frontend-stack-e2e` (`.github/workflows/stack-e2e.yml`), runs nightly and on manual dispatch:

- it checks out both repositories side by side;
- it starts the backend's own Compose stack from its `.env.example`, with a per-run `JWT_SECRET`
  and rate limiting off;
- it migrates, builds and starts the app;
- it runs `npm run test:e2e:stack` and `npm run test:e2e:csp:stack` as two named steps.

It also runs on a pull request that changes the workflow file itself, because a workflow can be
neither dispatched nor scheduled before it is on the default branch.
**Options considered.**

- _A step on every pull request:_ the strongest gate, but it adds the stack's start-up to every PR,
  and an unrelated change on backend `dev` could block frontend work. Deferred until the nightly
  run's time and flake rate are known.
- _Pull a published backend image:_ faster and pinned, but there is no published image.
- _Keep the suites local:_ today's state, which leaves the audit's two items at Partial.

**Consequences.**

- A regression in a signed-in page is found the next morning, not before merge. The gate table
  still asks for a local run when a change touches a signed-in page, the layout, or an auth or
  token flow.
- A red nightly run can be the backend's doing: the run names the backend commit it tested, so
  that is the first thing to check.
- GitHub disables a schedule in a public repository after 60 days without activity, as
  `dependency-audit.yml` notes.
