# Todo — Diátaxis documentation overhaul

- **Status:** Complete
- **Branch:** `feature/diataxis-docs-overhaul` (off `dev`)
- **Started:** 2026-08-22
- **Plan:** approved, mirrored in the PR description

Restructure `documents/` into `docs/` organised by [Diátaxis](https://diataxis.fr/), matching
`lakira-backend`. Four shipped quadrants plus a non-quadrant `internal/` for working material.

## Baseline (2026-08-22, before any change)

- 79 files, ~15,400 markdown lines, plus a 5,699-line generated JSON.
- **12 broken internal references** — 8 repo-root-relative, 4 relative:
  - `documents/bug-fix/fix-searchParams-and-cookies-20251130.md`
  - `documents/documentation/testing-plan.md`
  - `documents/documentation/unit-test-plan.md`
  - `documents/routings/next-router-plan.md`
  - `documents/security/control-matrix.md`
  - `documents/security/security-audit-log.md`
  - `documents/security/security-audit-plan.md`
  - `documents/security/threat-model.md`
  - `documentation/performance-budget.md:13,165` → `../checklists/performance-release-checklist.md`
  - `tests-plans-and-logs/TESTING_STRATEGY.md:247,401` → same
- 189 bare backticked `documents/…` mentions across 39 files.

Target: **0 broken references.**

## Phases

Each phase ends with a green gate before the next begins. One commit per phase.

- [x] **Phase 0 — Working branch and baseline**
  - [x] Branch off `dev` → `feature/diataxis-docs-overhaul`
  - [x] Confirm no `.gitignore` pattern swallows `docs` (`git check-ignore` → exit 1)
  - [x] Record baseline link-rot count (12)

- [x] **Phase 1 — `git mv documents docs`, repoint every consumer**
  - [x] `.claude/hooks/protect-files.sh:42`
  - [x] `.prettierignore`
  - [x] `scripts/api/sync-openapi-spec.mjs:35`
  - [x] `scripts/api/generate-api-types.mjs:22` + regenerate the stamped `Source:` header
  - [x] `.claude/rules/documentation.md` `paths:` frontmatter → `docs/**`
  - [x] Prose sweep: 58 files swept; OpenAPI snapshot moved to `docs/reference/api/`
  - [x] Fixed 8 pre-existing broken refs (security/, routings/, bug-fix/, testing-plan) — unrelated
        to the rename, but the gate surfaced them
  - [x] **Gate:** `api:spec:check`, `api:types:check`, `typecheck` all green; root-relative
        link sweep 8 → **0**

- [x] **Phase 2 — Reshape into quadrants + `internal/`**
  - [x] `tutorials/`, `how-to/`, `reference/`, `explanation/`, `internal/`
  - [x] `component-implementation-playbook.md` → `how-to/development/` (it is a how-to)
  - [x] `checklists/` → `how-to/releases/`
  - [x] Split `accessibility-guidelines.md` and `performance-budget.md` (criteria vs rationale)
  - [x] Security audit runs move verbatim — no reformatting
  - [x] **Gate:** link sweep back to 0

- [x] **Phase 3 — Prune**
  - [x] Delete `lakira-backend-types.md` (2,016 lines, superseded by generated OpenAPI)
  - [x] Delete `next-router-task-promt.md` (a raw LLM prompt)
  - [x] Delete `feature-implementation-checklist.md` (empty)
  - [x] Delete `3-integration-tests/CHEKLIST.md` (typo-compat pointer)
  - [x] Fix `performance-release-cheklist.md` typo + its 4 inbound links
  - [x] Normalize `todos/` onto `YYYY-MM-DD-todo-<slug>.md`

- [x] **Phase 4 — Rewrite the reference layer**
  - [x] `commands.md` verified against all 30 `package.json` scripts
  - [x] `configuration.md` (new) — env matrix + the `NEXT_PUBLIC_*` exposure rule
  - [x] `design-tokens.md` (new) — six layers in load order, `data-theme` mechanism
  - [x] `routes-and-proxy.md` (new) — route map, `@modal` invariant, proxy auth allowlist
  - [x] `reference/api/README.md` (new)

- [x] **Phase 5 — ADR registry**
  - [x] Triage 76 kit-local ADRs → promote ~12–15 durable ones
  - [x] Renumber from `adr-0001` by original decision date
  - [x] Preserve the ADR-003 → ADR-004 supersede pair with `Related` lines both ways
  - [x] Stubs left behind + `Origin:` backlinks
  - [x] `decisions/README.md` five-column registry index

- [x] **Phase 6 — Author new content**
  - [x] `tutorials/getting-started.md`
  - [x] `tutorials/your-first-feature-slice.md`
  - [x] `tutorials/your-first-component.md`
  - [x] Rewrite root `README.md` (still create-next-app boilerplate)
  - [x] `explanation/architecture/` with rendered Mermaid diagrams

- [x] **Phase 7 — Realign agent configuration**
  - [x] Rewrite `.claude/rules/documentation.md` (drop the "does not use Diátaxis" section)
  - [x] `<!-- PLACEMENT-TABLE:START/END -->` markers, byte-identical in `doc-writer.md`
  - [x] Update `CLAUDE.md`
  - [x] Retire `dev-documentation-guidelines.md` → `explanation/documentation-standards.md`

## Status

**Complete — 2026-08-22.** All eight phases landed on `feature/diataxis-docs-overhaul`.

### Outcome

|                   | Before             | After                                |
| ----------------- | ------------------ | ------------------------------------ |
| Folder            | `documents/`       | `docs/`                              |
| Taxonomy          | by artifact type   | Diátaxis + `internal/`               |
| Files             | 79                 | 116                                  |
| Broken references | 12                 | **0**                                |
| Tutorials         | 0                  | 3                                    |
| How-to guides     | 0 labelled         | 14                                   |
| ADR registry      | 76 in one kit file | 14 flat records + 62 left in the kit |

### Deviations from the approved plan

1. **`accessibility-baseline.md` and `performance-budget.md` went to `reference/`, not
   `explanation/`.** The plan assumed a split into criteria (reference) and rationale
   (explanation). On reading them, both are dominantly specification — numbered thresholds and
   criteria you look up while building — and a split would have produced a thin, artificial
   explanation half. The plan's own fallback allowed keeping them whole; `reference/` is the
   quadrant that matches their actual mode.
2. **Baseline link rot was 12, not the 4 predicted.** The extra 8 were pre-existing references to
   `docs/security/*`, `docs/routings/*`, and `docs/bug-fix/*` — paths that had drifted long before
   this work. All repointed to real targets. One (a "prompt library" under the old security folder) never existed
   and is now described as unwritten rather than linked.
3. **`eslint.config.mjs` needed repointing.** It carries a `documents/todos/...` path in a comment,
   which the markdown-and-shell sweep missed. Found by a full-repo grep.

### Verified

- Both link sweeps (root-relative and relative) print nothing.
- No `documents/` string survives anywhere outside git history.
- `api:spec:check`, `api:types:check`, `typecheck`, `lint` (0 errors), `lint:css` all green.
- `test:unit` — 55 suites, 243 tests, all passing.
- All 5 Mermaid diagrams rendered with `@mermaid-js/mermaid-cli` 11.16.0, not eyeballed.
- `protect-files.sh` blocks the OpenAPI snapshot at its new path.
- Placement table byte-identical between `.claude/rules/documentation.md` and
  `.claude/agents/doc-writer.md`.

### Not done

- **`getting-started.md` has not been executed end to end from a clean clone.** Every fact in it was
  verified against source, but the tutorial-truth test needs a fresh clone and a real registration
  against the staging backend.
- **No `.env.example`.** The tutorial writes `.env.local` inline instead. Adding one is a repo
  change beyond this restructure; worth a follow-up.
- **No CI link checker.** The sweep is manual, by design — it was an explicit non-goal.
