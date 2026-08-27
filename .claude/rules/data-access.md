---
paths:
  - src/services/api/**
  - src/features/**/api.ts
  - src/features/**/hooks/**
  - src/features/**/keys.ts
  - src/features/**/cache.ts
  - src/app/api/**
  - middleware.ts
---

# Data Access

## The two-hop request path

Nothing in the browser talks to lakira-backend directly.

```
component → TanStack Query hook → feature api.ts → axios (src/services/api/api.ts)
          → /api/proxy/[...path]  (Next route handler, injects the bearer token)
          → lakira-backend /api/v1/*
```

`src/services/api/api.ts` resolves its base URL as `/api/proxy` in the browser; on the server it builds an absolute origin from `NEXT_PUBLIC_APP_URL` → `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_VERCEL_URL` → `VERCEL_URL` → `HOST`/`PORT`. Never hardcode a backend URL in feature code.

`axios-retry` retries three times with exponential backoff, but **only** for GET/HEAD/OPTIONS or when the caller supplies an `Idempotency-Key` header. If a POST needs to be safely retriable, pass `idempotencyKey` — do not loosen the retry policy.

### The proxy

`src/app/api/proxy/[...path]/route.ts` reads the httpOnly session cookie and sets `Authorization: Bearer <token>`.

**It denies by default.** A request without a token is rejected with 401 unless its path is in `PUBLIC_API_PATHS` (`src/lib/auth-paths.ts`), which lists the seven unauthenticated auth entry points and nothing else. That list is derived from the OpenAPI contract, where every other operation declares `security`. Adding a new authed backend resource requires **no change** — it is protected the moment it exists.

This used to be an allowlist of *protected* segments, which was a denylist by omission: `analytics/*` and `admin/_ping` both proxied unauthenticated even though the contract marks them secured.

`src/app/api/auth/*` handles login/logout/session directly rather than through the proxy. That is correct, not a bypass: the proxy exists so the **browser** never reaches the backend, and these are already server routes — routing them through the proxy would make the server call itself.

`middleware.ts` gate-checks the same cookie for the paths in `PROTECTED_APP_PATHS` and redirects to `/login?returnUrl=…`. It **validates the token's `exp` claim**, not just its presence, and clears a stale cookie on the way out. The signature is deliberately not verified there — that needs the backend's secret, and the backend re-checks every proxied request.

### Server-side fetches

An SSR fetch for a protected route must forward the session or it silently 401s. Use `getServerAuthHeaders()` from `src/services/api/serverHeaders.ts`, which builds a `Cookie` header from `next/headers`. This is a logged incident, not a hypothetical — see `docs/internal/incidents/`.

## Errors

Every function in a feature `api.ts` is wrapped:

```ts
export const getMetricCategory = (id: string, opts?: RequestOpts) =>
  withApiErrorHandling(
    () => api.get(`/metric-categories/${id}`, opts).then(unwrap),
    "getMetricCategory",
  );
```

The chain is `withApiErrorHandling` → `handleApiError` → `normalizeApiError`. It converts aborts into a `DOMException` so React Query treats them as cancellations rather than failures, logs in non-production, and rethrows.

`NormalizedApiError` is `{isAbort, status, code, title, messages[], retryable, raw}`. It already understands the backend's four error envelopes: `{message}`, `{errors:[]}`, `{error}`, and Zod `{issues:[]}`. Render `messages`; do not re-parse `raw` in a component.

Two things to know:

- `src/services/api/auth.api.ts` is legacy — raw try/catch with `console.error` instead of `withApiErrorHandling`. Do not copy it; converting it is welcome.
- The backend's own docs flag that 4xx/5xx bodies are under-specified in the OpenAPI spec, and its global error handler can emit shapes the spec does not describe. Treat `normalizeApiError` as the compatibility layer and add cases there rather than defensively in features.

Backend rate limits you will hit: 100/15min per IP globally, 50/15min per user, 30/1min on analytics. A 429 is `retryable`.

## TanStack Query

- **Keys come from `keys.ts`.** Never inline a key array in a hook. Normalize the inputs so equivalent params produce identical keys — an un-normalized cursor produces cache misses that look like a backend bug.
- **Invalidation comes from `cache.ts`.** Mutations call the named helper; they do not inline `queryClient.invalidateQueries`.
- One hook file per operation, named `<operation>.<kind>.ts`.
- Pass `signal` through to axios via `RequestOpts` so React Query can cancel in-flight requests.
- Anything that scopes to a tenant, user, or filter set must have that in the key. A missing scope in a cache key is a cross-account data leak, not a staleness bug.

## The contract

`docs/reference/api/lakira-backend-openapi.json` is a synced snapshot of the backend's spec — never hand-edited. `src/types/api/generated/**` is generated from it. Run `/sync-api-types` when the backend ships a change; `npm run api:spec:check` and `npm run api:types:check` fail CI on drift.

Hand-written DTOs still live in `src/types/dtos/*.dto.ts` and are being replaced by generated types feature by feature. When you touch a feature, prefer the generated type; if it disagrees with the hand-written one, the generated type is right.

The response envelope is `{status, message, data}`; unwrap it with the helpers in `src/types/generics/ApiResponse.ts` (`unwrap`, `isSuccess`, `unwrapOrNull`).
