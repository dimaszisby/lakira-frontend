# Code Style

## Formatting

Prettier owns formatting — do not hand-format. `.prettierrc.json`: double quotes, semicolons, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`, LF.

`.claude/hooks/format-on-edit.sh` runs Prettier (and Stylelint for CSS) after every edit, so formatting drift should never reach a commit.

## Components

- **Arrow functions only.** `react/function-component-definition` is an error for both named and unnamed components.
- **Never inline an anonymous component in `memo()`.** Name it first, wrap at export:

  ```tsx
  const MetricCard = ({ metric }: Props) => { … };
  export default memo(MetricCard);
  ```

  Three `no-restricted-syntax` selectors enforce this — `export default memo(() => …)`, `export default React.memo(() => …)`, and `const X = memo(() => …)` all error.

- `react-refresh/only-export-components` warns when a component file exports non-components. Constants are exempt; move anything else out.

## Imports

- `simple-import-sort` owns order. Run `lint:fix` rather than reordering by hand.
- Type imports are inline: `import { type Foo } from "..."` (`consistent-type-imports` with `fixStyle: "inline-type-imports"`).
- Use path aliases, not deep relative paths. See `.claude/rules/architecture.md` for the list and the two hazards.

## TypeScript

Type-aware rules are on and are errors, not warnings:

- `@typescript-eslint/no-floating-promises` — every promise is awaited, returned, or explicitly voided.
- `@typescript-eslint/no-misused-promises` — no async function passed where a sync one is expected. This bites most often on `onClick={async () => …}`; wrap it in a sync handler that calls the async work.

Unused variables are handled by `unused-imports`, not `@typescript-eslint`. Prefix intentionally-unused with `_`.

## Naming

| Kind | Convention |
|---|---|
| Variables, functions | `camelCase` |
| Components, types, interfaces | `PascalCase` |
| Constants | `UPPER_SNAKE` |
| Files | `kebab-case`, except component files which are `PascalCase.tsx` |
| Booleans | `is*` / `has*` / `should*` |
| Feature hooks | `<operation>.<kind>.ts` — see `.claude/rules/architecture.md` |
| Zod atoms | `z`-prefixed in `src/constants/zod-rules.ts` |

## Class names

Merge with `cn()` from `src/lib/cn.ts` (clsx + tailwind-merge). Never concatenate class strings manually — `tailwind-merge` is what resolves conflicting utilities.

`tailwindcss/classnames-order` warns; `tailwindcss/no-contradicting-classname` errors. `no-custom-classname` is deliberately off because the token system defines semantic classes (`.text-body1`, `.button`) that the plugin cannot know about.

For what classes to reach for, see `.claude/rules/styling.md`.

## Logging

`no-console` allows `console.warn` and `console.error` only. `console.log` warns. Dev-only diagnostics go behind `process.env.NODE_ENV !== "production"`, matching the pattern in `src/services/api/withApiErrorHandling.ts`.

## Other active rules worth knowing

- `react/jsx-no-leaked-render` — `{count && <X/>}` renders a literal `0`. Use a ternary or `Boolean()`.
- `react/no-unstable-nested-components` — do not define a component inside another component's body.
- `promise/catch-or-return`, `promise/no-nesting`.
- `sonarjs/no-duplicate-string`, `sonarjs/prefer-immediate-return`.
- `security/detect-object-injection` is off — too noisy for frontend code.

Lint currently emits non-blocking warnings across the repo (import order, tailwind class order, react-refresh, sonarjs, react-hooks). That backlog is tracked in `docs/internal/todos/2026-02-16-todo-cicd-overview.md`. Do not add to it: leave every file you touch warning-free.
