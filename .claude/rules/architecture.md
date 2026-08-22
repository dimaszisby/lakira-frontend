---
paths:
  - src/app/**
  - src/features/**
  - src/components/**
  - src/services/**
  - src/lib/**
  - src/utils/**
  - src/generics/**
  - src/types/**
  - eslint.config.mjs
---

# Architecture

## Layer boundaries

Enforced by `eslint-plugin-boundaries` in `eslint.config.mjs`. Violating this fails `npm run lint`.

```
app        → features, components, services, lib, utils, generics
features   → components, services, lib, utils, types, generics
components → lib, utils, types, generics
services   → lib, utils, types, generics
lib        → utils, types, generics
utils      → generics
types      → generics
generics   → (nothing)
```

`generics` is the dependency-free base; `app` (routes) sits at the top. `components` is the shared design-system layer — **`app` and `features` consume it, and it must never reach back up into either.** A UI primitive that needs to know about a feature is not a primitive; it belongs in that feature.

Feature-specific UI lives in `src/features/<name>/components/`; route-specific UI lives in `src/app/**/_components/`; only genuinely shared, feature-agnostic UI belongs in `src/components/`.

Three things to know about the enforcement:

- The rule set is disabled for `**/*.{test,spec}.{ts,tsx}` and `cypress/**`.
- `app → types` is **not** in the allow list. Route files that need a DTO type should reach it through the feature module.
- **Six files are quarantined** at the bottom of `eslint.config.mjs` with the rule turned off — `withAuth.tsx`, `Header.tsx`, `Sidebar.tsx`, `HydrateUser.tsx`, `CategorySelect.tsx`, `Visualization.tsx`. They are known inversions awaiting a refactor. Do not add to that list, and do not copy their import pattern.

If you add a directory that should be its own layer, add it to **both** `settings["boundaries/elements"]` and the `boundaries/element-types` rules. A `from: <type>` rule with no matching `elements` entry silently matches nothing — that exact mistake left the `components` layer unenforced until 2026-08-17, and 18 inversions accumulated behind it (see `.claude/lessons.md`).

## Feature modules

A feature under `src/features/<name>/` uses this anatomy. Not every file is required, but when a concern exists it goes in the named file — do not invent a new location for it.

| File | Holds |
|---|---|
| `api.ts` | Raw calls. Every function wrapped in `withApiErrorHandling(fn, "name")` and unwrapped with `unwrap(res)`. Takes `opts: RequestOpts` (`{signal, headers}`); POSTs may take an `idempotencyKey`. |
| `keys.ts` | Query-key factory. Normalize inputs (see `normalizeCursor` in `metric-categories/keys.ts`) so equivalent params produce identical keys. |
| `cache.ts` | Invalidation helpers, e.g. `invalidateMetricCategoryLists(qc)`. Mutations call these; they do not inline `queryClient.invalidateQueries`. |
| `mappers.ts` | `toVM(dto) → VM`. DTO shape stops here. |
| `presenters/` | VM → strictly-non-nullable UI shape. |
| `view-models.ts` | `XVM`, `XUI`, `XCursorPageVM`. |
| `types.ts` | Form types derived from the Zod schema. |
| `sort.ts` | Sort params, defaults, filter and cursor-page types. |
| `listSearchParams.ts` | The URL search-param contract for list state. |
| `hooks/` | One file per operation, named `<operation>.<kind>.ts` — `detail.query.ts`, `create.mutation.ts`, `list.cursor-page.query.ts`, `list.cursor-infinite.query.ts`, `list.offset.query.ts`. Re-exported from `hooks/index.ts`. |
| `components/` | Feature UI plus `components/__tests__/`. |

**Known deviations** — match the convention above for new work, do not copy these: `metrics` keeps a local `metric.api.ts` / `metric.dto.ts` instead of using `api.ts` and `src/types/dtos/`; `data-visualizations` is flat (`hooks.ts`, `state.ts`, `viz-helpers.ts`); `auth` has no `api.ts` and uses `src/services/api/auth.api.ts`.

Cross-feature imports are allowed only through `src/features/shared/` (`buildQueryString`, `buildCursorQueryString`, `CursorListParams`).

## Routing — App Router

App Router only. There is no `src/pages`. Route groups: `(app)` for the authed shell, `(auth)` for login/register.

### Parallel `@modal` slots + intercepting routes

List/detail pages that support "edit in a modal over the list" use parallel routes with intercepting segments:

```
metric-categories/
  @modal/default.tsx
  @modal/(.)new/page.tsx              ← intercepts /metric-categories/new
  [categoryId]/@modal/(.)edit/page.tsx
  new/page.tsx                        ← the real route, e.g. on hard refresh
  [categoryId]/edit/page.tsx
```

**Every layout in a tree that has an `@modal` slot must render `{modal}` alongside `{children}`**, or Next throws `Invalid interception route`. When adding a nested route level under a modal-enabled section, check whether it needs its own `@modal` + `default.tsx` pair. See `docs/internal/incidents/fix-metric-modal-routing-20251130.md`.

Use `/new-route` to scaffold these — it holds the invariant so you do not have to.

### Next 16 gotchas, all from logged incidents

- `params` and `searchParams` are **Promises**. Always `await` them; never destructure synchronously.
- Server-side fetches for protected routes go through `/api/proxy/[...path]` and must forward the `lakira_token` cookie via `getServerAuthHeaders()`. An SSR prefetch without it silently 401s.
- Closing an edit modal with `router.back()` restores the cached RSC tree. Pair it with `router.refresh()` or the parent route shows stale data.
- Client-only hooks (`useRouter`, `useState`, …) cannot live in a file that is still a server component. Split out a client child.

## Path aliases

`@/features/*`, `@/services/*`, `@/api/*` (→ `src/services/api/*`), `@/lib/*`, `@/utils/*`, `@/generics/*`, `@/types/*`, `@/hooks/*`, `@/constants/*`, `@/components/*`, `@/ui/*` (→ `src/components/ui/*`), `@/app/*`, `@/styles/*`, `@/src/*`.

Declared in **both** `tsconfig.json` and `jest.config.ts` `moduleNameMapper` — adding one means editing both.

Two hazards: the same module is currently reachable three ways (`@/services/api/api`, `@/src/services/api/api`, `@/api/api`) — prefer the most specific alias and stay consistent within a file. And `@/validators/*` is declared but `src/validators/` does not exist; do not use it.
