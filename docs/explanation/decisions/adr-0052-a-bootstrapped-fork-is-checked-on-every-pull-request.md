# ADR-0052 — A bootstrapped fork is checked on every pull request

- **Status:** Accepted
- **Date:** 2026-11-24
- **Related:** [ADR-0036](./adr-0036-ci-runs-its-jobs-in-parallel-behind-a-gate.md) (the jobs run
  side by side behind "CI passed"), [ADR-0039](./adr-0039-dev-is-protected-by-a-ruleset.md) (the
  ruleset requires "CI passed")
- **Origin:** issue #219, under two days and so without a kit

---

## Context

`scripts/bootstrap-fork.sh` turns a clone of this repository into a new app. It renames the brand,
removes `docs/internal/` and prints the steps that follow, the third of which runs the gates.
Nothing ran those steps except a dated audit, by hand. Twice, a gate added between two audits broke
them:

- **N2 of the 2026-10-04 audit.** A fork failed `format`, because the rename changed the width of
  Markdown table cells. That gate had been added on 2026-09-20.
- **N18 of the 2026-11-14 audit.** A fork failed `test:unit`, because
  `src/__tests__/open-work-records.test.ts`, added on 2026-10-25, read the debt register under
  `docs/internal/` when it loaded, and the script had removed that folder.

Each time the pull request that broke the fork was green. The break was found weeks later, and a
forker would have found it on their first CI run.

## Decision

`frontend-ci` (`.github/workflows/test.yml`) gains a `fork` job, "Fork bootstrap", that "CI passed"
waits on. On every pull request and every push to `dev` and `main`, it:

1. runs `./scripts/bootstrap-fork.sh --name acme-app` on the checkout, before `npm ci`, as on a fresh
   clone;
2. runs `npm ci` and `npm run format:fix`;
3. runs the commands of the script's printed step 3, in its order: `lint`, `typecheck`, `format`,
   `test:unit` and `build`.

The job's steps follow the printed steps, not the other way round. A change to one is a change to
both, and the comment above the job says so. `api:spec:check` is left out: printed step 1 sends a
fork to its own backend's spec first, and a fork made in CI has none.

The ruleset is unchanged. It requires "CI passed", which now needs nine jobs instead of eight.

## Options considered

- **A job on every pull request.** Chosen. The pull request that breaks the fork is the one that
  fails, while its author still has the change in mind.
- **A nightly job, like the stack suites.** Rejected. The break would be found the next morning,
  after it had merged to `dev`, and someone other than its author would have to trace it.
- **A step in the release checklist.** Rejected. It relies on someone remembering, and it would run
  only at a promotion. Remembering is what failed twice above.
- **The script deleting what it breaks.** For N18 the script could have deleted the test along with
  `docs/internal/`. Rejected as the general answer: it fixes the one file it names and catches
  nothing new. The test now skips when the folder is absent (#219).

## Consequences

- Every run pays one more `npm ci` and `next build`, in parallel with the other jobs. Since E2E is
  the slowest job, the run's wall time barely changes. Actions minutes cost nothing on a public
  repository.
- A gate that depends on something the script removes or renames now fails on its own pull request,
  under the name "Fork bootstrap".
- A fork that keeps this workflow runs the job against itself. The script then renames the fork to
  `acme-app` in the job's checkout only, which is harmless: step 7 points the script at the fork's
  name, and an existing `FORKED-FROM.md` is left untouched. A fork that will never be forked again
  can delete the job.
- The job proves the printed steps for one name, `acme-app`. A name that breaks the rename in some
  other way is not covered.

## References

- Issue #219; the 2026-11-14 audit, N18 and section 2.3
  (`docs/internal/audits/saas-readiness/audit-2026-11-14.md`); the 2026-10-04 audit, N2
- `scripts/bootstrap-fork.sh`, steps 4 and 5 and the printed steps
- `src/__tests__/open-work-records.test.ts`
