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

- [ ] The PR's run: wall-clock time, and each job's install step against the table above
- [ ] Whether the install steps without the binary fell by about a minute, which would confirm
      the inference
- [ ] The gate's log lists all eight jobs as `success`

## Status

In progress on `ci/ci-in-parallel`. The workflow change, its docs and ADR-0036 are in the first
commit. The measurements above, and closing F-68, follow once the pull request's run has
finished.
