---
name: new-feature
description: Scaffold a feature module under src/features/ with the full api/keys/cache/mappers/hooks convention. Use when the user wants to create a new feature, resource, or domain module in the frontend.
argument-hint: "[feature-name] [brief description]"
disable-model-invocation: true
---

# Scaffold a Feature Module

## Before writing anything

1. Read `src/features/metric-categories/` end to end. It is the reference implementation — the only feature with the complete convention applied.
2. Read `.claude/rules/architecture.md` and `.claude/rules/data-access.md`.
3. Check `src/types/api/generated/lakira-backend.d.ts` for the resource's shape. If it is not there, the backend has not shipped it — stop and confirm with the user rather than inventing a DTO.

Do **not** use `src/features/metrics/`, `data-visualizations/`, or `auth/` as templates. All three deviate from the convention in ways documented in `.claude/rules/architecture.md`.

## Structure

```
src/features/<name>/
  api.ts                 raw calls, each wrapped in withApiErrorHandling
  keys.ts                query-key factory, inputs normalized
  cache.ts               invalidation helpers
  mappers.ts             toVM(dto) → VM
  view-models.ts         XVM, XUI, XCursorPageVM
  presenters/toXUI.ts    VM → non-nullable UI shape
  types.ts               form types via z.infer<typeof schema.shape.body>
  sort.ts                sort params, defaults, filter and cursor types
  listSearchParams.ts    URL search-param contract (list features only)
  hooks/
    index.ts             barrel
    detail.query.ts
    list.cursor-page.query.ts
    create.mutation.ts
    update.mutation.ts
    delete.mutation.ts
  components/
    __tests__/
```

Omit files for concerns the feature genuinely does not have. Do not relocate a concern to a different filename.

## Order

1. **`api.ts`** — one function per endpoint. Every one wrapped:
   ```ts
   export const getX = (id: string, opts?: RequestOpts) =>
     withApiErrorHandling(() => api.get(`/x/${id}`, opts).then(unwrap), "getX");
   ```
   Takes `opts: RequestOpts` for `signal` and `headers`. POSTs accept an optional `idempotencyKey` — without it, `axios-retry` will not retry them.

2. **`view-models.ts` and `mappers.ts`** — the DTO shape stops at the mapper. Nothing downstream of `toVM` sees a DTO field name.

3. **`keys.ts`** — normalize inputs so equivalent params produce identical keys. Copy the `normalizeCursor` approach from `metric-categories/keys.ts`. Include every scoping dimension: a key missing a user or tenant scope is a cross-account leak.

4. **`cache.ts`** — named invalidation helpers. Mutations call these; they never inline `queryClient.invalidateQueries`.

5. **`hooks/`** — one file per operation, `<operation>.<kind>.ts`. Pass `signal` through so React Query can cancel. Mutations call the `cache.ts` helper in `onSuccess`.

6. **`components/`** — see `.claude/rules/styling.md` and `.claude/rules/accessibility.md`. Ariakit first for anything interactive.

7. **Zod schema**, if the feature has forms: `src/types/api/zod-<name>.schema.ts`, composing `z`-prefixed atoms from `src/constants/zod-rules.ts`, messages from `src/constants/zod-messages.ts`. See `.claude/rules/forms-and-validation.md`.

8. **Proxy allowlist** — if the backend resource requires auth, add its first path segment to the list in `src/app/api/proxy/[...path]/route.ts`. Miss this and the endpoint looks protected but is not.

## Finish

- `npm run typecheck && npm run lint` — boundary violations surface here.
- Write at least the mapper and key-factory tests. Both are pure and both are currently untested repo-wide.
- Report which files you created and which you deliberately omitted, with the reason.
