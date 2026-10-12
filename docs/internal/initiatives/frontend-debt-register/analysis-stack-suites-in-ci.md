# F-06 — No spec that signs in runs in CI

Register row [F-06](register.md). Read at `f67716e`, backend `dev` at `3277e5d`.

## 1. What is wrong

CI's `e2e` job runs three steps: the public specs, the accessibility check on the public pages,
and the public pages with the Content Security Policy enforced
(`.github/workflows/test.yml:180-193`). None of them signs in. The specs that do,
`cypress/e2e/stack/` and `cypress/e2e/csp-stack/`, run only when someone starts the local stack
and runs them.

The audit of 2026-10-10 holds two items at Partial for this: "End-to-end coverage" (the one P1
that is not a deploy item) and the signed-in half of "Named accessibility gate in CI". Its section
7 adds that these two suites are the only evidence for every signed-in page and journey.

## 2. Root cause

A recorded decision: kit `cypress-a11y-e2e`, D-01 (2026-09-29). The job starts the built app and
nothing else, and the signed-in specs need the backend, its database, Redis, RabbitMQ and Mailpit.
D-01 deferred running that stack in CI and gave three costs: a token to check out a private
repository, five services on the runner, and a backend build per run. It tied the deferral to the
backend settling how its images are published.

## 3. Options

- **A. Build the backend from source in the job.** Check out lakira-backend and start its Compose
  stack, then run the two stack suites. One of D-01's three costs is gone: the backend repository
  is public now, so the checkout needs no token. The other two stand.
- **B. Pull a published backend image.** What D-01 waited for. Faster than A and pins a version.
  Not available: no backend workflow pushes an image to a registry; `image-smoke.yml` builds one
  and discards it.
- **C. A scheduled or manually dispatched workflow, not a step on every pull request.** The same
  stack as A, run nightly, as `dependency-audit` is. A failure is then a task, not a blocked PR,
  and an unrelated backend change cannot turn a frontend PR red.
- **D. Leave it local.** Today's state. The gate table in `.claude/rules/workflow.md` says when
  to run the suites, and it depends on someone remembering.

## 4. Recommendation

**C built as A**, if the owner wants this closed before the backend publishes images: a separate
workflow that checks out both repositories, starts the backend's Compose stack, builds and starts
the app, and runs `npm run test:e2e:stack` and `npm run test:e2e:csp:stack`. Nightly and on
dispatch first; a pull request trigger can follow once its run time and flake rate are known.

It reverses D-01, so it is the owner's call (O-02), and it should be a new decision that
supersedes D-01, not an edit to it.

## 5. Acceptance criteria for the fix

- **AC-1** — A workflow run starts the backend stack and the app, and both stack suites pass in
  it, each as a named step. _Why:_ the audit's two Partial items.
- **AC-2** — The run names the backend commit it tested. _Why:_ a red run has to say which
  backend it was red against.
- **AC-3** — The stack helpers still refuse a non-local URL (`cypress/support/stack.ts:8`).
  _Why:_ the suites create users; they must never be pointed at a deployed environment.
- **AC-4** — No secret is needed. _Why:_ the backend is public and the users are created per run.
- **AC-5** — The gate table in `.claude/rules/workflow.md` and `.claude/rules/testing.md` § E2E
  say where the two suites now run. _Why:_ both state today that they never run in CI.

## 6. Size and shape

≤1 day, most of it in the workflow's start-up and wait logic. A small sweep with a decision that
supersedes `cypress-a11y-e2e` D-01. No ADR: a CI topology is not an application boundary. Gates:
the always-on gates, and the new workflow's own first green run, checked by name.

## 7. Depends on, unblocks

Depends on O-02. Unblocks the "End-to-end coverage" and accessibility items at the next dated
run, and gives F-33 (axe on pages that hold data) somewhere to run. Independent of F-01.

## 8. Not verified

- That the backend's Compose stack starts on a GitHub runner in a usable time. Its own
  `image-smoke.yml` builds the image there, which is some evidence and not the same thing.
- That the backend's Compose file needs no `.env` values a runner would not have.
- The suites' flake rate. Locally, one run stalled across a machine sleep on 2026-10-11 and
  passed when re-run; that is the only recorded failure.
- No reproduction was run for this kit. `test:e2e:stack` last passed locally for #88, 28 of 28;
  `test:e2e:csp:stack` was last run for the audit of 2026-10-10.
