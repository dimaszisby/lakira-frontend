# F-01 — No deploy job and no deployment configuration (C4)

Register row [F-01](register.md). Read at `f67716e`.

## 1. What is wrong

Nothing in the repository deploys the app or says how it would be deployed. The audit of
2026-10-10 grades both items of category 8 as Missing: no deploy job (three workflows, none
deploys) and no deployment configuration (no `Dockerfile`, `vercel.json`, `fly.toml`,
`netlify.toml` or `render.yaml`). `README.md:70-75` says the same, and adds that Vercel is "the
assumed target" only because the app reads `NEXT_PUBLIC_VERCEL_URL` when present
(`src/lib/env.ts:103`).

This is the one thing the verdict waits on. Category 8 stands at 67%, ADR-001's criterion 3 is
read by the letter, and `FINAL-AUDIT-SUMMARY.md` § 8 calls C4 "the only cause of the verdict".

## 2. Root cause

No hosting choice has been made, and deploy configuration cannot be written for an unnamed host.
The iteration plan deferred it for that reason (phase 7, "Gates done, deploy deferred"), and
`docs/reference/environments.md:15-16` still lists the production backend URL and the frontend's
production domain as not final.

## 3. Options

- **A. A managed Next host (Vercel or similar).** The least configuration: the host builds from
  the repository and injects its own URL variables, which `src/lib/env.ts` already reads. The
  deploy job is then a gated promotion, not a build. The host sits in front of the app, so it
  decides what `X-Forwarded-For` holds (F-03).
- **B. A container on the backend's VPS.** The backend runs staging and production as Compose
  stacks on a self-managed VPS (backend ADR-0042). A `Dockerfile` here and one more Compose
  service would put both halves behind one reverse proxy. More to own: the image, the Node
  version, TLS and restarts. The proxy chain is then known exactly, which F-03 needs.
- **C. A container on a platform (Render, Fly).** Between the two: a `Dockerfile` plus one
  platform file. The backend's old staging ran on Render and that instance is gone
  (`docs/reference/environments.md`, section 2).
- **D. Template-only: document the choices and ship no configuration.** Costs nothing and does not
  close the item: the audit asks for configuration and a job, not a description.

## 4. Recommendation

None between A, B and C: it is the owner's decision (O-01), and it is not an engineering call
alone, since it sets cost and who operates the service.

What can be said from the code: B gives the two repositories one topology and makes F-03's hop
count a known number; A is the smallest amount of new configuration. Whichever is chosen, the fix
is the same shape: one configuration file, one gated job, and the environment table filled in.

## 5. Acceptance criteria for the fix

- **AC-1** — A deployment configuration file for the chosen host is committed, and a clean
  checkout builds with it. _Why:_ category 8, "Deployment configuration".
- **AC-2** — A workflow job deploys on a manual or protected trigger, and cannot run from a pull
  request of a fork. _Why:_ category 8, "Deploy job"; a deploy job is a credential boundary.
- **AC-3** — `docs/reference/environments.md` names the production values of `API_URL`,
  `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_APP_URL`, and the two "not final" lines are gone.
  _Why:_ F-02 and F-11 are answered by the same decision.
- **AC-4** — `README.md` § Deployment describes what is committed, not what is assumed.
  _Why:_ the audit cites that paragraph as its evidence.
- **AC-5** — The Content Security Policy's `connect-src` holds the production API origin on a
  production build. _Why:_ the policy is derived from the same variable.

## 6. Size and shape

≤1 day once the host is named; unsizeable before. A full kit, and **an ADR is owed**: the hosting
topology is a deployment and security boundary, and the backend recorded its own as ADR-0042.
Gates: all of the always-on gates, plus `e2e` and `e2e (csp)` against the deployed build's
configuration. A dated audit run is owed afterwards, since only a run restates the verdict.

## 7. Depends on, unblocks

Depends on O-01. Unblocks F-02 (the origins the backend needs for CORS), F-03 (the proxy chain),
F-11 (production environment values) and F-12 (where the server's log lines go). The backend's
B-03, B-04 and B-05 wait on the same answer.

## 8. Not verified

- Whether a managed host would preserve the per-request nonce the page policy depends on
  (ADR-0026). It is set in `src/proxy.ts`, which runs wherever the app runs, but no deployed
  environment has shown it.
- What any candidate host does with `X-Forwarded-For`.
- No reproduction was run for this kit. The two Missing grades are the audit's of 2026-10-10; the
  file search behind them was repeated here and found the same nothing.
