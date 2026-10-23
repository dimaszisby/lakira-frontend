# docs diet — Decisions

## D-01 — Slim what is read every time; leave finished records where they are

- **Status:** Accepted
- **Date:** 2026-10-23

**Context.** Step 1 of moving open work toward GitHub Issues. Measured on `dev` at `168291f`:
342 doc files and 34,847 lines, against 44,836 lines of source. 73% of those lines are
`docs/internal/`. 27 of 37 kits are Done, and 72 of 83 todos have no open box. But a stored file
costs nothing until someone reads it. What is read every time is the register, 51,086 bytes with
72% of it closed rows, and the always-loaded agent context. Of that context, `.claude/lessons.md`
was 16,856 bytes of 15 lessons, several already restated in the rules.

**Decision.** The owner chose on 2026-10-23:

- **The register's Closed table moves to `register-closed.md`.** This is register D-05.
- **Every lesson is promoted into the rule file it belongs to,** condensed and dated, then removed
  from `.claude/lessons.md`. Three were already stated in the rules and are only removed. The log
  keeps its header and format for new lessons.
- **Kits and todos stay where they are.** `docs/internal/initiatives/README.md` indexes the kits,
  Active, Done and the earlier programmes, with each merge PR. Stale status lines get their merge
  PR appended; their wording is not changed, since finished kits are records.
- **`main-release-branch`'s last acceptance box is closed here,** and
  `.claude/rules/documentation.md` gains the rule that acceptance criteria are written so the PR
  itself can meet them.

**Options considered.**

- _Move Done kits to `docs/internal/archive/`:_ it rewrites about 78 Markdown links, including the
  "Origin" line of 34 ADRs, which are immutable. It saves no reading, since nothing reads a
  finished kit unless it is linked.
- _Move finished todos to `todos/done/`:_ it breaks about 21 links, some in ADRs. The register
  already names the 11 open ones, and `register-todos` enforces it.
- _Delete finished todos,_ which the rules allow: the same broken links, and about 230 mentions by
  filename would point at nothing.
- _Keep lessons and only delete those already in the rules:_ the log would keep growing as a
  second rulebook, loaded every session, which `workflow.md` § Self-improvement loop says to
  avoid.

**Consequences.**

- `register.md` is 14,504 bytes, down from 51,086. A closing PR edits two files.
- The always-loaded set (`CLAUDE.md`, `workflow.md`, `code-style.md`, `commands.md`,
  `lessons.md`) is 32,315 bytes, down from 45,795. `workflow.md` grew by 2,271 bytes with the
  promoted handover, gate and "what's next" lessons. Three lessons now live in path-scoped rules
  (`testing.md`, `styling.md`, `architecture.md`), which load only when matching files are
  touched.
- `docs/internal/` is as large as before. Its weight was never what cost.
