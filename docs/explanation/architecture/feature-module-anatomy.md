# Feature module anatomy

A feature is a vertical slice: one domain, one folder, a fixed internal layout.

`src/features/metric-categories/` is the reference implementation — the one that has every file and
follows every convention. The other six deviate in small ways, noted below.

## The layout

```
src/features/<domain>/
  api.ts               HTTP. The only file that imports axios.
  keys.ts              Query keys, normalized.
  cache.ts             Invalidation helpers.
  types.ts             Zod schemas + z.infer types.
  mappers.ts           DTO → view model.
  view-models.ts       What components consume.
  presenters/          Display formatting.
  sort.ts              Sort params, filters.
  listSearchParams.ts  URL ⇄ list state.
  hooks/               <operation>.<kind>.ts + index.ts
  components/          Domain-specific components.
```

## Why the DTO/view-model split

`api.ts` returns DTOs — the wire format. `mappers.ts` converts them to view models, and components
only ever see those.

The split buys one specific thing: a backend field rename becomes a one-line change in `mappers.ts`
instead of a search across every component. It also lets the view model hold types the wire cannot —
`createdAt` is a `string` on the wire and a `Date` in the view model, so no component parses dates.

The cost is a mapping function per domain. Worth it at this size; it would not be at three fields.

## Why one file per operation

`hooks/detail.query.ts`, `hooks/create.mutation.ts`, and so on, rather than one `hooks.ts`.

The naming is `<operation>.<kind>.ts`, which makes the file list a readable inventory of what a
domain can do. It also keeps diffs small: adding pagination to a list touches one file, not the
module's entire hook surface.

The four list flavours are real and distinct:

| File                            | When                                            |
| ------------------------------- | ----------------------------------------------- |
| `list.offset.query.ts`          | Small, bounded lists where a page count matters |
| `list.cursor-page.query.ts`     | Large lists, discrete pages                     |
| `list.cursor-infinite.query.ts` | Large lists, infinite scroll                    |
| `detail.query.ts`               | One record                                      |

## Known deviations

Documented so nobody treats them as the pattern:

- **`auth/`** has no `api.ts` — it uses `src/services/api/auth.api.ts`. Legacy.
- **`metrics/`** uses `metric.api.ts` and `metric.dto.ts` rather than the bare names.
- **`data-visualizations/`** is flat: `hooks.ts`, `state.ts`, `viz-helpers.ts` instead of the
  directory layout. It also carries its own ETag response cache and calls `/analytics/*`, which the
  proxy does not auth-check.

When adding a feature, follow `metric-categories/`, not the nearest neighbour.

## Related

- [`../../how-to/development/add-a-feature-module.md`](../../how-to/development/add-a-feature-module.md)
- [`layers-and-boundaries.md`](./layers-and-boundaries.md)
