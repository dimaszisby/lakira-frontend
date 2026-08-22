# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

This file is an **index**. The substance lives one hop away in `.claude/rules/`, each scoped by `paths:` frontmatter so it loads only when relevant. Do not restate rule content here.

## Project overview

Lakira frontend — Next.js 16 (App Router) + React 19 + TypeScript. Server state via TanStack Query, client state via Jotai, forms via React Hook Form + Zod, styling via Tailwind 3 over a CSS-variable token system, accessible primitives from Ariakit.

Pairs with `lakira-backend` (Express/TypeScript REST API). All backend calls route through `/api/proxy/[...path]`; the contract lives in `docs/reference/api/lakira-backend-openapi.json`.

Branches: `dev` (working) and `main`. No `staging`.

## Rules

| File                                                               | Covers                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| [`workflow.md`](.claude/rules/workflow.md)                         | Plan mode, branching, commit/PR ownership, self-improvement loop, verification |
| [`commands.md`](.claude/rules/commands.md)                         | Pointer to the canonical command list                                          |
| [`documentation.md`](.claude/rules/documentation.md)               | Where docs go, kit sizing, ADR promotion                                       |
| [`architecture.md`](.claude/rules/architecture.md)                 | Layer boundaries, feature-module anatomy, App Router and `@modal` routing      |
| [`code-style.md`](.claude/rules/code-style.md)                     | Formatting, component and import conventions, active lint rules                |
| [`data-access.md`](.claude/rules/data-access.md)                   | The proxy hop, error normalization, TanStack Query keys and cache              |
| [`forms-and-validation.md`](.claude/rules/forms-and-validation.md) | Zod schema organisation, RHF wiring, what Zod is and is not for                |
| [`testing.md`](.claude/rules/testing.md)                           | Two Jest configs, RTL, MSW, `jest-axe`, Cypress                                |
| [`environment.md`](.claude/rules/environment.md)                   | The `NEXT_PUBLIC_*` exposure rule and the full env matrix                      |
| [`security.md`](.claude/rules/security.md)                         | Session cookie, proxy auth allowlist, CSP, injection, secrets                  |
| [`styling.md`](.claude/rules/styling.md)                           | The six-layer token system and its hard rules                                  |
| [`accessibility.md`](.claude/rules/accessibility.md)               | WCAG 2.1 AA baseline, Ariakit-first, `jest-axe`                                |
| [`performance.md`](.claude/rules/performance.md)                   | Budgets, what costs bundle size, rendering guidance                            |

Read [`.claude/lessons.md`](.claude/lessons.md) at session start.

## Commands

Canonical list: [`docs/reference/commands.md`](docs/reference/commands.md). Do not keep a second copy anywhere.

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run test:unit
```

Those are CI's `checks` and `unit` jobs. Run them before proposing a change is complete; `/pre-push` runs the full sequence.

## Task defaults

**Commit and PR ownership:** Claude does not run `git commit`, `git push`, `git merge`, `git rebase`, or `gh pr create`. Those are the user's, manually. End every completed task with a ready-to-use PR message instead. Enforced in `.claude/settings.json` and `.claude/hooks/validate-bash.sh`.

**Branching:** always off `dev`, never `main`. `.claude/hooks/guard-branch.sh` blocks edits on `main`.

Plan mode for anything non-trivial — 3+ steps or an architectural decision.

## Agents and skills

Agents: `code-reviewer`, `test-writer`, `doc-writer`, `ci-debugger`.
Skills: `/pre-push`, `/new-feature`, `/new-route`, `/sync-api-types`.

## Documentation map

[`docs/README.md`](docs/README.md) is the entry point. `docs/` is organised by reader purpose ([Diátaxis](https://diataxis.fr/)), matching `lakira-backend`. **Placement rules: `.claude/rules/documentation.md`** — consult it before creating any document.

|                     |                                                                                   |
| ------------------- | --------------------------------------------------------------------------------- |
| `docs/tutorials/`   | Learning — getting started, first feature slice, first component                  |
| `docs/how-to/`      | Task recipes — development, testing, releases, ci-cd, security                    |
| `docs/reference/`   | Lookup — commands, configuration, design tokens, routes, API contract, components |
| `docs/explanation/` | Understanding — architecture (C4 + Mermaid), **ADR registry**, testing strategy   |
| `docs/internal/`    | Working material — initiative kits, audit runs, incidents, todos, archive         |

Worth knowing about:

- [`docs/internal/incidents/`](docs/internal/incidents/) — four postmortems covering routing, caching, prefetch, and `searchParams`. Check these before touching those areas; the causes recur.
- [`docs/explanation/testing-strategy.md`](docs/explanation/testing-strategy.md) — the full pyramid.
- [`docs/reference/components/README.md`](docs/reference/components/README.md) — UI standards, read in the order that README gives.
- [`docs/internal/todos/`](docs/internal/todos/) — active backlogs.
- [`docs/explanation/decisions/`](docs/explanation/decisions/) — 14 ADRs, one per file. Check **Status** before trusting one.
- [`docs/reference/commands.md`](docs/reference/commands.md) — canonical npm scripts. Do not keep a second copy elsewhere.

## Known state of the repo

Things a reasonable reader would otherwise assume are true, and are not:

- **Six files are exempt from the layer rule.** `src/components/**` was unmapped in `boundaries/elements` until 2026-08-17, so the `components` boundary never ran and 18 inversions accumulated. The rule is live now, with `withAuth.tsx`, `Header.tsx`, `Sidebar.tsx`, `HydrateUser.tsx`, `CategorySelect.tsx`, and `Visualization.tsx` quarantined at the bottom of `eslint.config.mjs` pending a refactor. Do not add to that list.
- **Integration tests are not MSW-backed in practice.** `src/test-utils/msw/handlers.ts` is an empty array while the server runs with `onUnhandledRequest: "error"`, so existing tests mock feature hooks at the module level instead.
- **Coverage thresholds gate nothing.** They sit at 3/2/3/3 %, and `coverage:check` only fails with `--strict`, which nothing passes.
- **The OpenAPI snapshot drifts.** Run `npm run api:spec:check` before trusting `src/types/dtos/**`.
