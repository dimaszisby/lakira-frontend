# Layers and boundaries

The import graph is enforced, not merely documented. `eslint-plugin-boundaries` in
`eslint.config.mjs` fails the build on a violation.

```mermaid
graph TD
    app["app<br/><i>routes, handlers</i>"]
    features["features<br/><i>domain slices</i>"]
    components["components<br/><i>design system</i>"]
    services["services<br/><i>axios, atoms</i>"]
    lib["lib"]
    utils["utils"]
    types["types"]
    generics["generics<br/><i>dependency-free</i>"]

    app --> features
    app --> components
    app --> services
    app --> lib
    app --> utils
    features --> components
    features --> services
    features --> types
    components --> lib
    components --> types
    services --> lib
    services --> types
    lib --> utils
    utils --> generics
    types --> generics

    style generics fill:#a8c28b,stroke:#7c9b63,color:#1a1a1a
    style app fill:#e897a3,stroke:#c76576,color:#1a1a1a
```

Arrows point _may import_. The graph is acyclic, and `generics` is the sink — it depends on nothing,
which is what makes it safe to import from anywhere.

## Why this shape

The direction encodes stability. A layer may only depend on something more stable than itself.
`app` changes every time a route is added; `generics` changes almost never. Inverting an arrow would
let a rendering concern force a change in a pure utility.

## Two rules that surprise people

- **A feature may not import another feature.** Domains stay independently movable. The only legal
  cross-feature surface is `src/features/shared/`, which holds exactly three things:
  `buildQueryString`, `buildCursorQueryString`, and `CursorListParams`.
- **`app → types` is not allowed.** Route files reach DTOs through the feature that owns them, so
  that a route never binds directly to the wire format.

## The quarantine, now empty

`src/components/**` was unmapped in `boundaries/elements` until 2026-08-17, so the `components`
boundary never ran and 18 inversions accumulated. When the rule went live, six files were exempted
at the bottom of `eslint.config.mjs`. None is exempt now, and the three ways off the list are all
visible in its history.

- `CategorySelect.tsx` and `Visualization.tsx` left on 2026-09-11 by being **moved** into the
  feature modules they were reaching into.
- `withAuth.tsx` and `HydrateUser.tsx` left on 2026-09-22 by being **deleted**: `HydrateUser` was
  referenced nowhere, and `withAuth` guarded a single route that `src/proxy.ts` and
  `(app)/layout.tsx` already gate, while duplicating a profile fetch the page was making anyway.
  An inversion that exists only to serve dead code is removed, not inverted.
- `Header.tsx` and `Sidebar.tsx` left on 2026-10-13 by being **inverted**. `Sidebar` is handed its
  sign-out handler as props, and `src/app/(app)/_components/AppShell.tsx`, a route file that may
  import a feature, owns the mutation. `Header` lost a signed-in check that hid nothing on load
  (kit `unquarantine-layout-files`, D-01 and D-02).

**Do not start a new list.** A component that needs application state takes it as props from the
caller above it.
