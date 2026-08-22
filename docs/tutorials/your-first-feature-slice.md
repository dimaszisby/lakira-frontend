# Your first feature slice

Build a feature module that fetches data through the proxy and renders it on a page. You will end
up with a working `tags` slice following the same anatomy as every other feature in this repo.

Start from a working app — finish [Getting started](./getting-started.md) first.

Throughout, `src/features/metric-categories/` is the reference implementation. When a step is
ambiguous, open the matching file there and copy its shape.

## What a feature module is

A vertical slice. Everything one domain needs, in one folder, with a fixed file layout:

| File                          | Holds                                                            |
| ----------------------------- | ---------------------------------------------------------------- |
| `api.ts`                      | HTTP calls. The only file that talks to axios.                   |
| `keys.ts`                     | TanStack Query keys, normalized.                                 |
| `cache.ts`                    | Invalidation helpers.                                            |
| `types.ts`                    | Zod schemas and the types inferred from them.                    |
| `mappers.ts`                  | DTO → view model.                                                |
| `view-models.ts`              | What components actually consume.                                |
| `hooks/<operation>.<kind>.ts` | One file per operation. `detail.query.ts`, `create.mutation.ts`. |
| `components/`                 | Components specific to this domain.                              |

The layer rule is enforced by `eslint-plugin-boundaries`: a feature may import from `components`,
`services`, `lib`, `utils`, `types`, and `generics` — never from another feature, and never from
`app`. The one legal cross-feature surface is `src/features/shared/`.

## 1. Scaffold

```bash
mkdir -p src/features/tags/{hooks,components}
```

## 2. Types

Zod schema first, types inferred from it. Never hand-write a type that a schema already describes.

`src/features/tags/types.ts`:

```ts
import { z } from "zod";

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export type TagDTO = z.infer<typeof tagSchema>;
```

## 3. The API layer

`src/features/tags/api.ts`. This is the only file in the slice that touches axios, and it goes
through the shared client so error normalization and retries apply:

```ts
import api from "@/services/api/api";
import { withApiErrorHandling } from "@/services/api/withApiErrorHandling";
import type ApiResponse from "@/types/generics/ApiResponse";

import { type TagDTO } from "./types";

type RequestOpts = { signal?: AbortSignal; headers?: Record<string, string> };

export const getTags = async (opts: RequestOpts = {}): Promise<TagDTO[]> =>
  withApiErrorHandling(async () => {
    const res = await api.get<ApiResponse<TagDTO[]>>("/tags", {
      signal: opts.signal,
      headers: opts.headers,
    });
    return res.data.data;
  }, "getTags");

export const getTagById = async (tagId: string, opts: RequestOpts = {}): Promise<TagDTO> =>
  withApiErrorHandling(async () => {
    const res = await api.get<ApiResponse<TagDTO>>(`/tags/${tagId}`, {
      signal: opts.signal,
      headers: opts.headers,
    });
    return res.data.data;
  }, "getTagById");
```

Three things are load-bearing here:

- **`api` is a default export.** `import { api }` will not resolve.
- **`withApiErrorHandling` wraps every call.** It turns an axios failure into a
  `NormalizedApiError` — `{ isAbort, status, code, title, messages[], retryable, raw }` — so
  components never branch on axios internals. The second argument is the label that appears in
  dev-only diagnostics.
- **`signal` is passed through.** Without it, TanStack Query cannot cancel an in-flight request when
  a component unmounts, and an aborted fetch surfaces as an error instead of being ignored.

The path is `/tags`, not `/api/proxy/tags`. The axios instance already has the proxy as its base
URL — that is what keeps every feature from having to know about the hop.

## 4. Query keys

`src/features/tags/keys.ts`. Keys are built through one object so that invalidation can target a
prefix:

```ts
export const tagsKeys = {
  all: ["tags"] as const,
  lists: () => [...tagsKeys.all, "list"] as const,
  details: () => [...tagsKeys.all, "detail"] as const,
  detail: (tagId: string) => [...tagsKeys.details(), tagId] as const,
};
```

Nesting matters. Invalidating `tagsKeys.details()` clears every detail; invalidating
`tagsKeys.all` clears the whole domain. Building keys inline at the call site is what produces
caches that will not invalidate — one of the four logged incidents is exactly that bug.

Where a key includes filter or sort parameters, normalize them first, the way
`src/features/metric-categories/keys.ts` does: trim strings, default the optional fields, and
collapse empty values to `undefined`. Otherwise `{ q: "" }` and `{}` produce two cache entries for
one result.

## 5. View models and mappers

Components consume a view model, not a DTO. That keeps a backend field rename from reaching the UI.

`src/features/tags/view-models.ts`:

```ts
export type TagVM = {
  id: string;
  name: string;
  createdAt: Date;
};
```

`src/features/tags/mappers.ts`:

```ts
import { type TagDTO } from "./types";
import { type TagVM } from "./view-models";

export const toVM = (dto: TagDTO): TagVM => ({
  id: dto.id,
  name: dto.name,
  createdAt: new Date(dto.createdAt),
});
```

## 6. Hooks

One file per operation, named `<operation>.<kind>.ts`.

`src/features/tags/hooks/list.query.ts`:

```ts
import { useQuery } from "@tanstack/react-query";

import { getTags } from "../api";
import { tagsKeys } from "../keys";
import { toVM } from "../mappers";
import type { TagVM } from "../view-models";

export const useTags = () =>
  useQuery<TagVM[], Error>({
    queryKey: tagsKeys.lists(),
    queryFn: async () => (await getTags()).map(toVM),
  });
```

`src/features/tags/hooks/detail.query.ts`:

```ts
import { useQuery } from "@tanstack/react-query";

import { getTagById } from "../api";
import { tagsKeys } from "../keys";
import { toVM } from "../mappers";
import type { TagVM } from "../view-models";

export const useTagById = (tagId: string) =>
  useQuery<TagVM, Error>({
    queryKey: tagsKeys.detail(tagId),
    queryFn: async () => toVM(await getTagById(tagId)),
    enabled: !!tagId,
  });
```

`enabled: !!tagId` is not optional. Without it the query fires with an undefined id during the
first render of a dynamic route and caches the failure.

Re-export from `src/features/tags/hooks/index.ts`:

```ts
export * from "./detail.query";
export * from "./list.query";
```

## 7. Render it

`src/app/(app)/tags/page.tsx`:

```tsx
"use client";

import { useTags } from "@/features/tags/hooks";

const TagsPage = () => {
  const { data, isPending, error } = useTags();

  if (isPending) return <p>Loading…</p>;
  if (error) return <p role="alert">{error.message}</p>;

  return (
    <ul>
      {data.map((tag) => (
        <li key={tag.id}>{tag.name}</li>
      ))}
    </ul>
  );
};

export default TagsPage;
```

Components are arrow functions — `react/function-component-definition` errors on `function`
declarations.

## 8. Check it

```bash
npm run lint && npm run typecheck
```

Lint is where a layer violation shows up. If you imported from another feature, or from `app`,
`eslint-plugin-boundaries` fails here with the rule that was broken.

Visit <http://localhost:3000/tags>. The backend has no `/tags` endpoint, so you will see the error
branch render — that is the slice working end to end: the request went through the proxy, came back
as a normalized error, and the component handled it.

## What you built

```
src/features/tags/
  api.ts  keys.ts  types.ts  mappers.ts  view-models.ts
  hooks/  index.ts  list.query.ts  detail.query.ts
```

## Where to go next

- [`../how-to/development/add-a-form.md`](../how-to/development/add-a-form.md) — wire React Hook
  Form and Zod, and map server field errors back onto inputs.
- [`../reference/routes-and-proxy.md`](../reference/routes-and-proxy.md) — the `@modal` contract for
  intercepted dialogs.
- [`../../.claude/rules/data-access.md`](../../.claude/rules/data-access.md) — cache invalidation in full.
