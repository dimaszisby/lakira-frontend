# Production image

**Purpose:** what the frontend's production image needs from the Compose service that runs it.
**Reader:** whoever adds or changes that service in lakira-backend's staging and production stacks
([ADR-0047](../explanation/decisions/adr-0047-the-frontend-runs-on-the-backends-vps.md)).
**Owner:** this repository owns the image; lakira-backend owns the stacks and the reverse proxy.

The image is built from [`Dockerfile`](../../Dockerfile) and proved by `npm run docker:smoke`
([`scripts/image-smoke.sh`](../../scripts/image-smoke.sh)), which CI's `image` job runs on every
pull request ([ADR-0048](../explanation/decisions/adr-0048-the-production-image-is-built-per-environment.md)).
No registry holds it yet; publishing and deploying it is
[#194](https://github.com/dimaszisby/lakira-frontend/issues/194).

## At a glance

| Property     | Value                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Base         | `node:24-alpine`, the major `.nvmrc` pins (ADR-0018)                                                                             |
| Process      | `node server.js`, Next.js standalone output, under `dumb-init` as PID 1                                                          |
| User         | `node` (uid 1000), never root                                                                                                    |
| Listens on   | `0.0.0.0:3000` (`HOSTNAME`, `PORT`)                                                                                              |
| Health check | built in: `GET /` must answer 2xx; every 30 s, 3 retries                                                                         |
| Stops on     | `SIGTERM`, within Docker's default 10 s                                                                                          |
| Writes to    | nothing that must persist; no volume is needed. Next may write `.next/cache`, so a read-only root filesystem needs a tmpfs there |
| Memory       | about 65 MB idle and 115 MB after a burst of 56 requests, measured locally on 2026-11-08; building it needs far more, see below  |

## One image per environment

`next build` inlines every `NEXT_PUBLIC_*` value into the JavaScript it ships, and
`next.config.ts` builds the Content Security Policy's `connect-src` from the API origin at the
same time. A rebuilt container picks up none of them, so **an image serves the one environment it
was built for**. Build staging's and production's separately.

| Build argument             | Required | Value                                                                                                                                                                             |
| -------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`      | Yes      | The frontend's public origin, such as `https://app.<domain>`. Without it, every page that loads its data on the server renders 404, so the build refuses to run when it is empty. |
| `NEXT_PUBLIC_API_BASE_URL` | Yes      | The backend's public API base, such as `https://api.<domain>/api/v1`. Also becomes the CSP `connect-src` origin.                                                                  |
| `NEXT_PUBLIC_SITE_URL`     | No       | The canonical site URL, when it differs from the app's.                                                                                                                           |

## Where it is built

**Build the image on a CI runner, and have the VPS pull it. Never build it on the VPS.** `next build`
needs more than 2 GB of memory, while the running server needs about 115 MB. A build on the VPS
competes for memory with the live stack, and on a small VPS the kernel's out-of-memory killer may
stop the backend or Postgres rather than the build. The registry and the job that publishes to it
are [#194](https://github.com/dimaszisby/lakira-frontend/issues/194).

## Runtime environment

| Variable      | Required | Value                                                                                                                                                                                                                                   |
| ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API_URL`     | No       | The backend the proxy forwards to. Unset, the proxy uses the build's `NEXT_PUBLIC_API_BASE_URL`. Today the two are kept equal (`.claude/rules/environment.md`); whether the stack points it at the internal address is decided in #194. |
| `SENTRY_DSN`  | No       | Turns on server-side error reporting (ADR-0024). Unset, no vendor code loads.                                                                                                                                                           |
| `APP_RELEASE` | No       | The release sent with each Sentry event, such as the commit SHA. Same name as the backend's.                                                                                                                                            |
| `PORT`        | No       | Defaults to `3000`.                                                                                                                                                                                                                     |
| `HOSTNAME`    | No       | Defaults to `0.0.0.0`. Do not set it to `localhost`: the reverse proxy could not reach the server.                                                                                                                                      |

`NODE_ENV` is `production` in the image; do not override it. No secret is baked into the image,
and the build context excludes every `.env` file (`.dockerignore`).

## Behind the reverse proxy

- The reverse proxy terminates TLS and forwards to port 3000 over the stack's network. The
  session cookies are `secure`, so the app must be reached over HTTPS.
- It is the only hop in front of the app and writes `X-Forwarded-For` (ADR-0047). How the
  proxy route passes the client's address to the backend is #162.
- Every page carries a per-request nonce in its Content Security Policy (ADR-0026). Do not cache
  HTML at the proxy: a cached page repeats a nonce.

## Build and run it locally

```bash
npm run docker:smoke                                   # build and run every check
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001/api/v1 \
  -t lakira-frontend:local .
docker run --rm -p 3000:3000 -e API_URL=http://host.docker.internal:8001/api/v1 lakira-frontend:local
```

`next build` needs more than 2 GB of memory: at Colima's default 2 GB it was killed mid-build with
`SIGKILL`, and it built at 6 GB. Raise the VM's memory (`colima start --memory 6`). The `Dockerfile`
needs Docker Engine 25 or later, for the health check's `--start-interval`.

The build downloads the two fonts from Google Fonts (ADR-0031), so it needs network access to
`fonts.googleapis.com` and `fonts.gstatic.com`.
