# Add a query hook

One file per operation, named `<operation>.<kind>.ts`, inside the feature's `hooks/`.

## Naming

| File                                                               | Operation                          |
| ------------------------------------------------------------------ | ---------------------------------- |
| `detail.query.ts`                                                  | Fetch one record                   |
| `list.offset.query.ts`                                             | Offset-paginated list              |
| `list.cursor-page.query.ts`                                        | Cursor pagination, discrete pages  |
| `list.cursor-infinite.query.ts`                                    | Cursor pagination, infinite scroll |
| `create.mutation.ts` / `update.mutation.ts` / `delete.mutation.ts` | Writes                             |

Re-export everything from `hooks/index.ts`.

## Keys come from `keys.ts`

Never build a key inline. Keys nest so that invalidation can target a prefix:

```ts
export const tagsKeys = {
  all: ["tags"] as const,
  lists: () => [...tagsKeys.all, "list"] as const,
  details: () => [...tagsKeys.all, "detail"] as const,
  detail: (id: string) => [...tagsKeys.details(), id] as const,
};
```

**Normalize parameters before they enter a key.** Trim strings, default optionals, collapse empties
to `undefined` — see `src/features/metric-categories/keys.ts`. Otherwise `{ q: "" }` and `{}` cache
the same result twice, and invalidating one leaves the other stale.

## Queries

```ts
export const useTagById = (tagId: string) =>
  useQuery<TagVM, Error>({
    queryKey: tagsKeys.detail(tagId),
    queryFn: async ({ signal }) => toVM(await getTagById(tagId, { signal })),
    enabled: !!tagId,
  });
```

- **Pass `signal` through** to the API layer, or an unmounted component's request cannot be
  cancelled and surfaces as an error.
- **`enabled: !!id`** on anything keyed by a route param. Without it the query fires with
  `undefined` on first render of a dynamic route and caches the failure.
- **Map to a view model** in `queryFn`. Components consume view models, not DTOs.

## Mutations invalidate through `cache.ts`

```ts
export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTag,
    onSuccess: () => invalidateTagLists(queryClient),
  });
};
```

Keep invalidation helpers in the feature's `cache.ts` so the set of things a write touches is
declared in one place. Invalidating from the call site is how a mutation ends up refreshing the list
but not the detail — two of the four logged incidents are cache-staleness bugs of this shape.

## Verify

```bash
npm run lint && npm run typecheck
```

Lint is where a layer violation appears: a feature may not import from another feature or from
`app`. The only legal cross-feature surface is `src/features/shared/`.

## Related

- [`../../../.claude/rules/data-access.md`](../../../.claude/rules/data-access.md)
- [`../../internal/incidents/`](../../internal/incidents/)
