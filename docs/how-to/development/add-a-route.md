# Add a route

App Router pages, and the `@modal` interception contract for dialogs that are also real URLs.

## A plain page

Routes live under `src/app/(app)/` for authenticated pages and `src/app/(auth)/` for login and
register. The group name is not part of the URL.

```
src/app/(app)/tags/page.tsx        →  /tags
src/app/(app)/tags/[tagId]/page.tsx →  /tags/:tagId
```

Add the URL builder to `src/lib/routes.ts` rather than writing path strings inline:

```ts
export const tagRoutes = {
  list: () => "/tags",
  detail: (tagId: string) => `/tags/${tagId}`,
  new: () => "/tags/new",
};
```

If the route should be cookie-gated, add it to `PROTECTED_PATHS` **and** the `matcher` in
`middleware.ts`. Both — the matcher decides whether middleware runs at all.

## `searchParams` and `params` are promises

In Next 16 both are async. Await them:

```tsx
const TagsPage = async ({ searchParams }: { searchParams: Promise<{ q?: string }> }) => {
  const { q } = await searchParams;
  …
};
```

Reading them synchronously is the subject of a logged incident:
[`fix-searchParams-and-cookies-20251130.md`](../../internal/incidents/fix-searchParams-and-cookies-20251130.md).

## Intercepted modal routes

A dialog that is also a shareable URL. Direct navigation renders a full page; navigation from
within the app renders a modal over the current view.

For a `/tags/new` dialog over the `/tags` list:

```
src/app/(app)/tags/
  layout.tsx          ← must render {modal}
  page.tsx
  new/page.tsx        ← the full-page version
  @modal/
    default.tsx       ← required
    (.)new/page.tsx   ← the intercepted version
```

The layout must render both slots:

```tsx
const TagsLayout = ({ children, modal }: { children: ReactNode; modal: ReactNode }) => (
  <>
    {children}
    {modal}
  </>
);

export default TagsLayout;
```

### The two invariants

Both fail loudly, and both have already caused an incident:

1. **Every layout in a tree containing an `@modal` slot must render `{modal}`.** Omit it and Next
   throws `Invalid interception route` — including layouts _above_ the one that owns the slot.
2. **Every `@modal` directory needs a `default.tsx`.** It is what renders when the slot has no
   match, such as on a hard reload. Without it the slot fails to resolve.

Postmortem:
[`fix-metric-modal-routing-20251130.md`](../../internal/incidents/fix-metric-modal-routing-20251130.md).

### Interception matchers

`(.)` matches the same level, `(..)` one level up, `(...)` from the root. Nested trees each need
their own `@modal` directory with its own `default.tsx` — see the `metrics/[metricId]/logs/@modal/`
tree for a worked example.

## Verify

```bash
npm run typecheck && npm run lint
```

Then exercise both paths in the browser: navigate from the list (expect a modal) and reload the URL
(expect a full page). A route that only works one way is the failure this pattern exists to prevent.

## Related

- [`../../reference/routes-and-proxy.md`](../../reference/routes-and-proxy.md)
- [`../../../.claude/rules/architecture.md`](../../../.claude/rules/architecture.md)
