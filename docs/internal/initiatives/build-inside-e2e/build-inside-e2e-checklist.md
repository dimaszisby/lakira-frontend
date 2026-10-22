# Build inside E2E — Checklist

Register rows F-69 and F-71. `frontend-ci`'s critical path ran two `npm ci`, one in Build and one
in E2E, and E2E's Cypress binary cache saved nothing ([D-01](decisions.md), promoted to
ADR-0038).

## Code

- [x] `.github/workflows/test.yml`:
  - the `build` job and its `next-build` artifact deleted;
  - `e2e` has no `needs`, and runs "Build app" (`npm run build`) after its install in place of
    "Download Next build artifact";
  - "Cache the Cypress binary" deleted;
  - the gate `ci` needs seven jobs;
  - the header comment and Static checks' comment updated.

  `CYPRESS_INSTALL_BINARY=0` stays on the other six jobs. Edited in the scratchpad and copied
  into place, as the repo hook requires.

## Docs and rules

- [x] ADR-0038 and its registry row; ADR-0036's `Related` line names the part superseded; D-01
      carries the promotion banner
- [x] `docs/reference/ci-pipeline/workflows.md`: the job diagram, the paragraph, the Cypress
      binary note and the job table
- [x] `docs/how-to/ci-cd/daily-pipeline-playbook.md`: the `e2e` and `ci` rows no longer name the
      Build job or its artifact
- [x] `2026-10-21-todo-ci-install-on-the-critical-path.md`: F-69 and F-71 ticked, `## Status`
      appended
- [x] Register: F-69 and F-71 closed with #138, "As of" moved to `147fe14`; the register README's
      status line

## Discovered

- [x] Found: `daily-pipeline-playbook.md` told a reader to check the `build` artifact when E2E
      times out, and said a skipped `e2e` meant the build failed. Both are wrong once the job is
      gone → in scope, corrected
- [x] Found: with F-69 and F-71 closed, no row in the register is `ready`. Every open row waits on
      the owner, the backend or upstream, or is deferred or settled → reported in the handover;
      no change to the register beyond the two rows

## Acceptance

- [x] `frontend-ci` has no `build` job and no `next-build` artifact, and E2E builds the app itself
      and starts with the other jobs. _Why:_ F-69; one install on the critical path. ·
      **actionlint** v1.7.12 on every workflow, clean apart from the ignored `ubuntu-26.04` label
      rule. **Local run** of E2E's new step order (`npm ci`, `build`, `start`, `test:e2e:public`,
      `test:e2e:a11y`, `test:e2e:csp`): 2, 16 and 7 tests, as before.
- [x] E2E has no Cypress cache step. _Why:_ F-71; it measured no gain. · By inspection of the
      diff. Its Cypress runs on the PR's run: below.
- [x] "CI passed" needs exactly the seven remaining jobs and is green on the PR's run. _Why:_ the
      gate is what branch protection will require (F-24). · **The PR's run** 39725445945 and
      **the `dev` run** 39735862596, read with `gh run view`: seven jobs and "CI passed", all
      `success`, and no Build job.
- [x] The PR's measured wall clock is recorded against the four runs in the todo (5m09s to
      6m52s), whatever it shows. _Why:_ the gain was an estimate. · **The PR's run** 39725445945:
      3m01s. **The `dev` run** 39735862596: 3m05s. About 2 to 4 minutes saved, against the 1
      minute estimated. E2E's install took 1m12s in both and its build 19s and 17s. E2E is no
      longer the slowest job: Static checks took 2m49s and 2m55s, E2E 2m32s and 2m28s.

## Gates

Run 2026-10-22 on Node 24.21.0.

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with coverage: 1123 tests; 56.81 / 46.97 / 51.3 / 56.3 %, every folder goal met
- [x] integration: 173 tests
- [x] spec drift: `api:spec:check` (33 paths) and `api:types:check` in sync; `security:audit` clean
- [x] build
- [x] e2e and e2e (csp): 18 and 7 tests, in E2E's new step order
- [ ] e2e (stack) and e2e (csp, stack): skipped. No app code, signed-in page, CSP or
      `stack-e2e.yml` changed
