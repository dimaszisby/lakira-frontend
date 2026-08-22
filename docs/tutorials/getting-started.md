# Getting started

Clone to a running app with your own account in it. About ten minutes, mostly waiting on `npm ci`.

Follow it straight through. Explanations of _why_ live in [`../explanation/`](../explanation/);
alternatives live in [`../how-to/`](../how-to/).

## Before you start

- **Node 20.** That is what CI uses. `node --version` should print `v20.x`.
- A backend to talk to. This tutorial points at the deployed staging backend, so you do not need to
  run `lakira-backend` locally. To use a local one instead, see
  [`../how-to/development/run-against-a-local-backend.md`](../how-to/development/run-against-a-local-backend.md).

## 1. Install

```bash
git clone https://github.com/dimaszisby/lakira-frontend.git
cd lakira-frontend
npm ci
```

Use `npm ci`, not `npm install` — it installs exactly what `package-lock.json` pins, which is what
CI does.

## 2. Configure

There is no `.env.example` in this repo yet, so create the file directly:

```bash
cat > .env.local <<'EOF'
API_URL=https://lakira-backend-staging.onrender.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://lakira-backend-staging.onrender.com/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

Both variables are needed and they are not redundant:

- `API_URL` is server-only. The proxy forwards to it, so the backend origin never ships to the
  browser.
- `NEXT_PUBLIC_API_BASE_URL` is compiled into the client bundle and is what derives the
  Content-Security-Policy `connect-src` origin in `next.config.ts`. Get it wrong and every fetch is
  blocked by the browser, with a CSP violation in the console rather than a network error.

`.env.local` is gitignored. Never put a secret in a `NEXT_PUBLIC_` variable — it is published to
anyone who loads the page.

## 3. Start the app

```bash
npm run dev
```

Open <http://localhost:3000>. You land on the login page, because `middleware.ts` cookie-gates
`/dashboard`, `/metrics`, `/metric-categories`, and `/account`, and you have no session yet.

> The staging backend sleeps when idle. The first request after a quiet period can take
> **30–60 seconds** and may time out once. Reload and it will be awake.

## 4. Create an account

Click **Register**, or go to <http://localhost:3000/register>. Fill in the form and submit.

On success the server sets an httpOnly cookie named `lakira_token` and redirects you to the
dashboard. You can confirm it in DevTools → Application → Cookies. You cannot read it from
JavaScript — that is the point of the proxy.

If registration returns a 500 rather than a validation error, the backend is still waking up. Wait
and retry.

## 5. Create a category, then a metric

The dashboard is empty until there is something to show. Metrics live inside categories, so create
the category first.

1. Go to **Metric Categories** → **New**. Give it a name and a colour, then save.
2. The dialog opens as an intercepted route — the URL becomes `/metric-categories/new` while the
   list stays behind it. Reload the page: you get the same form as a full page. That is one route
   rendered two ways.
3. Go to **Metrics** → **New**. Pick the category you just made, name the metric, save.
4. Open the metric and add a log entry or two with different values.

The metric detail page now renders a chart from those logs.

## 6. Watch the request path

Open DevTools → Network and reload the metric list. You will not see a request to the staging
backend. You will see one to `/api/proxy/metrics`.

That is the whole data path:

```
component → query hook → feature api.ts → axios → /api/proxy/[...path] → backend
```

The browser only ever talks to your own Next server. The proxy attaches the `Authorization` header
from the cookie and forwards the call.

## 7. Run the checks

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
