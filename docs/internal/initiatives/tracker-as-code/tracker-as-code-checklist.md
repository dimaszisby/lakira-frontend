# Tracker as code — Checklist

Step 2 of the move to GitHub Issues. The owner chose labels for the ranking, replacing GitHub's
defaults, and a sync run by hand ([D-01](decisions.md),
[ADR-0042](../../../explanation/decisions/adr-0042-open-work-moves-to-github-issues.md)).

## Change

- [x] `.github/labels.json`: 16 labels in four groups (`type:`, `tier:`, `sev:`, `state:`) and
      Dependabot's `dependencies` and `github_actions`
- [x] `scripts/github/sync-labels.ts` and `npm run labels:sync`: dry by default, `--apply`
      writes, `--repo` names another repository; `planLabelSync` is the diff
      ([D-02](decisions.md))
- [x] `.github/ISSUE_TEMPLATE/`: `task.yml`, `bug.yml`, `decision.yml`, and `config.yml` with blank
      issues off and the private vulnerability reporting link
- [x] `.github/pull_request_template.md`: What, Changes, Verification with the gate table
- [x] `src/__tests__/github-tracker.test.ts`: the label file, the forms and the planner. Failed
      before the files existed (`Cannot find module '../../scripts/github/sync-labels'`)

## Docs

- [x] ADR-0042 and its registry row
- [x] `docs/reference/issue-tracker.md`, linked from `docs/README.md`, `commands.md` and
      `CONTRIBUTING.md`
- [x] `docs/reference/commands.md`: `labels:sync` under Repository settings
- [x] `docs/reference/ci-pipeline/workflows.md`: the fork step beside the rulesets
- [x] Register: row F-77 for steps 3, 4 and 6; the register README's status line
- [x] `docs/internal/initiatives/README.md`: this kit under Done

## Discovered

- [x] Found: Jest here cannot import an `.mjs` module → in scope, the script is TypeScript run by
      Node's type stripping ([D-02](decisions.md))
- [x] Found: Node warns `MODULE_TYPELESS_PACKAGE_JSON` on that file → in scope, the npm script
      disables that one warning (D-02)
- [x] Found: GitHub reads issue forms from the default branch, `dev`, so the forms appear only
      after the merge → a handover step, not an acceptance box

## Acceptance

- [x] `labels.json` names each label once, with colours and descriptions GitHub can store, and
      every type, tier, severity and state group. _Why:_ the sync writes these as given. · **a
      machine checked it**: `github-tracker.test.ts`
- [x] Every label a form applies is defined in `labels.json`. _Why:_ GitHub drops an unknown
      label silently. · **a machine checked it**: `github-tracker.test.ts`
- [x] The planner creates, updates and deletes what differs, ignores colour case, and does
      nothing when the sets match. _Why:_ a wrong delete strips a label from every issue. · **a
      machine checked it**: `github-tracker.test.ts`
- [x] A dry run against this repository plans 16 creates, 0 updates and 9 deletes, the nine
      defaults, and writes nothing. _Why:_ the plan the owner approves after the merge. · **I
      checked it**: `npm run labels:sync` on 2026-10-24; `gh label list` unchanged after it
- [x] No pull request carries a label the sync deletes. _Why:_ deleting it would strip it. · **I
      checked it**: only #98 carries labels, `dependencies` and `github_actions`, both kept
- [x] F-77 ranks the rest of the move. _Why:_ "what's next" reads the register. ·
      `register-todos` passes in the unit gate

## Gates

- [x] lint
- [x] typecheck
- [x] format
- [x] unit tests
- [x] spec drift
- [x] `security:audit`: 0 vulnerabilities on 2026-10-24, after `dev` was merged in. It had failed
      on `zod` 3.25.76 (GHSA-mrhx-c7xc-m3w5), which the owner chose to fix on `dev` first, in
      #152; this branch waited for it
- [x] build
- [ ] css lint, integration, e2e, e2e (csp), e2e (stack) and e2e (csp, stack): skipped, no
      application code, style or flow changed
