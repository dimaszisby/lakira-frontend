# Lakira Frontend

A web app for tracking custom metrics. Create categories, define metrics under them, log values over
time, set goals and alerts, and see trends on the dashboard.

Next.js 16 (App Router) · React 19 · TypeScript · TanStack Query · Jotai · React Hook Form + Zod ·
Tailwind 3 over a CSS-variable token system · Ariakit.

Pairs with [`lakira-backend`](https://github.com/dimaszisby/lakira-backend) (Express REST API).
**Every backend call goes through this app's own `/api/proxy/[...path]` handler** — the browser never
talks to the backend directly, so the session token can stay in an httpOnly cookie.

## Quick start

```bash
npm ci

cat > .env.local <<'EOF'
API_URL=https://lakira-backend-staging.onrender.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://lakira-backend-staging.onrender.com/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

npm run dev
```

Then open <http://localhost:3000> and register an account.

Requires **Node 20**. The staging backend sleeps when idle — the first request after a quiet period
can take 30–60 seconds.

Full walkthrough: [`docs/tutorials/getting-started.md`](docs/tutorials/getting-started.md).
To run against a local backend instead, see
[`docs/how-to/development/run-against-a-local-backend.md`](docs/how-to/development/run-against-a-local-backend.md).

## Checks

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run test:unit
```

Those are CI's `checks` and `unit` jobs. Every script is documented in
[`docs/reference/commands.md`](docs/reference/commands.md).

## Documentation

[`docs/`](docs/README.md) is organised by [Diátaxis](https://diataxis.fr/) — by what you are trying
to do, not by what the document is called:

|                                          |                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------- |
| [`docs/tutorials/`](docs/tutorials/)     | Learning — getting started, first feature slice, first component      |
| [`docs/how-to/`](docs/how-to/)           | Task recipes — development, testing, releases, CI/CD, security        |
| [`docs/reference/`](docs/reference/)     | Lookup — commands, configuration, design tokens, routes, API contract |
| [`docs/explanation/`](docs/explanation/) | Understanding — architecture, ADR registry, testing strategy          |
| [`docs/internal/`](docs/internal/)       | Working material — initiative kits, audit runs, incidents, todos      |

Frequently needed:

- [`docs/reference/routes-and-proxy.md`](docs/reference/routes-and-proxy.md) — the route map, the
  `@modal` contract, and how the proxy authenticates
- [`docs/reference/configuration.md`](docs/reference/configuration.md) — every env var and the
  `NEXT_PUBLIC_*` exposure rule
- [`docs/explanation/decisions/`](docs/explanation/decisions/) — the ADR registry; check **Status**
  before trusting a record
- [`docs/internal/incidents/`](docs/internal/incidents/) — four postmortems on routing, caching,
  prefetch, and `searchParams`. Read these before touching those areas; the causes recur.

## Contributing

Branch off `dev`, never `main`. Promotion is `feature/* → dev → main`; there is no `staging` branch.

Repository conventions for agents and humans live in [`CLAUDE.md`](CLAUDE.md) and
[`.claude/rules/`](.claude/rules/).
