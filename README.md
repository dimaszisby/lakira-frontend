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
cp .env.example .env.local
npm run dev
```

Then open <http://localhost:3000> and register an account.

Requires **Node 20** — pinned in `.nvmrc` and `.node-version`, so `nvm use` or `fnm use` picks it
up automatically.

`.env.example` points at a backend on `http://localhost:4000/api/v1`, so you need
[`lakira-backend`](https://github.com/dimaszisby/lakira-backend) running locally. See
[`docs/how-to/development/run-against-a-local-backend.md`](docs/how-to/development/run-against-a-local-backend.md).

> The hosted staging backend that earlier versions of this guide pointed at has been down since
> 2026-08-22. Run the backend locally instead.

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

## Deployment

Nothing is committed to drive a deploy today — no `Dockerfile`, no `vercel.json`, and no deploy
job in CI. The app reads `VERCEL_URL` when present, so Vercel is the assumed target, but that is
convention rather than configuration. Adding a gated production deploy is tracked as Phase 7 in
[`docs/internal/audits/saas-readiness/iteration-plan.md`](docs/internal/audits/saas-readiness/iteration-plan.md).

## Forking

This repo is intended to be reusable as a SaaS frontend base. To rename a fresh fork:

```bash
./scripts/bootstrap-fork.sh --name my-app        # add --dry-run to preview
```

It rewrites the brand across every tracked file, renames the two brand-named generated artifacts,
creates `.env.local`, drops upstream working material under `docs/internal/`, and records the fork
point in `FORKED-FROM.md`. It is idempotent, and it deliberately leaves `LICENSE` alone — ISC
requires the original copyright notice to be retained.

Renaming changes the session cookie name, which signs out any existing session once.

**Read [`SAAS-BASE-CHECKLIST.md`](SAAS-BASE-CHECKLIST.md) before forking.** It carries the current
readiness verdict and the known gaps a fork inherits — as of 2026-08-24 the honest answer is
_not fork-ready_, most importantly because the frontend implements none of the multi-tenancy
surface the backend exposes.

## Contributing

Branch off `dev`, never `main`. Promotion is `feature/* → dev → main`; there is no `staging` branch.

Full guide: [`CONTRIBUTING.md`](CONTRIBUTING.md). Security policy: [`SECURITY.md`](SECURITY.md).

Repository conventions for agents and humans live in [`CLAUDE.md`](CLAUDE.md) and
[`.claude/rules/`](.claude/rules/).

## Licence

[ISC](LICENSE) — same as [`lakira-backend`](https://github.com/dimaszisby/lakira-backend).
