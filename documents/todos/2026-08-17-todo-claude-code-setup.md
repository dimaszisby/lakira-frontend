# 2026-08-17 — Claude Code configuration for lakira-frontend

**Purpose:** stand up a frontend-native `.claude/` configuration, ported selectively from `lakira-backend`, and close the gaps that repo has no answer for (permissions posture, API-type drift, a11y/perf/token rules).

**Status:** phases 1–6 complete. See `## Status` at the bottom.

---

## Context

`lakira-frontend` had no `.claude/` directory, no `.mcp.json`, and an untracked auto-generated `CLAUDE.md`. The sibling `lakira-backend` has a mature three-layer configuration (prompt rules → permission globs → blocking bash hooks). Roughly half of it encodes Sequelize/Express/Zod-server/OpenAPI-generation specifics with no meaning here.

Settled decisions:

- Encode the **real** test stack — Jest (two configs) + RTL + MSW + `jest-axe` + Cypress. Not Vitest/Playwright.
- Keep the existing `documents/` taxonomy. No migration to a Diátaxis `docs/` tree.
- Guard `dev` + `main` client-side; GitHub enforces nothing on this repo.
- Omit `.mcp.json`.

### Findings that shaped this work

1. **The committed OpenAPI snapshot is 12 paths stale.** `documents/openapi/lakira-backend-openapi.json` has 18 paths; `lakira-backend/docs/reference/api/lakira-backend-openapi.json` has 30. Missing: `/auth/refresh`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/switch-org`, `/organizations/{id}/invites`, `/organizations/{id}/members`, `/invites/accept`, `/memberships/{id}`, `/metric-logs/{metricId}/dummy`, `/admin/_ping`. The frontend type layer has no knowledge of multi-tenancy or the full auth lifecycle, and nothing generates types from the spec.
2. **A documented lint rule is inert.** `eslint.config.mjs` `settings["boundaries/elements"]` has no `components` entry, so the `from: "components"` rule in `boundaries/element-types` never matches. `CLAUDE.md` claims that layer is lint-enforced.
3. **`jsx-a11y` is installed but only `alt-text` is enabled**; `npm run check-accessibility` is a placeholder `echo`.
4. **No branch protection.** `dev` and `main` are both `protected=false`, zero rulesets.
5. **Global hooks already exist** at `~/.claude/hooks/` covering `.env*`, `settings.json`, `node_modules`, `npm publish`, force-push, `reset --hard`, `clean -f`, `DROP TABLE`, broad `rm -rf`. Project hooks must not re-implement these.

---

## Classification of the backend setup

### Rules — `.claude/rules/`

| Backend file       | Verdict                                 | Reason                                                                                                                                                                                    |
| ------------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workflow.md`      | **PORT**                                | Plan mode, branching, commit/PR ownership, self-improvement loop, verification-before-done are stack-agnostic; only the promotion chain changes (`feature/* → dev → main`, no `staging`). |
| `documentation.md` | **REWRITE**                             | Keep the doctrine; retarget the placement table from Diátaxis to this repo's standards/initiative two-track model.                                                                        |
| `commands.md`      | **PORT**                                | The "link, never duplicate" pattern ports verbatim; needs a canonical target created.                                                                                                     |
| `code-style.md`    | **REWRITE**                             | Prettier config differs; the ESM `.js`-extension rule is meaningless here; needs React/TSX rules instead.                                                                                 |
| `testing.md`       | **REWRITE**                             | Two Jest configs where filename decides the suite, RTL, MSW, `jest-axe`, Cypress.                                                                                                         |
| `architecture.md`  | **REWRITE**                             | `eslint-plugin-boundaries` layers + feature-module anatomy + App Router `@modal` routing — not DDD slices.                                                                                |
| `environment.md`   | **REWRITE**                             | No env validation here at all; needs the `NEXT_PUBLIC_*` exposure rule the backend has no concept of.                                                                                     |
| `api-design.md`    | **REWRITE → `data-access.md`**          | Real subject is TanStack Query + axios + the `/api/proxy` hop + error normalization.                                                                                                      |
| `validation.md`    | **REWRITE → `forms-and-validation.md`** | The `zod-rules`/`zod-messages` convention was mirrored into `src/constants/`; the OpenAPI half is dropped.                                                                                |
| `security.md`      | **REWRITE**                             | Real subject: CSP in `next.config.ts`, the `lakira_token` cookie, the proxy auth allowlist, DOMPurify, `middleware.ts`.                                                                   |
| `database.md`      | **DROP**                                | Sequelize — no analogue.                                                                                                                                                                  |
| —                  | **NEW `styling.md`**                    | Six-layer token system. No backend analogue.                                                                                                                                              |
| —                  | **NEW `accessibility.md`**              | WCAG 2.1 AA baseline, Ariakit-first, `jest-axe`. No backend analogue.                                                                                                                     |
| —                  | **NEW `performance.md`**                | Budgets already enforced in CI. No backend analogue.                                                                                                                                      |

Every rule carries `paths:` frontmatter so it loads only when a matching file is in play, and links to the standards docs under `documents/documentation/` rather than restating them.

### Agents — 4 kept, down from 9

**Kept:** `code-reviewer` (only reviewer on a solo repo), `test-writer` (two-suite convention is easy to get wrong, and `src/services/**`, `src/app/api/**`, `middleware.ts`, every feature `hooks/` have zero tests), `doc-writer` (60+ docs across 12 folders with written guidelines), `ci-debugger` (7-job serial pipeline plus a nightly perf workflow).

**Not ported:** `architecture-auditor` (wrong scale for a 291-file frontend), `ddd-inspector` (no DDD; `eslint-plugin-boundaries` enforces the analogue mechanically), `debugger` (its value was a backend request-path map; the FE equivalent fits in `CLAUDE.md`), `refactor` (built-in `/simplify`), `security-reviewer` (built-in `/security-review`; small FE security surface).

All kept agents use `memory: project` with the `MEMORY.md`-index + `**How to apply:**` convention.

### Skills — 4 kept, down from 8

**Kept:** `sync-api-types` (rewrite of `gen-openapi`), `pre-push` (CI is long and serial), `new-feature` (elaborate module convention, already drifting), `new-route` (**new** — the `@modal` invariant that caused `documents/incidents/fix-metric-modal-routing-20251130.md`).

**Not ported:** `new-migration` (Sequelize), `new-test` (folded into `test-writer`), `promote` (no `staging`, and it runs `gh pr create` against the git-ownership rule), `review` (duplicates `code-reviewer`), `security-audit` (no equivalent pipeline).

### Hooks

`protect-files.sh` and `validate-bash.sh` port but thinned to only what the global hooks do not already cover. `format-on-edit.sh` ports and adds Stylelint for `.css`/`.pcss`. The inline `tsc --noEmit` on `git commit` is dropped as dead code. `guard-branch.sh` is new.

---

## Checklist

### Phase 1 — Foundation

- [x] `documents/todos/2026-08-17-todo-claude-code-setup.md` (this file)
- [x] `.claude/hooks/protect-files.sh`
- [x] `.claude/hooks/validate-bash.sh`
- [x] `.claude/hooks/format-on-edit.sh`
- [x] `.claude/hooks/guard-branch.sh`
- [x] `.claude/settings.json` — **user action required**, see note below
- [x] `.claude/lessons.md`

> **Note on `settings.json`:** the global `~/.claude/hooks/protect-files.sh` blocks Claude from writing `.claude/settings.json` by design. The file is staged as `.claude/settings.json.proposed`; promote it with
> `mv .claude/settings.json.proposed .claude/settings.json`.

### Phase 2 — Rules

- [x] `documents/documentation/commands.md` (canonical target)
- [x] `.claude/rules/workflow.md`
- [x] `.claude/rules/commands.md`
- [x] `.claude/rules/documentation.md`
- [x] `.claude/rules/architecture.md`
- [x] `.claude/rules/code-style.md`
- [x] `.claude/rules/data-access.md`
- [x] `.claude/rules/forms-and-validation.md`
- [x] `.claude/rules/testing.md`
- [x] `.claude/rules/environment.md`
- [x] `.claude/rules/security.md`
- [x] `.claude/rules/styling.md`
- [x] `.claude/rules/accessibility.md`
- [x] `.claude/rules/performance.md`

### Phase 3 — CLAUDE.md

- [x] Rewrite as a thin index routing to `.claude/rules/*`
- [x] Fix: components-layer boundary is **not** lint-enforced (finding 2)
- [x] Fix: integration suite is not actually MSW-backed (`handlers.ts` is an empty array)
- [x] `git add CLAUDE.md` — currently untracked

### Phase 4 — Agents and skills

- [x] `.claude/agents/code-reviewer.md`
- [x] `.claude/agents/test-writer.md`
- [x] `.claude/agents/doc-writer.md`
- [x] `.claude/agents/ci-debugger.md`
- [x] `.claude/skills/pre-push/SKILL.md`
- [x] `.claude/skills/new-feature/SKILL.md`
- [x] `.claude/skills/new-route/SKILL.md`
- [x] `.claude/skills/sync-api-types/SKILL.md`

### Phase 5 — API type sync

- [x] `scripts/api/sync-openapi-spec.mjs`
- [x] `package.json` — `api:spec:sync`, `api:spec:check`, `api:types:generate`, `api:types:check`
- [x] `openapi-typescript` devDependency
- [x] `.github/workflows/test.yml` — `api-contract` job
- [x] First sync run — **separate reviewed commit**, expect a large diff

### Phase 6 — ESLint boundaries fix

- [x] `eslint.config.mjs` — add `{ type: "components", pattern: "src/components/**" }`
- [x] Resolve any violations it surfaces — **separate commit**

### Phase 7 — Follow-ups (not this session)

- [ ] Enable server-side branch protection on `dev` and `main` (user action — `gh api`)
- [ ] Raise coverage thresholds from the placeholder 3/2/3/3 %
- [ ] Populate `src/test-utils/msw/handlers.ts` — currently empty while `onUnhandledRequest: "error"`
- [ ] Enable `jsx-a11y` recommended ruleset
- [ ] Replace the `check-accessibility` placeholder script
- [ ] Reconcile the three conflicting local backend defaults (`:3000` / `:4000` / `:8001`)
- [ ] `documents/README.md` references `documents/code-review/`, which does not exist

---

## Active conventions (FYI, not action items)

- **Commit & PR ownership:** Claude does not run `git commit`, `git push`, or `gh pr create`. Each phase ends with a ready-to-paste Conventional Commits message and the exact commands.
- **Branching:** branch off `dev`, never `main`. Promotion is `feature/* → dev → main` (no `staging` in this repo).
- **Link, never duplicate:** rules link to `documents/documentation/**`; they do not restate it.

---

## Status

**2026-08-17 — Phases 1–6 landed.** Everything below was verified by running it, not by inspection.

### One item needs a manual step

`.claude/settings.json` is staged as `.claude/settings.json.proposed`. The global `~/.claude/hooks/protect-files.sh` blocks Claude from writing that path by design — confirmed by attempting it. Promote with:

```bash
mv .claude/settings.json.proposed .claude/settings.json
```

**Until that move happens the project hooks are inert**, because `settings.json` is what wires them.

### Hooks — 17 cases tested, all correct

Blocked as intended: `package-lock.json`, the OpenAPI snapshot, `src/types/api/generated/**`, `src/styles/output.css`, `.github/workflows/*`, `git add .`, `git add -A`, `git commit`, a chained `npm run lint && git push`, `gh pr create`, `git switch main`, `npx vercel`. Allowed as intended: normal source edits, `git add <path>`, `gh pr view`, `npm run test:unit`. `guard-branch.sh` warns on `dev` and blocks on `main`.

### API contract drift — the headline

The snapshot was **18 paths against the backend's 30**. Synced and regenerated:

- Added: `/auth/refresh`, `/auth/verify-email`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/switch-org`, `/organizations/{id}/invites`, `/organizations/{id}/members`, `/invites/accept`, `/memberships/{id}`, `/metric-logs/{metricId}/dummy`, `/admin/_ping`
- Changed: `/auth/logout`
- `src/types/api/generated/lakira-backend.d.ts` — 3051 lines, adds zero typecheck errors

Both gates verified in both directions: `api:spec:check` exited 1 on the stale snapshot and 0 after sync; `api:types:check` exited 1 on a tampered file and 0 after regeneration.

**The spec lives only on the backend's `dev` branch** — it is on neither `staging` nor `main`. So the contract we generate against is ahead of the staging deployment that preview builds actually call. The sync script defaults to `dev` and documents this; override with `LAKIRA_OPENAPI_BRANCH` once the backend promotes it.

A second hazard was found and closed: the script originally auto-detected a sibling `../lakira-backend` checkout, which was sitting on a feature branch. Reading a local checkout is now opt-in via `LAKIRA_BACKEND_PATH`.

### ESLint boundaries — bigger than expected

Mapping `src/components/**` surfaced **126 violations in four shapes**:

| Direction               | Count | Verdict                                   |
| ----------------------- | ----- | ----------------------------------------- |
| `features → components` | 56    | Legitimate. The declared table was wrong. |
| `app → components`      | 52    | Legitimate. The declared table was wrong. |
| `components → features` | 10    | **Genuine inversion.**                    |
| `components → services` | 8     | **Genuine inversion.**                    |

So 108 of the 126 were the rule table itself being wrong — routes and features obviously consume the shared UI layer, and the table never said so because nothing ever tested it. The table now allows both directions.

The 18 real inversions sit in six files, quarantined with a documented `boundaries/element-types: "off"` block at the bottom of `eslint.config.mjs`:

- `src/components/ui/CategorySelect.tsx`, `src/components/ui/Visualization.tsx` — feature components misfiled under `ui/`; they should move into their feature modules.
- `src/components/hoc/withAuth.tsx`, `src/components/providers/HydrateUser.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Sidebar.tsx` — app-shell concerns needing auth state; they belong under `src/app/` or need state injected.

Lint is at **0 errors, 43 warnings** (the pre-existing warning backlog).

### Pre-existing failures — not caused by this work

Both confirmed present without any of these changes:

1. **`npm run typecheck` fails on three errors** — `TextField.tsx:70`, `MetricChart.tsx:135`, `TimeRangePicker.tsx:32`. Verified identical with the generated types file removed.
2. **`Sidebar.int.test.tsx` fails** — asserts on a `text-brand-primary` class, which is the anti-pattern `.claude/rules/testing.md` warns against. No source file was touched; the 19 lockfile additions are all `openapi-typescript` transitive deps.

Consequence: **CI has been red on `dev` since 2026-07-27** (run on `7244e68`). The chain is serial, so `checks` failing means unit, integration, build, and e2e have not run in three weeks. Fixing those three type errors is the highest-value next action — it unblocks the whole pipeline.

### Gate results

| Gate               | Result                                |
| ------------------ | ------------------------------------- |
| `lint`             | 0 errors, 43 warnings                 |
| `lint:css`         | pass                                  |
| `typecheck`        | **3 errors — pre-existing**           |
| `test:unit`        | 243 passed, 55 suites                 |
| `test:integration` | 73 passed, **1 pre-existing failure** |
| `api:spec:check`   | pass                                  |
| `api:types:check`  | pass                                  |
