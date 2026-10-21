# Stack suites in CI — Checklist

Register row F-06, P1. No spec that signs in ran in CI, which held the audit's "End-to-end
coverage" and the signed-in half of its accessibility gate at Partial. The owner chose a nightly
and dispatched workflow ([D-01](decisions.md)); the analysis is
[`analysis-stack-suites-in-ci.md`](../frontend-debt-register/analysis-stack-suites-in-ci.md).

## Workflow

- [x] `.github/workflows/stack-e2e.yml`, `frontend-stack-e2e`:
  - triggers: `schedule` at 04:00 UTC, `workflow_dispatch`, and a `pull_request` to `dev` that
    changes the file itself;
  - `ubuntu-26.04`, `permissions: contents: read`, actions pinned to the SHAs `test.yml` uses.
- [x] Both repositories checked out side by side; lakira-backend at `dev`, no token.
- [x] The backend's `.env` from its `.env.example`, with `JWT_SECRET` generated per run and
      `DISABLE_RATE_LIMITING=true`; the step fails if either key is missing.
- [x] The backing services from the backend's own Compose file, migrated from the runner as the
      backend's `fork-smoke.yml` does, then the `app` service built with `APP_RELEASE`.
- [x] The commits under test written to the run summary.
- [x] The app built and started with `API_URL` and `NEXT_PUBLIC_API_BASE_URL` set.
- [x] `test:e2e:stack` and `test:e2e:csp:stack` as two named steps; the second runs even if the
      first fails.
- [x] Backend log on failure; videos and screenshots uploaded; the stack taken down.

## Docs and rules

- [x] `.claude/rules/workflow.md`: the gate table's paragraph on the stack gates.
- [x] `.claude/rules/testing.md` § E2E: the "In CI" column for `stack/` and `csp-stack/`.
- [x] `.claude/rules/accessibility.md` § Current tooling gaps.
- [x] `docs/how-to/testing/run-stack-e2e.md`: the intro, and "Run them in CI".
- [x] `docs/how-to/releases/a11y-release-checklist.md`: a green nightly run counts.
- [x] `docs/reference/ci-pipeline/workflows.md`: a `frontend-stack-e2e` section.
- [x] `docs/how-to/ci-cd/daily-pipeline-playbook.md`: a red nightly run.
- [x] `cypress-a11y-e2e` D-01 marked superseded; its body unchanged.
- [x] Register: F-06 closed; O-02 removed from the owner's questions.

## Discovered

- [x] Found: a high advisory in `follow-redirects` failed Security Scan on `dev` before this
      branch was cut → out of scope, fixed first in #126 (register row F-66).
- [x] Found: the PR's first run (39511529204) failed 16 of 58 stack cases. Every failure was a
      metric or category page answering 404, or a step that needed one; the CSP stack suite
      passed. The job set no `NEXT_PUBLIC_APP_URL`, so `resolveAppOrigin` (`src/lib/env.ts`) gave
      a production build `https://localhost:3000`. The server's own requests to `/api/proxy` went
      there and failed against the plain-http server, and the detail layouts turn a failed fetch
      into `notFound()`. Local runs pass because `.env.local` sets it → in scope, the job now sets
      `NEXT_PUBLIC_APP_URL: http://127.0.0.1:3000`.
  - Reproduced against the local stack: a build with `https://localhost:3000` failed
    `metrics-list-widths.cy.ts` 8 of 17 with the same 404s; the build with the fix passed it,
    `metric-to-dashboard.cy.ts` and `chart-summary.cy.ts`, 27 of 27.
- [x] Found: a production build with no app origin configured guesses `https://localhost:3000`
      for its own server-side requests, which fails silently into a 404 on any host that does not
      serve that → out of scope for this CI change. F-01's AC-3 already requires the production
      `NEXT_PUBLIC_APP_URL` to be named; its analysis now says why it must be set at build time.
- [x] Found: actionlint 1.7.12 does not know the `ubuntu-26.04` label that every workflow here
      uses and CI accepts → not a defect; the check was run with that one rule ignored.
- [ ] Found: the second run (39514889446) passed 57 of 58 and the CSP stack suite 8 of 8. The
      failure was "drops a deleted value from the dashboard reached with the back button": the card
      read `n: 2`, not `n: 1`. The backend's log shows the DELETE and the log list's refetch, then no
      request for 4.5 s, so the dashboard was never refetched. Not reproduced locally: five plain
      runs, a 6x CPU throttle and a delayed metric chart all pass. Ruled out:
  - the backend's dashboard cache: a log write awaits its `vizdash:` invalidation before answering;
  - a `<Link>` prefetch overwriting the query: the dashboard's prefetch carries no figures;
  - the delete's serial `await`s: the metric chart query is not active on the logs tab, so the
    dashboard is marked stale right after the list refetch. A `Promise.all` change was written,
    tested at unit level and parked, not shipped, because it does not explain this failure.
  - → in scope, still open. The run could not show more: the CSP stack run emptied
    `cypress/videos` and `cypress/screenshots` before the upload, so the failing spec's video was
    lost. It now runs with `--config trashAssetsBeforeRuns=false`; locally a file left by an
    earlier run survived it. The next red run carries the video.

## Acceptance

- **AC-1** — A workflow run starts the backend stack and the app, and both stack suites pass in
  it, each as a named step. _Why:_ the audit's two Partial items (A10 § 3.1 categories 7 and 9).
- **AC-2** — The run names the backend commit it tested. _Why:_ a red run has to say which
  backend it was red against.
- **AC-3** — The stack helpers still refuse a non-local URL. _Why:_ the suites create users; they
  must never be pointed at a deployed environment.
- **AC-4** — No secret is needed. _Why:_ the backend is public and the users are created per run.
- **AC-5** — The rules and how-tos say where the two suites now run. _Why:_ each said they never
  run in CI.

How each is checked:

- [ ] AC-1 — machine: this PR's own `frontend-stack-e2e` run, triggered by its path filter; both
      steps green, with the same case counts as the last local runs (58 and 8), so neither suite
      passed by running nothing.
- [ ] AC-2 — machine: the same run's summary lists the backend commit and `/health`'s `release`.
- [x] AC-3 — by construction: nothing under `cypress/` changes; `LOCAL_HOSTS` in
      `cypress/support/stack.ts` is untouched, and the workflow uses only `localhost` and
      `127.0.0.1`.
- [x] AC-4 — read: the workflow names no `secrets.` and passes no token to the backend checkout;
      `permissions` is `contents: read`.
- [x] AC-5 — read: the files under Docs and rules above.

## Gates

- [x] lint
- [ ] css lint — skipped: no styles changed
- [x] typecheck
- [x] format
- [x] unit tests, with coverage
- [ ] integration — skipped: no data access or routing changed
- [x] spec drift
- [x] build
- [ ] e2e, e2e (csp) — skipped: no app code changed
- [x] actionlint on every workflow, with the runner-label rule ignored
- [ ] e2e (stack), e2e (csp, stack) in CI — the PR's own run (AC-1)
