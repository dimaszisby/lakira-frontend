# ADR-0048 — The production image is built per environment and smoke-tested in CI

- **Status:** Proposed
- **Date:** 2026-11-08
- **Related:** implements the image half of
  [ADR-0047](./adr-0047-the-frontend-runs-on-the-backends-vps.md); follows lakira-backend
  ADR-0055, whose image smoke test it mirrors
- **Origin:** issue #160 (register row F-01), under two days and so without a kit

---

## Context

ADR-0047 runs the frontend as a service in lakira-backend's Compose stacks on the VPS. The
backend owns the stacks; this repository owns the image they run. Nothing built one: no
`Dockerfile`, and no job that would notice if the app could not run outside `next start` on a
runner.

Three facts shape the image:

- `next build` inlines every `NEXT_PUBLIC_*` value, and `next.config.ts` builds the Content
  Security Policy's `connect-src` from the API origin at the same time. A build without
  `NEXT_PUBLIC_APP_URL` renders every page that loads its data on the server as 404, which is
  what the first CI run of the stack suites hit (kit `stack-suites-in-ci`).
- Next's standalone output (`output: "standalone"`) traces the files the server needs into
  `.next/standalone`, with a `server.js` that replaces `next start`, so the image carries only a
  traced, minimal `node_modules`. Under that setting, `next start` warns that it "does not work",
  and three CI jobs serve their builds with `next start`.
- A Node process that is PID 1 does not stop on `SIGTERM` unless it handles it.

## Decision

1. **A multi-stage `Dockerfile` on `node:24-alpine`**, the base and shape of the backend's: `npm ci`
   and the build in one stage, and a runtime stage holding only the standalone server,
   `.next/static` and `public`, run by `dumb-init` as user `node`, with a health check on `/`.
   The tag follows `.nvmrc` (ADR-0018).
2. **One image per environment.** `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_BASE_URL` are
   required build arguments, and the build stops when either is empty. Runtime variables
   (`API_URL`, `SENTRY_DSN`, `APP_RELEASE`) are set by the Compose service.
3. **Standalone output only for the image.** `next.config.ts` sets `output: "standalone"` when
   `NEXT_OUTPUT=standalone`, which only the `Dockerfile` sets. Every other build stays as it was.
4. **CI builds and smoke-tests the image on every pull request**, in a job of `frontend-ci` that
   "CI passed" needs. `scripts/image-smoke.sh`, also `npm run docker:smoke`, checks that the
   build refuses missing arguments, the user is not root, no devDependency is present, Node
   matches `.nvmrc`, `/` and `/login` answer 200 with a nonce in their policy, a static asset is
   served, the health check reports healthy, and `SIGTERM` stops it.
5. **The build context holds no `.env` file** (`.dockerignore`), since `next build` would read
   one and inline its values.

## Options considered

- **One image for every environment, with public values read at run time.** Rejected. It needs
  every `NEXT_PUBLIC_*` read moved behind a server-rendered value or a runtime config endpoint,
  and the CSP built at run time instead of in `next.config.ts`. That is a change to the app's
  configuration model, not to its packaging, and the stacks gain nothing from it while there are
  two environments.
- **`output: "standalone"` unconditionally.** Rejected. Three workflows would print a warning
  that `next start` does not work while it does, or would all have to move to `server.js`.
- **`next start` in the image, with full `node_modules`.** Rejected. The image would carry every
  production dependency rather than the traced files, and the standalone server is what Next
  documents for containers.
- **A separate workflow, as the backend has.** Rejected. A job in `frontend-ci` is required by
  "CI passed" without a ruleset change; a separate workflow would gate nothing.
- **A Debian base.** Rejected for now. Alpine matches the backend's image; `sharp`, the one
  native dependency, ships a musl build.

## Consequences

- An image is tied to its environment's URLs. Staging and production each build their own, and
  a promotion rebuilds rather than retags.
- `frontend-ci` runs one more job, about as long as `e2e`'s build, and it depends on Google Fonts
  at build time like every other build (ADR-0031).
- `next build` needs more than 2 GB of memory: Colima's default 2 GB killed it, 6 GB built it.
  The running server needs about 115 MB. So the image is built on a CI runner and pulled by the
  VPS, never built there, where the build would compete with the live stack for memory; #194
  sets up the registry. The health check's `--start-interval` needs Docker Engine 25 or later,
  on the VPS too.
- No registry holds the image, and nothing deploys it. That is #194, which also moves this record
  and ADR-0047 to `Accepted`.
