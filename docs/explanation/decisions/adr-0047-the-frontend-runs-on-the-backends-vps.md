# ADR-0047 — The frontend runs as a container on the backend's VPS

- **Status:** Proposed
- **Date:** 2026-11-08
- **Related:** follows lakira-backend ADR-0042 (staging and production run as Docker Compose
  stacks on a self-managed VPS); answers owner question O-01
- **Origin:** issue #155, under two days and so without a kit; the owner chose the host on
  2026-11-08

---

## Context

Nothing in the repository deploys the app or names where it runs. The audit of 2026-10-10 grades
both items of its deployment category Missing, and `FINAL-AUDIT-SUMMARY.md` § 8 calls that the
only cause of its verdict. `README.md` called Vercel "the assumed target" only because
`src/lib/env.ts` reads `VERCEL_URL` when it is present.

Five issues waited on the choice: the deploy job (#160), the origins the backend needs for CORS
(#161), forwarding the client's address through `/api/proxy` (#162), the production environment
values (#166) and field web vitals (#167). The backend's O-04 asks the same.

The backend has already chosen its own host. Its ADR-0042 puts staging and production on one
self-managed VPS in Singapore as Docker Compose stacks, behind a reverse proxy that terminates TLS
(Caddy or Traefik), and retires Render from the promotion path. That decision is accepted but not
built: no VPS is provisioned, production has never deployed, and no domain is registered.

The analysis behind #160
([`analysis-c4-deploy-configuration.md`](../../internal/initiatives/frontend-debt-register/analysis-c4-deploy-configuration.md))
set out four options and recommended none, since the choice sets cost and who operates the service.

## Decision

1. **The frontend runs on the backend's VPS.** In staging and in production it is one service in
   that environment's Compose stack, beside the backend, on the host of lakira-backend ADR-0042.
2. **lakira-backend owns the stacks and the reverse proxy.** Its Compose files and its proxy
   configuration gain the frontend's service. This repository owns the frontend's image, and
   documents what the image needs: the port it listens on (3000), the environment variables it
   reads, a health check, and which values are fixed when the image is built.
3. **One image per environment, built in CI.** `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_BASE_URL`
   are inlined at build time, so an image built for staging cannot serve production's origin.
   `API_URL` is read at run time, so the proxy can reach the backend over the stack's internal
   network rather than through the public address.
4. **The reverse proxy is the only hop in front of the app.** It writes `X-Forwarded-For` from the
   address that connected to it, so the client's address the app sees comes from a hop this
   project configures. How `/api/proxy` passes it on, and how many hops the backend's
   `TRUST_PROXY` counts, are settled in #162 and the backend's row B-05.
5. **The staging stack is the preview environment.** There is no deployment per pull request.
   Render is not used for anything that gates a promotion (lakira-backend ADR-0042).
6. **The image does not wait on the VPS; the deploy does.** The image can be built and
   smoke-tested in CI now (#160). A deploy job, live URLs and an end-to-end check of the client's
   address need the provisioned host and the backend's service for the frontend (#194).

## Options considered

- **A managed Next.js host (Vercel).** Rejected. It is the least configuration and gives a preview
  per pull request, but commercial use needs a paid plan; every proxied call would cross the
  public internet to the VPS; and its outgoing addresses are not fixed, so the backend could not
  tell the frontend from any other caller sending `X-Forwarded-For`, and #162 would need a shared
  secret configured and rotated in both repositories. Whether the per-request nonce of ADR-0026
  survives there was also never checked.
- **A container on a platform (Render, Fly).** Rejected. The backend already retired Render after
  its free database was deleted, and either adds a vendor with the same client-address problem as
  a managed host.
- **Previews on Vercel, production on the VPS.** Rejected for the reason lakira-backend ADR-0042
  rejected its own split: a green preview would show the app works on a different platform, not
  on the one it is promoted to.
- **Document the options and ship no configuration.** Rejected. It does not close the audit
  item, which asks for configuration and a job.
- **A Compose file in this repository, or a separate infrastructure repository.** Rejected. Two
  files describing one host drift; a third repository is one more thing to run for a one-person
  project. The backend's ADR-0042 already places the stacks and the proxy there.

## Consequences

- One topology for both halves. The proxy chain is a known number of hops, which #162 needs, and
  the frontend's environments match the backend's.
- The project operates the frontend too: the image, the Node version it runs on (ADR-0018) and
  restarts. TLS stays with the backend's proxy.
- The host is a single point of failure for both halves, as lakira-backend ADR-0042 accepts for
  the backend.
- There is no preview per pull request. Until the VPS exists, the closest thing is
  `frontend-stack-e2e`, which builds the backend in the job (ADR-0046).
- The deploy waits on the VPS and on a domain. #161 and #166 now wait on the domain rather than
  the host.
- `src/lib/env.ts` still reads `NEXT_PUBLIC_VERCEL_URL` and `VERCEL_URL` as fallbacks for the
  app's origin. They are unused on this host and harmless; a deploy that sets
  `NEXT_PUBLIC_APP_URL` never reaches them.
- This record stays `Proposed` until a deploy implements it.
