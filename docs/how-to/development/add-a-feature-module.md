# Add a feature module

A feature is a vertical slice: everything one domain needs, in one folder.

For a worked example built from nothing, follow
[`../../tutorials/your-first-feature-slice.md`](../../tutorials/your-first-feature-slice.md). This
page is the checklist for someone who has done it before.

## Anatomy

```
src/features/<domain>/
  api.ts               HTTP calls. The only file that touches axios.
  keys.ts              Query keys, normalized.
  cache.ts             Invalidation helpers.
  types.ts             Zod schemas + inferred types.
  mappers.ts           DTO → view model.
  view-models.ts       What components consume.
  sort.ts              Sort params and filters.
  listSearchParams.ts  URL ⇄ list state.
  presenters/          Formatting for display.
  hooks/               <operation>.<kind>.ts, plus index.ts
  components/          Components specific to this domain.
```

Not every feature needs every file. `src/features/metric-categories/` is the reference
implementation and has all of them.

## Layer rules

Enforced by `eslint-plugin-boundaries` in `eslint.config.mjs`:

```
app       → features, components, services, lib, utils, generics
features  → components, services, lib, utils, types, generics
components→ lib, utils, types, generics
services  → lib, utils, types, generics
lib       → utils, types, generics
utils     → generics ;  types → generics ;  generics → nothing
```

Two consequences that catch people out:

- **A feature may not import another feature.** The only legal cross-feature surface is
  `src/features/shared/` (`buildQueryString`, `buildCursorQueryString`, `CursorListParams`).
- **`app → types` is not allowed.** Route files reach DTOs through the feature, not directly.

Six files are quarantined with the rule disabled at the bottom of `eslint.config.mjs`. **Do not add
to that list.**

## Checklist

- [ ] Folder created with `api.ts`, `keys.ts`, `types.ts`, `mappers.ts`, `view-models.ts`
- [ ] Every API call wrapped in `withApiErrorHandling` and passing `signal`
- [ ] Keys normalized — trimmed, defaulted, empties collapsed to `undefined`
- [ ] Mutations invalidate through `cache.ts`, not inline
- [ ] Hooks named `<operation>.<kind>.ts` and re-exported from `hooks/index.ts`
- [ ] Components are arrow functions; `memo()` applied at export, never inline
- [ ] `npm run lint && npm run typecheck` clean, with no new warnings

## Related

- [`add-a-query-hook.md`](./add-a-query-hook.md)
- [`add-a-form.md`](./add-a-form.md)
- [`../../../.claude/rules/architecture.md`](../../../.claude/rules/architecture.md)
