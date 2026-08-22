# Run against a local backend

By default this app points at the deployed staging backend. Point it at a local
`lakira-backend` checkout when you are changing the API contract, or when staging is down.

## 1. Start the backend

In your `lakira-backend` checkout:

```bash
docker compose up -d      # Postgres and Redis
npm ci
npm run dev
```

It serves on `http://localhost:8001/api/v1`.

## 2. Point the frontend at it

In `.env.local`:

```bash
API_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Both are required, and for different reasons:

- `API_URL` is server-only and is what the proxy forwards to.
- `NEXT_PUBLIC_API_BASE_URL` is compiled into the client bundle and derives the CSP `connect-src`
  origin in `next.config.ts`.

`http://localhost:8001/api/v1` is also the built-in fallback when neither is set, so an empty
`.env.local` happens to work for a local backend. Set them explicitly anyway — relying on the
fallback hides the misconfiguration when you later switch to staging.

**Restart `npm run dev` after editing `.env.local`.** `NEXT_PUBLIC_*` values are inlined at build
time; a hot reload will not pick them up.

## 3. Sync the contract

A local backend may be ahead of the committed OpenAPI snapshot:

```bash
LAKIRA_BACKEND_PATH=../lakira-backend npm run api:spec:sync
npm run api:types:generate
```

See [`sync-the-openapi-spec.md`](./sync-the-openapi-spec.md).

## Troubleshooting

| Symptom                                       | Cause                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Every fetch blocked, CSP violation in console | `NEXT_PUBLIC_API_BASE_URL` does not match the origin actually being called.                                     |
| `401` on every authenticated call             | No `lakira_token` cookie. Log in again — the cookie is scoped per origin and does not carry over from staging.  |
| Server components render empty, no error      | An SSR fetch did not forward the cookie. Use `getServerAuthHeaders()` from `src/services/api/serverHeaders.ts`. |
| `ECONNREFUSED`                                | Backend is not running, or is on a different port.                                                              |

## Related

- [`../../reference/configuration.md`](../../reference/configuration.md)
- [`../../reference/routes-and-proxy.md`](../../reference/routes-and-proxy.md)
