# docs diet — Checklist

What is read every time, slimmed; finished records left in place ([D-01](decisions.md)). Sizes
measured with `wc -c` on `dev` at `168291f` and on this branch.

## Register

- [x] `frontend-debt-register/register-closed.md`: the 53 closed rows, verbatim, under a short
      header. `register.md` keeps open rows, the owner questions and the notes, and points to it
- [x] `src/__tests__/register-todos.test.ts` failed on the split (no `## Closed`), then was
      rewritten. Every table row of `register.md` is open, and a new case fails when a row id is in
      both files. That case was seen failing with F-65 appended to the closed file, and passing
      once the file was restored
- [x] Register D-05; `.claude/rules/workflow.md` § What's next and the register README follow

## Lessons promoted

Each lesson is condensed into its rule file with its date, then removed from
`.claude/lessons.md`:

| Lesson                                                      | Now in                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| 2026-08-17 The components layer boundary was never enforced | already in `architecture.md` and CLAUDE.md; removed only |
| 2026-08-17 The OpenAPI snapshot drifted 12 paths behind     | already in CLAUDE.md and the gate table; removed only    |
| 2026-09-11 A styling sweep without a mechanism              | `styling.md`, enforced-by-review list                    |
| 2026-09-12 The edge session gate had never run              | `architecture.md`, Next 16 gotchas                       |
| 2026-09-15 Re-adding a path `git mv` already staged         | `workflow.md`, Handing over                              |
| 2026-09-15 A test that passes before the fix                | `testing.md`, Rules                                      |
| 2026-09-23 An escape sequence through an editing tool       | `code-style.md`, Editing hazards (new)                   |
| 2026-09-24 A long staging line wrapped on paste             | `workflow.md`, Handing over                              |
| 2026-09-27 A merge reported verified before its `dev` run   | `workflow.md`, What's next                               |
| 2026-09-28 A realistic fake token tripped the secret scan   | `testing.md`, Rules                                      |
| 2026-09-29 A handover with `cd`                             | `workflow.md`, Handing over                              |
| 2026-09-30 Started a task without naming its size           | already in `workflow.md`; removed only                   |
| 2026-10-01 The other external-drift gate                    | `workflow.md`, under the gate table                      |
| 2026-10-01 A finished run reported as stuck                 | `workflow.md`, What's next                               |
| 2026-10-21 "What's next" taken as a go                      | `workflow.md`, What's next                               |

## Kits

- [x] `docs/internal/initiatives/README.md`: Active (2), Done (31) and earlier programmes (5),
      38 folders, each Done kit with its merge PR. `docs/README.md` links to it
- [x] Merge PR appended to the stale status of `api-error-messages`, `chart-text-summary`,
      `drop-withauth`, `form-shows-latest-error`, `list-variant-breakpoint`, `org-switcher`,
      `profile-load-errors`, `route-error-boundaries`, `table-row-accessible-name` and
      `unquarantine-layout-files`. Wording unchanged. `theme-switching` already named #35
- [x] `main-release-branch`: the last acceptance box ticked with #147's evidence, status Done; the
      promotion how-to notes that "CI passed" is matched by commit
- [x] `.claude/rules/documentation.md`: acceptance criteria are written so the PR itself can meet
      them

## Discovered

- [x] Found: five folders (`analytics`, `cicd`, `components-overhaul`, `routing`,
      `tests-overhaul`) predate the kit format and have no merge PR → in scope, listed as earlier
      programmes, state as their own files say
- [x] Found: a `grep` for NUL bytes counted every line, because the shell cannot pass a NUL in an
      argument → the scan was redone in Python; no changed file has control bytes

## Acceptance

- [x] `register.md` holds open rows only, at 15 KB or less, and `register-closed.md` holds all 53
      closed rows verbatim. _Why:_ "what's next" reads `register.md` in full. · `wc -c`: 14,504
      bytes, down from 51,086; the closed file's table equals the removed section, moved by
      script; `register-todos` passes with 3 cases
- [x] `.claude/lessons.md` holds no lesson, and each one can be found in its rule file. _Why:_ the
      log loads every session, and a lesson that has proven true belongs in the rules
      (`workflow.md` § Self-improvement loop). · The table above; `lessons.md` is 578 bytes
- [x] The always-loaded set is smaller. _Why:_ it is read every session. · 32,253 bytes, down from
      45,795
- [x] The index lists all 38 folders, and no kit status says "on the branch", "pending merge",
      "Implementation complete" or "In review" without its merge PR, apart from this kit's own
      status until it merges. · `grep` on every kit README
- [x] Every relative Markdown link in a changed or new file resolves. · A short script in the
      scratchpad, run on this branch

## Gates

Run 2026-10-23 on Node 24.21.0.

- [x] lint
- [x] typecheck
- [x] format
- [x] unit tests, 1133, including the rewritten `register-todos` (3 cases) and `commands-doc`
- [x] build
- [x] `security:audit`, 0 vulnerabilities; `api:types:check` in sync
- [ ] spec drift: `api:spec:check` red on 2026-10-23. Backend #215 (`7acd1f9`, 08:18Z) added
      `GET /health` and `GET /ready`, 413 and 415 on 22 operations, and narrowed
      `RateLimitError.status` to `"fail"`. Not caused by this branch
- [ ] css lint, integration, e2e, e2e (csp), e2e (stack) and e2e (csp, stack): skipped, since no
      application code, style or contract changed
