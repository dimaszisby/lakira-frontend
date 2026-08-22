---
name: new-route
description: Scaffold an App Router route, including parallel @modal slots and intercepting routes. Use when adding a page, a nested route level, or an "edit in a modal over the list" flow.
argument-hint: "[route-path] [plain|modal]"
disable-model-invocation: true
---

# Scaffold an App Router Route

This skill exists because the `@modal` pattern has a non-obvious invariant that already caused an incident: `docs/internal/incidents/fix-metric-modal-routing-20251130.md`. Read `.claude/rules/architecture.md` before starting.

## The invariant

**Every layout in a tree that contains an `@modal` slot must render `{modal}` alongside `{children}`.** If any layout between the root and the intercepting segment drops it, Next throws `Invalid interception route` — and the error names the segment, not the layout that is actually missing the render, so it is slow to diagnose.

When you add a nested route level under a modal-enabled section, that level usually needs **its own** `@modal` directory with a `default.tsx`.

## Plain route

```
src/app/(app)/<segment>/
  page.tsx              server component — awaits params/searchParams, prefetches
  _components/
    <Segment>Client.tsx   "use client" — hooks and interaction live here
    __tests__/<Segment>Client.int.test.tsx
```

Split the client boundary as deep as it will go. A `"use client"` on the page pulls the whole subtree into the bundle.

## Modal route

For "edit in a modal over the list" on `/<segment>`:

```
src/app/(app)/<segment>/
  layout.tsx                       ← MUST render {children} AND {modal}
  page.tsx
  @modal/default.tsx               ← returns null
  @modal/(.)new/page.tsx           ← intercepts /<segment>/new
  new/page.tsx                     ← the real route, on hard refresh or direct link
  [id]/
    layout.tsx                     ← MUST also render {modal}
    @modal/default.tsx
    @modal/(.)edit/page.tsx
    edit/page.tsx
```

Layout shape:

```tsx
const SegmentLayout = ({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) => (
  <>
    {children}
    {modal}
  </>
);

export default SegmentLayout;
```

`@modal/default.tsx` returns `null`. Without it, navigating to a sibling route leaves the slot unresolved.

**Both the intercepted and the real route must exist.** The `(.)` version handles in-app navigation; the plain one handles hard refresh, direct links, and back/forward across a reload. They can share a component, but both files must be present.

## Rules for the pages themselves

- `params` and `searchParams` are **Promises**. `const { id } = await params;` — never destructure synchronously in the signature.
- Server-side prefetches for protected routes need `getServerAuthHeaders()` or they 401 silently.
- Closing a modal with `router.back()` restores the cached RSC tree — pair it with `router.refresh()` or the list behind it shows stale data.
- `useRouter` and other client hooks cannot live in a file that is still a server component. Put them in the `_components/` client child.
- If the route is protected, add its top-level segment to the matcher in `middleware.ts`. The gate is not inferred from the folder structure.

## Verify

`npm run build` is the real test — `Invalid interception route` is a build-time error, and neither lint nor typecheck catches it.

Then check by hand: navigate in-app (modal appears over the list), hard-refresh on the modal URL (full page renders), close the modal (list is fresh, not stale), and use browser back.
