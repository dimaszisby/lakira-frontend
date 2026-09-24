# `main` shares no history with `dev`

**Purpose:** decide how `main` becomes a real release branch before the first release needs it.
**Owner:** hardini
**Branch:** unassigned
**Found:** during the 2026-09-24 session handoff; until now it was recorded only there.

## What is true today

Measured 2026-09-24 against `origin`:

- `main` is one commit, `de0db41` "Initial commit" (2025-03-14), containing only `LICENSE`.
- `dev` is 427 commits, and `git merge-base origin/main origin/dev` returns nothing — the two
  histories are unrelated.
- `main` is still the repository's **default branch**, so `gh pr create` without `--base` targets
  it, and so does GitHub's "Compare & pull request" button.

`.claude/rules/workflow.md` describes promotion as `feat/* → dev → main`. That second hop cannot
happen as things stand: a PR from `dev` to `main` has no common ancestor to diff against, and a
merge needs `--allow-unrelated-histories`.

## It already matters: the nightly performance workflow has never run

Found 2026-09-24 while hardening the secret scan. GitHub runs `schedule` and `workflow_dispatch`
workflows from the **default branch**. `.github/workflows/performance.yml` (`frontend-performance`,
Lighthouse and bundle-size metrics, cron `0 2 * * *`) has been on `dev` since `2862c92`
(2026-02-18), but `main` does not carry it. The Actions API lists only `frontend-ci` as a
registered workflow, and all 98 recorded runs are `frontend-ci`. **It has never run.**

Six live documents describe it as running nightly: `.claude/agents/ci-debugger.md` (twice),
`.claude/rules/performance.md`, `docs/explanation/product-requirements.md`,
`docs/how-to/ci-cd/daily-pipeline-playbook.md`, `docs/reference/commands.md`, and the comment in
`src/app/_components/WebVitalsReporter.tsx`. Resolving this todo makes them true; if it is
deferred, correct them instead.

The same constraint ruled out a scheduled full-history secret scan — see
`2026-09-24-todo-secret-scan-hardening.md`.

## Why it looked harmless

Every PR targets `dev`, and a PR mis-targeted at `main` fails loudly for the same reason a release
PR would. For now the broken `main` works as a safety net. It stops working as one at the first
release, and `lakira-backend` has the same shape.

## Options

- **Reset `main` to `dev`** (`git push --force origin dev:main`). Clean linear history from then on;
  destroys the one-file `Initial commit`, which holds nothing `dev` lacks except `LICENSE` —
  check `dev` has it first.
- **Merge once with `--allow-unrelated-histories`.** Keeps both roots; every later promotion is an
  ordinary merge.
- **Make `dev` the default branch** as well, whichever of the above is chosen, so the default stops
  pointing at a branch nobody works on.

Both of the first two rewrite or join shared history on a branch with no server-side protection
(see `2026-08-17-todo-claude-code-setup.md`, Phase 7), so they are an owner decision, not an agent
sweep.

## Checklist

- [x] Confirm `dev` carries `LICENSE` — it does (checked 2026-09-24).
- [ ] Choose reset or one-time merge; record the reason here.
- [x] Decide whether `dev` becomes the default branch. **Done 2026-09-24** with
      `gh repo edit --default-branch dev`. Non-destructive and reversible; it rewrites no history.
      It fixed the scheduled-workflow problem at once: GitHub registered `frontend-performance`
      immediately, the six docs describing a nightly run became true, and `gh pr create` without
      `--base` now targets `dev`. The first run found a measurement problem, not a performance one
      — see `2026-09-24-todo-perf-measurement-reliability.md`.
- [ ] Do the same for `lakira-backend`, or file it there.
