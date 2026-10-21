# 2026-10-21 - Todo: frontend CI runs its jobs in parallel

**Context:** register row F-68, from the Notion "FE CI Handoff" written on 2026-10-21 by a backend
CI session, after lakira-backend #204 (ADR-0081) did the same for the backend. The work is kit
`ci-in-parallel`; this file holds the measurements, before and after. It is the counterpart of
the backend's own `2026-10-21-todo-ci-wall-clock-time.md`.

## Before

Run 39624288837, `pull_request`, `fix/list-variant-breakpoint`, 2026-10-21: 12m14s end to end. The
five successful runs before it took 12 to 14 minutes.

```
checks 2m24 -> unit 1m51 -> integration 2m24 -> build 2m04 -> e2e 3m13
api-contract 2m09, security 2m44, secret-scan 6s   (no needs)
```

| Job          | `npm ci` | Work                                           |
| ------------ | -------- | ---------------------------------------------- |
| checks       | 1m35     | lint 26s, css lint 2s, typecheck 8s, format 6s |
| unit         | 1m13     | jest with coverage 26s                         |
| integration  | 1m38     | jest 34s                                       |
| build        | 1m27     | next build 20s, upload 7s                      |
| e2e          | 1m56     | download 3s, start 2s, Cypress 24s + 28s + 9s  |
| api-contract | 1m56     | both checks about 1s                           |
| security     | 1m57     | `security:scan` 37s                            |

The unit job's install went 66 s without output, from the last deprecation warning at 15:20:17
to npm's summary at 15:21:23. Cypress's postinstall is the only one `allowScripts` permits, and it
downloads the binary. That cause is inferred, not shown, until the run below.

## After

- [x] The PR's run, 39631209683: **5m37s**, against 12m14s. The critical path was Build (16:03:00
      to 16:05:01), then E2E (16:05:04 to 16:08:26), then the gate (4 s). The `dev` push run
      after the merge, 39632717440, took **5m16s**.
- [x] Whether the installs without the binary fell by about a minute: **no**, so the inference
      was wrong. The binary is no longer fetched in those jobs, but their installs did not get
      shorter; they vary with the runner:

      | Job          | Before | PR run | `dev` run |
      | ------------ | ------ | ------ | --------- |
      | checks       | 1m35   | 1m05   | 1m27      |
      | unit         | 1m13   | 1m38   | 1m44      |
      | integration  | 1m38   | 1m08   | 1m04      |
      | build        | 1m27   | 1m26   | 1m48      |
      | api-contract | 1m56   | 1m43   | 1m06      |
      | security     | 1m57   | 1m49   | 1m42      |
      | e2e          | 1m56   | 1m48   | 1m13      |

      What the 66 s silence in `npm ci` is was not found; the time saved is all from the jobs
      running side by side.

- [x] The gate's log lists all eight jobs as `success`, in both runs. E2E's Cypress cache missed
      in both: a run reads only its own branch's caches and its base branch's, so the PR's copy
      was not visible to `dev`. The `dev` run saved one, which pull requests into `dev` can read.

## Status

Done 2026-10-21 (#134), kit `ci-in-parallel`: 12m14s to 5m37s on a pull request, 5m16s on `dev`.

`CYPRESS_INSTALL_BINARY=0` stays on the six jobs. It saves no measurable time, but it saves each
of those runners a download it does not use, and removing it would be a workflow change of its
own. Revisit it if it ever gets in the way, for instance if one of those jobs starts running
Cypress.
