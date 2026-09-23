# Stale-state sweep

**Purpose:** correct todos, rules and docs whose claims no longer match the repo, and remove emoji
from the live files where they act as status markers or decoration.
**Owner:** hardini
**Branch:** `docs/stale-state-sweep` off `dev`

Every claim below was checked against the repo or CI before being changed, not taken from the
handoff that listed it.

## Stale claims

- [x] `2026-08-17-todo-claude-code-setup.md` — `docs/README.md` no longer references
      `docs/code-review/`; tick it.
- [x] Same todo — "raise coverage thresholds from the placeholder 3/2/3/3 %" is done: `jest.config.ts`
      sets 29/29/26/29, inherited by `jest.unit.config.ts`, and CI runs `test:unit:ci`.
- [x] Same todo — "populate `src/test-utils/msw/handlers.ts`" is closed as won't-do: the empty array
      is by design, per `CLAUDE.md` § Known state.
- [x] `2026-09-10-todo-npm-audit-high-critical.md` — Security Scan and E2E tests both passed on
      `dev` at `67e586d`; the cypress todo it says to close already records itself as resolved.
- [x] `docs/how-to/ci-cd/daily-pipeline-playbook.md` and `docs/reference/commands.md` — coverage
      does gate: `coverage:check` is `node scripts/coverage-checklist.mjs --strict` and CI runs it.
- [x] `CLAUDE.md` — 16 ADRs is 17.
- [x] `.claude/rules/architecture.md` — the layer table omits `constants` everywhere
      `eslint.config.mjs` allows it; closes `2026-09-20-todo-architecture-layer-table-drift.md`.
- [x] New todo for `main` sharing no history with `dev`, which today is recorded only in a session
      handoff.

## Emoji

Measured on `dev` at `2be5740`: 132 characters in 34 tracked files. Most of them are not
decoration, so the sweep is scoped by what each one is.

**Removed** — status markers and decoration in files that are live instructions or code:

- [x] `.claude/skills/pre-push/SKILL.md` — the gate report template uses a check mark per gate.
- [x] `src/styles/tokens/palette.css` — decorative emoji in section comments.
- [x] `src/utils/date-io.ts` — a warning sign in a doc comment.
- [x] `scripts/api/sync-openapi-spec.mjs`, `scripts/api/generate-api-types.mjs`,
      `scripts/coverage-checklist.mjs` — check and cross symbols in console output. Nothing parses
      that output; the exit codes carry the result.

**Kept, and why:**

- **Metric category icons are product data.** A category's icon _is_ an emoji: the Zod default in
  `src/constants/zod-rules.ts`, the default in `src/features/metric-categories/constants.ts`, the
  form placeholder, and the fixtures in 17 test files that exercise that real data shape. Removing
  them would change behaviour, not tidy text.
- **`src/types/api/generated/lakira-backend.d.ts`** is generated from the backend's OpenAPI
  examples and is never hand-edited.
- **ADR-0017** is immutable — supersede, never edit.
- **Finished initiative records** (`routing/next-router-audit.md`, the three `tests-overhaul`
  checklists, `theme-switching-plan.md`, `components-overhaul/feature-components-follow-up.md`) are
  left as written, per `.claude/rules/documentation.md` § Finished initiatives are a record.

## Discovered

- [x] Found: the layer-drift todo said `constants` "depends on nothing", but the rule allows
      `constants → constants` → in scope, the table says what the config says.
- [x] Found: `CLAUDE.md`'s coverage claim looked stale at first, because `test.yml` runs
      `coverage:check` with no flag. It is correct — `--strict` is inside the npm script. The
      playbook and `commands.md` were the stale side.

## Verification

| Gate                                 | Result                                                             |
| ------------------------------------ | ------------------------------------------------------------------ |
| `lint`                               | 0 errors, 0 warnings                                               |
| `lint:css`                           | clean (`palette.css` changed)                                      |
| `typecheck`                          | clean                                                              |
| `format`                             | clean                                                              |
| `test:unit:ci`                       | 80 suites, 669 tests, jest thresholds met                          |
| `coverage:check`                     | all five goals `PASS`; a goal raised to 99.9 prints `FAIL`, exit 1 |
| `api:types:check` / `api:spec:check` | in sync, new `OK` output (32 paths)                                |
| `test:integration`                   | skipped — not triggered                                            |
| `build`                              | passes                                                             |
| `test:e2e`                           | skipped — not triggered                                            |

No doc quotes the scripts' old output, so nothing else needed changing.

## Status

**Complete.** Two todos closed (`architecture-layer-table-drift`, `npm-audit-high-critical`), three
stale lines in `claude-code-setup` resolved, one new todo filed
(`2026-09-24-todo-main-has-unrelated-history.md`). The only runtime-adjacent change is the three
scripts' console text; their exit codes are unchanged.
