# Routes and the proxy

The route map, the `@modal` interception contract, and how a browser request reaches the backend.

## The request path

Every backend call makes the same hop. There is no direct browser→backend request:

```
component → query hook → feature api.ts → axios (src/services/api/api.ts)
          → /api/proxy/[...path] → lakira-backend
```

The proxy exists so the session token never reaches client JavaScript. It lives in an httpOnly
cookie (`lakira_token`) that only the server can read.

## The proxy handler

`src/app/api/proxy/[...path]/route.ts`. One handler exported as GET, POST, PUT, PATCH, DELETE, and
OPTIONS.

**Base URL resolution**, in order:

```
API_URL  →  NEXT_PUBLIC_API_BASE_URL  →  http://localhost:8001/api/v1
```

Prefer `API_URL`: it is server-only, so it never ships to the browser. See
[`configuration.md`](./configuration.md).

**What it does per request:**

1. Joins the catch-all segments onto the base URL and copies the query string across.
2. Reads the `lakira_token` cookie. If present, sets `Authorization: Bearer <token>`; if absent,
   explicitly deletes any inbound `Authorization` header rather than forwarding it.
3. Forwards all headers except `connection`, `content-length`, and `host`.
4. Streams the request and response bodies (`duplex: "half"`), so uploads are not buffered.
5. Uses `redirect: "manual"` — upstream redirects are passed through, not followed.

**Auth enforcement** is an allowlist of _first_ path segments:

```
metrics · metric-categories · metric-logs · metric-settings · users
```

A request whose first segment is in that set and which has no token gets a `401` without reaching
the backend.

> **`analytics/*` is not in the allowlist**, so those requests are forwarded regardless of whether a
> token is present. The backend is the only thing enforcing auth on that path.

## Middleware

`middleware.ts` cookie-gates the page routes, separately from the proxy:

```
/dashboard  ·  /metrics  ·  /metric-categories  ·  /account
```

matched as `/<path>/:path*`. An unauthenticated request is redirected to
`/login?returnUrl=<target>`.

## SSR must forward the cookie

A server component fetching from the proxy does **not** automatically carry the browser's cookies.
It must forward them explicitly via `getServerAuthHeaders()` in `src/services/api/serverHeaders.ts`.

Forgetting this produces a silent `401` rather than an error — the page renders empty instead of
failing loudly. Two of the four logged incidents trace back to this class of bug; see
[`../internal/incidents/`](../internal/incidents/).

## Route map

Two route groups: `(app)` for the authenticated shell, `(auth)` for login and register.

```
src/app/
  (auth)/           login/  register/
  (app)/
    account/
    dashboard/
    metrics/
      new/  [metricId]/{edit, logs/{new, [logId]}, settings/edit}
      @modal/{default, (.)new, (.)[metricId]/edit}
      [metricId]/@modal/{default, (.)edit}
      [metricId]/logs/@modal/{default, (.)new, (.)[logId]}
      [metricId]/settings/@modal/{default, (.)edit}
    metric-categories/
      new/  [categoryId]/{edit, metrics/{new, [metricId]}}
      @modal/{default, (.)new, (.)[categoryId]/edit}
      [categoryId]/@modal/{default, (.)edit}
      [categoryId]/metrics/@modal/{default, (.)new, (.)[metricId]}
  api/
    proxy/[...path]/    auth/{login,logout,session}/    security/csp-report/
```

URL builders are centralized in `src/lib/routes.ts` (`authRoutes`, `metricRoutes`,
`metricCategoryRoutes`, `dashboardRoute`, `buildPath`). Build links through those rather than
writing path strings inline.

## The `@modal` invariant

Intercepted routes render a modal over the current page. Two rules, both of which fail loudly and
have already caused one incident:

1. **Every layout in a tree containing an `@modal` slot must render `{modal}` alongside
   `{children}`.** Omit it and Next throws `Invalid interception route`.
2. **Every `@modal` directory needs a `default.tsx`**, or the slot has nothing to render on a hard
   navigation.

Postmortem: [`../internal/incidents/fix-metric-modal-routing-20251130.md`](../internal/incidents/fix-metric-modal-routing-20251130.md).

## Related

- [`../explanation/architecture/`](../explanation/architecture/) — why the layers are shaped this way
- [`../../.claude/rules/data-access.md`](../../.claude/rules/data-access.md) — query keys and cache invalidation
- [`../../.claude/rules/security.md`](../../.claude/rules/security.md) — cookie, CSP, proxy auth
