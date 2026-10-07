# 2026-10-07 - Todo: clear the sharp high advisory failing Security Scan

**Context:** found on the `dev` push run for #75 (60edae9, run 37574247532). Its `Security Scan`
job failed at `npm audit --omit=dev --audit-level=high`; every other job passed. #75's own PR run
had passed the same job hours earlier, so the advisory was published in between. Same shape as
[`2026-10-06-todo-npm-audit-source-map-js.md`](2026-10-06-todo-npm-audit-source-map-js.md).

## Finding

| Package        | Severity | Advisory                                             | Pulled in by  |
| -------------- | -------- | ---------------------------------------------------- | ------------- |
| `sharp` 0.35.4 | high     | GHSA-wq5f-xc86-pv6w (a librsvg flaw, CVE-2026-96889) | `next` 16.3.8 |

## Checklist

- [x] `npm update sharp` with Node 24's npm, so the lockfile matches CI
- [x] `package.json` unchanged; `sharp` and its 26 `@img/sharp-*` platform packages are the only
      lockfile entries that changed
- [x] `npm run security:audit` exits 0
- [x] Gates, with the rest of the branch: recorded in the
      [`reaudit-p2-sweep` checklist](../initiatives/reaudit-p2-sweep/reaudit-p2-sweep-checklist.md)
- [x] Hand over as its own commit on `chore/reaudit-p2-sweep`

## Status

Fixed 2026-10-07 on `chore/reaudit-p2-sweep`, as the first commit of that branch so its PR can
pass `Security Scan`. `npm update sharp` (Node 24.21.0, npm 11.19.0) moved `sharp` from 0.35.4 to
0.35.5 and its platform packages with it.

This is the second advisory in two days to turn `dev` red between a PR's run and its merge. Not
addressed here.
