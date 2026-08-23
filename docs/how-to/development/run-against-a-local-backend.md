# Run against a local backend

Running a local `lakira-backend` is the supported path — the deployed staging backend is currently
unusable, because its database was deleted and the service crash-loops on startup.

## 1. Start the backend

In your `lakira-backend` checkout:

```bash
docker compose up -d db redis
npm ci
PORT=8001 npm run dev
```

Wait for `[SERVER] lakira-backend running on port 8001`, then it serves on
`http://localhost:8001/api/v1`.

**Set `PORT=8001` explicitly.** The backend's `.env` defaults to `5000`, and on macOS that port is
held by AirPlay Receiver (`ControlCenter`). It answers with `403` instead of refusing the
connection, so the symptom looks like a broken API rather than a port clash. If you would rather
keep `5000`, turn off System Settings → General → AirDrop & Handoff → AirPlay Receiver.

`8001` is also this frontend's built-in fallback, so the two line up by default.

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

| Symptom                                              | Cause                                                                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Every fetch blocked, CSP violation in console        | `NEXT_PUBLIC_API_BASE_URL` does not match the origin actually being called.                                                        |
| `401` on every authenticated call                    | No `lakira_token` cookie. Log in again — the cookie is scoped per origin and does not carry over from staging.                     |
| Server components render empty, no error             | An SSR fetch did not forward the cookie. Use `getServerAuthHeaders()` from `src/services/api/serverHeaders.ts`.                    |
| `ECONNREFUSED`                                       | Backend is not running, or is on a different port.                                                                                 |
| `403` from the API with no matching backend log line | macOS AirPlay Receiver is answering on port 5000. Use `PORT=8001`.                                                                 |
| Backend exits immediately on start                   | Postgres was not ready. Run `docker compose up -d db redis` first — the backend exits on a failed connection rather than retrying. |

## Related

- [`../../reference/configuration.md`](../../reference/configuration.md)
- [`../../reference/routes-and-proxy.md`](../../reference/routes-and-proxy.md)
