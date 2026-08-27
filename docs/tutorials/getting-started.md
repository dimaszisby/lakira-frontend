# Getting started

Clone to a running app with your own account in it. About ten minutes, mostly waiting on `npm ci`.

Follow it straight through. Explanations of _why_ live in [`../explanation/`](../explanation/);
alternatives live in [`../how-to/`](../how-to/).

## Before you start

- **Node 20 or newer.** CI pins Node 20; newer versions work (verified on v26).
- **Docker**, for the backend's Postgres and Redis.
- A checkout of [`lakira-backend`](https://github.com/dimaszisby/lakira-backend) beside this one.

This tutorial runs the backend locally. There is a deployed staging backend, but it is **not
usable right now** — its database was deleted, so the service crash-loops on startup. Local is the
supported path.

## 1. Install

```bash
git clone https://github.com/dimaszisby/lakira-frontend.git
cd lakira-frontend
npm ci
```

Use `npm ci`, not `npm install` — it installs exactly what `package-lock.json` pins, which is what
CI does.

## 2. Start the backend

In your `lakira-backend` checkout:

```bash
docker compose up -d db redis
npm ci
PORT=8001 npm run dev
```

Wait for `[SERVER] lakira-backend running on port 8001`.

**Set `PORT=8001` explicitly.** The backend's own default is `5000`, which on macOS is occupied by
AirPlay Receiver — it answers with `403` rather than refusing the connection, so the failure looks
like a broken API instead of a port clash. `8001` is also what this frontend falls back to when no
API URL is configured, so the two line up.

## 3. Configure the frontend

Back in `lakira-frontend`. Copy the committed template:

```bash
cp .env.example .env.local
```

That gives you the three values you need, already pointing at `http://localhost:8001/api/v1`:

```bash
API_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Both variables are needed and they are not redundant:

- `API_URL` is server-only. The proxy forwards to it, so the backend origin never ships to the
  browser.
- `NEXT_PUBLIC_API_BASE_URL` is compiled into the client bundle and is what derives the
  Content-Security-Policy `connect-src` origin in `next.config.ts`. Get it wrong and every fetch is
  blocked by the browser, with a CSP violation in the console rather than a network error.

`.env.local` is gitignored. Never put a secret in a `NEXT_PUBLIC_` variable — it is published to
anyone who loads the page.

## 4. Start the app

```bash
npm run dev
```

Open <http://localhost:3000>. You land on the Lakira landing page, with **Login** and
**Register** buttons.

The first request to any route compiles it on demand, so it can take up to a minute in dev. That is
Next building the route, not the backend — subsequent requests to the same route are instant.

Try <http://localhost:3000/dashboard> and you are bounced to `/login`. `middleware.ts` cookie-gates
`/dashboard`, `/metrics`, `/metric-categories`, and `/account`, and you have no session yet. The
landing page and the auth pages are not gated.

A production build redirects to `/login?returnUrl=/dashboard` so login can send you back where you
were headed. The dev server drops that query parameter, so do not be surprised it is missing here.

> **If the app loads but no data arrives**, check the backend terminal. The two usual causes are
> the backend not running on `8001`, and `docker compose up -d db redis` not having finished before
> the backend started — the backend exits on a failed database connection rather than retrying.
> More in
> [`../how-to/development/run-against-a-local-backend.md`](../how-to/development/run-against-a-local-backend.md).

## 5. Create an account

Click **Register**, or go to <http://localhost:3000/register>. Fill in the form — username, email,
password, and the password confirmation, which the backend requires — and submit.

Two requests happen, and the split matters:

1. The form posts through the proxy to the backend, which creates the user and returns a JWT.
2. The app then posts that token to its own `/api/auth/session` route, which is what sets the
   cookie.

The result is an httpOnly cookie named `lakira_token`, flagged `Secure` and `SameSite=lax`. Confirm
it in DevTools → Application → Cookies. **You cannot read it from JavaScript** — that is the whole
point of the proxy, and why the token is minted by a route handler rather than stored client-side.

A validation failure comes back as `{ "status": "fail", "errors": [{ "field": …, "message": … }] }`
and the form puts each message on its field.

## 6. Create a category, then a metric

The dashboard is empty until there is something to show. Metrics live inside categories, so create
the category first.

1. Go to **Metric Categories** → **New**. Give it a name and a colour, then save.
2. The dialog opens as an intercepted route — the URL becomes `/metric-categories/new` while the
   list stays behind it. Reload the page: you get the same form as a full page. That is one route
   rendered two ways.
3. Go to **Metrics** → **New**. Pick the category you just made, name the metric, save.
4. Open the metric and add a log entry or two with different values.

The metric detail page now renders a chart from those logs.

## 7. Watch the request path

Open DevTools → Network and reload the metric list. You will not see a request to the staging
backend. You will see one to `/api/proxy/metrics`.

That is the whole data path:

```
component → query hook → feature api.ts → axios → /api/proxy/[...path] → backend
```

The browser only ever talks to your own Next server. The proxy attaches the `Authorization` header
from the cookie and forwards the call.

## 8. Run the checks

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run test:unit
```

That is exactly what CI's `checks` and `unit` jobs run. All four should pass on a clean clone.

`npm run lint` prints a backlog of pre-existing warnings (import order, Tailwind class order, and
others). Warnings do not fail the build. The rule is to leave every file you touch warning-free
rather than to clear the backlog.

## Where to go next

- [Your first feature slice](./your-first-feature-slice.md) — add a feature module end to end.
- [Your first component](./your-first-component.md) — build a token-driven UI primitive.
- [`../reference/commands.md`](../reference/commands.md) — every script worth running.
- [`../reference/routes-and-proxy.md`](../reference/routes-and-proxy.md) — the route map and the
  proxy contract in full.
