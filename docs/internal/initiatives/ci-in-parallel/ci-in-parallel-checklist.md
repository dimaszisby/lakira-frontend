# CI in parallel — Checklist

Register row F-68. `frontend-ci` ran five of its jobs as a chain, 12 to 14 minutes for 2 to 3
minutes of work. From the Notion "FE CI Handoff", 2026-10-21; [D-01](decisions.md), promoted to
ADR-0036.

## Workflow

- [x] `.github/workflows/test.yml`:
  - **No chain:** `unit`, `integration` and `build` lose their `needs:`, and `e2e` keeps
    `needs: build`;
  - **Cypress binary skipped:** `CYPRESS_INSTALL_BINARY: "0"` on `checks`, `unit`,
    `integration`, `build`, `api-contract` and `security`;
  - **Cypress binary cached in `e2e`:** `actions/cache` at
    `55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0`, the commit the v6.1.0 tag points to,
    with path `~/.cache/Cypress` and key `cypress-<os>-<lockfile hash>`;
  - **The gate:** `ci`, "CI passed", `needs:` all eight jobs, `if: always()`, and one step that
    prints each result and fails unless all are `success`.

  Job ids, names, pins and `ubuntu-26.04` are unchanged.

- [x] Written in the scratchpad and copied into place: the repo hook blocks edits under
      `.github/workflows/`, and the owner approved the change with the plan

## Docs and rules

- [x] ADR-0036 and its registry row; D-01 carries the promotion banner
- [x] `docs/reference/ci-pipeline/workflows.md`: the graph, the gate, the binary, and a row for
      `ci`
- [x] `docs/how-to/ci-cd/daily-pipeline-playbook.md`: what a red "CI passed" means
- [x] `.claude/skills/pre-push/SKILL.md`: the reason for stopping at the first failure no longer
      claims CI is serial
- [x] Register: F-68 filed, open until the measured run closes it; F-24 names the check to
      require; "As of" moved
- [x] Todo `2026-10-21-todo-ci-wall-clock-time.md`: the before and after

## Acceptance

- [x] `checks`, `unit`, `integration`, `build`, `api-contract`, `security` and `secret-scan`
      start together, and `e2e` needs only `build`. _Why:_ only `e2e` consumes another job's
      output. · **actionlint** 1.7.12 (checksum-verified) on the file: clean apart from the
      ignored `ubuntu-26.04` label rule. **Read back:** the only `needs:` are `e2e` and `ci`.
      **The PR's run:** job start times.
- [x] "CI passed" fails unless every job succeeded, a skipped one included. _Why:_ GitHub counts
      a skipped required check as passing, so a gate that can be skipped, or that passes on a
      skipped job, guards nothing (ADR-0036). · **The gate's script, run locally** on eight
      results: exit 0 with all `success`, and exit 1 with one `failure`, `skipped` or
      `cancelled`.
- [ ] The Cypress binary is not downloaded where Cypress does not run. _Why:_ the 66 s silence in
      `npm ci` was inferred to be its download. · **The PR's run:** each job's install step,
      against run 39624288837. Filled in after the push.
- [ ] Wall-clock time, measured against run 39624288837 (12m14s). _Why:_ the point of the change.
      · **The PR's run.** Filled in after the push.

## Gates

Run 2026-10-21 on Node 24.21.0. No application code changed.

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with coverage
- [x] integration
- [x] spec drift and `security:audit`
- [x] build
- [x] actionlint
- [ ] e2e, e2e (csp), e2e (stack) and e2e (csp, stack): skipped locally, since no application
      code changed. The PR's own run executes e2e and e2e (csp) under the new workflow
