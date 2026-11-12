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

| Build argument             | Required | Value                                                                                                                                                                                                                                 |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`      | Yes      | The frontend's public origin, such as `https://app.<domain>`, which `robots.txt` and the sitemap print. The build refuses to run when it is empty. Server-side prefetches do not use it: they reach the proxy on loopback (ADR-0050). |
| `NEXT_PUBLIC_API_BASE_URL` | Yes      | The backend's public API base, such as `https://api.<domain>/api/v1`. Also becomes the CSP `connect-src` origin.                                                                                                                      |
| `NEXT_PUBLIC_SITE_URL`     | No       | The canonical site URL, when it differs from the app's.                                                                                                                                                                               |

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
| `PORT`        | No       | Defaults to `3000`. Server-side prefetches call `http://127.0.0.1:$PORT`, so it must be the port the server listens on.                                                                                                                 |
| `HOSTNAME`    | No       | Defaults to `0.0.0.0`. Do not set it to `localhost`, where the reverse proxy could not reach the server, or to an external address alone, where the server could not reach itself on `127.0.0.1`.                                       |

`NODE_ENV` is `production` in the image; do not override it. No secret is baked into the image,
and the build context excludes every `.env` file (`.dockerignore`).

## Behind the reverse proxy

- The reverse proxy terminates TLS and forwards to port 3000 over the stack's network. The
  session cookies are `secure`, so the app must be reached over HTTPS.
- It is the only hop in front of the app and writes `X-Forwarded-For` (ADR-0047): it either
  replaces a client's value or appends to it, so the client is the rightmost entry. The proxy
  route forwards that entry to the backend, and nothing else that names a client
  ([ADR-0049](../explanation/decisions/adr-0049-the-proxy-forwards-the-client-address-the-reverse-proxy-reported.md)).
  Server-side prefetches, token refreshes and sign-out send it too, and the prefetches reach the
  proxy on `127.0.0.1` rather than back through the reverse proxy
  ([ADR-0050](../explanation/decisions/adr-0050-server-side-calls-carry-the-browsers-address-and-reach-the-proxy-on-loopback.md)).
- **Port 3000 is reached only through the reverse proxy; never publish it.** Without a proxy in
  front, a browser's own `X-Forwarded-For` reaches the app, and its rightmost entry would be
  the browser's choice of address.
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

The build needs no network access for fonts: both are committed under `src/app/_fonts/` and
loaded with `next/font/local`
([ADR-0051](../explanation/decisions/adr-0051-fonts-are-built-from-committed-files.md)).
