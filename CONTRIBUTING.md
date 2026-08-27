# Contributing

## Branch Model

All changes flow through a promotion chain — never PR directly into `main`:

```
feature/<name>  →  dev  →  main
```

- **feature branches**: branch off `dev`, target `dev` in your PR.
- **dev → main**: promoted after the full pipeline is green.

This repo has **no `staging` branch** — the backend has one, the frontend does not. Do not
reference one.

Neither `dev` nor `main` has server-side protection today. `.claude/hooks/guard-branch.sh`
blocks edits while `main` is checked out and warns on `dev`; treat it as a real boundary, not
a formality.

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>

feat(metrics): add cursor-based pagination to the log table
fix(proxy): forward analytics requests with the session bearer
refactor(components): move CategorySelect into its feature module
docs(readme): add forking section
```

Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.

The history is only partly conventional — the older half is free-form, and there is no
commitlint or husky. Write conventional messages anyway; that is the direction recent history
moved in.

For AI-assisted commits, add a co-author trailer:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

## Code Style

Follow `.claude/rules/code-style.md`. Prettier owns formatting — do not hand-format.

- Double quotes, semicolons, trailing commas, 100-column width, 2-space indent, LF.
- **Arrow-function components only**; never inline an anonymous component inside `memo()`.
- Inline type imports: `import { type Foo } from "..."`.
- Path aliases over deep relative paths.
- `camelCase` variables, `PascalCase` components and types, `kebab-case` files except
  components which are `PascalCase.tsx`.
- Merge class names with `cn()` from `src/lib/cn.ts` — never concatenate class strings, or
  `tailwind-merge` cannot resolve conflicting utilities.

Run `npm run lint:fix && npm run format:fix` before committing.

Layer boundaries are enforced by ESLint (`boundaries` plugin, eight elements, error level).
Six files are quarantined from the rule pending a refactor; the list in `eslint.config.mjs`
says "do not add to this list" and means it.

## Testing

See `docs/explanation/testing-strategy.md` for the full pyramid.

```bash
npm run test:unit           # *.test.ts(x)      — excludes *.int.test.*
npm run test:integration    # *.int.test.ts(x)  — only these
npm run test:e2e            # Cypress
npm run typecheck           # tsc --noEmit
```

**The filename decides which suite a test belongs to.** Never put both kinds in one file.

New features require tests. Bug fixes should include a regression test where feasible.
Component work should carry a `jest-axe` assertion — see
`docs/reference/accessibility-baseline.md`.

## Before opening a PR

These four are CI's `checks` and `unit` jobs:

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run test:unit
```

`npm run pre-push` — available as the `/pre-push` skill — runs the full CI sequence locally.

Leave every file you touch warning-free. Lint currently emits a non-blocking warning backlog
across the repo; do not add to it.

## Forking this repo

See the "Forking" section of [`README.md`](README.md) and
[`SAAS-BASE-CHECKLIST.md`](SAAS-BASE-CHECKLIST.md) for the current readiness verdict and the
known gaps a forker inherits.

## External PRs

This project is maintained by a single developer. External pull requests are welcome but
response time is best-effort. Open an issue first for significant changes to discuss approach
before writing code.

## Security

Do not open a public issue for a security problem. See [`SECURITY.md`](SECURITY.md).
