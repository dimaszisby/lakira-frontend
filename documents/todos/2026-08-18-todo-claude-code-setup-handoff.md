# 2026-08-18 — Handoff: Claude Code setup, post-restart

**Purpose:** pick up the Claude Code configuration work in a fresh session.
**Read first:** [`2026-08-17-todo-claude-code-setup.md`](./2026-08-17-todo-claude-code-setup.md) — the full plan, classification, and results. This file is only what is _not yet done_ plus what will bite you.

---

## Where things stand

Branch `feature/claude-code-setup`, six commits, pushed, working tree clean, **no PR opened yet**.

```
5d511c8 docs(todos): record the Claude Code setup plan and results
4a9da23 fix(tooling): keep Prettier off generated artifacts and index the command reference
1172d47 fix(lint): enforce the components layer boundary
6509704 chore(api): sync OpenAPI snapshot and regenerate types
bd3f807 feat(api): add OpenAPI sync and type generation with CI drift gate
fe49e82 chore(claude): add project Claude Code configuration
```

Shipped: 13 path-scoped rules, 4 agents, 4 skills, 4 hooks, `settings.json`, `lessons.md`, `CLAUDE.md` rewritten as an index, the OpenAPI sync + drift gate, and the layer-boundary fix.

---

## Do this first — verify the hooks are live

The hooks were **configured but never active** in the session that wrote them: hook config loads at session start, and `.claude/settings.json` did not exist yet. The scripts themselves are correct (all four exit 2 correctly when invoked directly) and are `100755` in git.

This was proven the hard way — a `Write` to `package-lock.json` went straight through and clobbered the file. It was restored, verified byte-identical to HEAD. **Do not assume the guardrails work. Test them.**

Try to `Write` to `package-lock.json`. Expected: blocked with
`Protected: package-lock.json is managed by npm.`

If it is _not_ blocked, hooks are still inactive — stop and tell the user before doing anything destructive.

Then confirm the rest:

```bash
export CLAUDE_PROJECT_DIR=$PWD
echo '{"tool_input":{"command":"git add ."}}' | ./.claude/hooks/validate-bash.sh   # expect exit 2
echo '{"tool_input":{"file_path":"'$PWD'/src/app/page.tsx"}}' | ./.claude/hooks/guard-branch.sh  # exit 0 + note on dev
```

---

## Open items, in priority order

### 1. Fix the three typecheck errors — highest value

```
src/components/ui/TextField.tsx:70                       TS2339 'current' does not exist on type 'never'
src/features/data-visualizations/components/MetricChart.tsx:135   TS2322 Point[] mismatch on x
src/features/data-visualizations/components/TimeRangePicker.tsx:32 TS2339 'last' does not exist on TimeRangeValue
```

These **predate this branch** — verified identical with the generated types file removed. They have had CI red on `dev` since 2026-07-27 (run on `7244e68`).

Why this matters more than it looks: CI is a strict serial chain (`checks → unit → integration → build → e2e`). `checks` failing means unit, integration, build, and e2e have not run in three weeks. `next.config.ts` sets no `ignoreBuildErrors`, so `build` would fail on the same errors regardless.

**Consequence for the PR:** `feature/claude-code-setup` cannot be validated by CI at all, and a reviewer cannot distinguish new breakage from old. A small `fix(types)` PR landing on `dev` first is the unblock.

### 2. Open the PR

Title and body are drafted in the session log; regenerate from the todo's Status section if lost. Mention explicitly that CI red on `checks` is pre-existing.

### 3. One pre-existing test failure

`src/components/layout/__tests__/Sidebar.int.test.tsx` asserts on the presence of a `text-brand-primary` class — the exact anti-pattern `.claude/rules/testing.md` warns against. Fix by asserting on `aria-current` or accessible state instead of a class name.

### 4. Backlog (Phase 7 of the main todo)

Server-side branch protection on `dev`/`main` (still zero rulesets — the `guard-branch.sh` hook is the _only_ enforcement), placeholder coverage thresholds (3/2/3/3 %), empty MSW handler array while `onUnhandledRequest: "error"`, `jsx-a11y` recommended ruleset, the `check-accessibility` placeholder, and the three conflicting local backend defaults (`:3000` / `:4000` / `:8001`).

---

## Gotchas discovered the hard way

**Never run `npm run format:fix` casually.** 114 files repo-wide are not Prettier-clean (including `.prettierrc.json` itself), so it produces a ~114-file diff of pure churn. `format` is not a CI gate. Generated artifacts and `.claude` are now in `.prettierignore` — that was a real bug: reformatting `src/types/api/generated/**` made `api:types:check` fail against a file that was otherwise perfectly in sync.

**The OpenAPI spec lives only on the backend's `dev` branch.** Not `staging`, not `main`. So the generated contract is _ahead of_ the staging deployment that preview builds actually call — an endpoint in the types may not exist on staging yet. `LAKIRA_OPENAPI_BRANCH` overrides. Reading a local backend checkout is opt-in via `LAKIRA_BACKEND_PATH`, deliberately: auto-detection picked up a sibling clone sitting on a feature branch.

**The `api-contract` CI job hits GitHub on every run.** An unrelated PR can go red because the backend shipped a contract change. That is the gate working, but it is real coupling.

**Six files are exempt from the layer rule**, quarantined at the bottom of `eslint.config.mjs`: `withAuth.tsx`, `Header.tsx`, `Sidebar.tsx`, `HydrateUser.tsx`, `CategorySelect.tsx`, `Visualization.tsx`. Do not add to that list. Enabling the rule surfaced 126 violations, of which 108 were the _declared table_ being wrong and only 18 were genuine inversions.

**Long shell commands do not survive a paste.** A wrapped `git add` line was read by zsh as a second command and produced a confusing `permission denied`. Give the user one short command per line.

**Git actions are the user's.** Claude does not run `git commit`, `git push`, `git merge`, `git rebase`, or `gh pr create` — denied in `settings.json` and in `validate-bash.sh`. Surface the exact commands instead.

---

## Environment notes

- `origin` was switched from HTTPS to SSH on 2026-08-18. HTTPS had no usable credential (`gh` was never wired as a credential helper and osxkeychain held nothing for github.com) while SSH already worked. This matches `lakira-backend`. Revert: `git remote set-url origin https://github.com/dimaszisby/lakira-frontend.git`
- `gh config set git_protocol ssh` was applied.

## Gate baseline (2026-08-18, on `feature/claude-code-setup`)

| Gate               | Exit | Note                                  |
| ------------------ | ---- | ------------------------------------- |
| `lint`             | 0    | 43 pre-existing warnings              |
| `lint:css`         | 0    |                                       |
| `typecheck`        | 1    | **3 pre-existing errors**             |
| `test:unit`        | 0    | 243 passed / 55 suites                |
| `test:integration` | 1    | 73 passed, **1 pre-existing failure** |
| `api:spec:check`   | 0    |                                       |
| `api:types:check`  | 0    |                                       |

Anything other than these two known failures is new — investigate before proceeding.

## Status (2026-08-21)

All open items from this handoff except opening the PR are resolved.

- **Hooks verified live.** `protect-files.sh` blocked a `package-lock.json` edit with the documented message; `validate-bash.sh` exited 2 on `git add .`; `guard-branch.sh` exited 0 on this feature branch. Guardrails are confirmed active this session.
- **All 3 typecheck errors fixed:**
  - `TextField.tsx:51` — `registrationRef` was collapsing to `never` after the `typeof === "function"` narrowing because RHF's `ref` type is a pure `RefCallback`. Widened the local type annotation to retain the object-ref branch.
  - `MetricChart.tsx` — `toScatterDataPoints` mapped `point.x` (`Date | string | number`) straight into Chart.js's `Point["x"]` (`number | null`). First attempt converted to numeric timestamps, which passed typecheck but silently changed runtime output and broke 2 passing unit tests that assert ISO-string `x` values (Chart.js's time scale accepts strings via the date adapter at runtime despite the stricter static `Point` type). Corrected to a type-only fix: introduced a local `TimeSeriesPoint = { x: string; y: number }` type and typed `datasets` against it instead of `ScatterDataPoint[]`, preserving the original ISO-string runtime values.
  - `TimeRangePicker.tsx:32` — `value.last` was read directly in a `useEffect` dependency array outside the narrowing guard. Extracted a narrowed `relativeLast` const before the effect and depended on that instead.
- **Sidebar test fixed** — was an actively failing test (not just a style nit): asserted on a stale `text-brand-primary` substring that never matched the real class (`bg-brand-primary text-white`), and the component had no accessible active-state attribute at all. Added `aria-current="page"` to the active link in `SideBarNavigationItems.tsx` and rewrote the assertion in `Sidebar.int.test.tsx` to check `aria-current` instead of a class name, per `.claude/rules/testing.md`.
- **Gate rerun, all green:** `lint` 0 errors/43 pre-existing warnings (none in touched files), `lint:css` 0, `typecheck` 0, `test:unit` 243/243, `test:integration` 74/74 (previously 73/74).

**Not done:** opening the PR — that's the user's action per `.claude/rules/workflow.md`. PR title/body drafted in the session; regenerate from this file if lost. Phase 7 backlog (branch protection, coverage thresholds, MSW handlers, `jsx-a11y`, port conflicts) remains untouched, as scoped.
