# 2026-10-06 - Todo: clear the source-map-js high advisory failing Security Scan

**Context:** found on the `dev` push run for #74 (0df2cdc, run 37444442719). Its `Security Scan`
job failed at `npm audit --omit=dev --audit-level=high`. #74 changed no dependency, and the same
audit failed locally on an unchanged tree, so every PR fails the same way until this lands. Same
shape as [`2026-09-30-todo-npm-audit-brace-expansion.md`](2026-09-30-todo-npm-audit-brace-expansion.md).

## Finding

| Package               | Severity | Advisory                                                        | Pulled in by                               |
| --------------------- | -------- | --------------------------------------------------------------- | ------------------------------------------ |
| `source-map-js` 1.2.1 | high     | GHSA-68fv-2mgg-jv7q (event-loop denial of service, source maps) | `postcss` 8.5.23; `stylelint` via css-tree |

It counts as a production dependency through `postcss`, which is why the PR audit sees it
(ADR-0023).

## Checklist

- [x] `npm update source-map-js` with Node 24's npm, so the lockfile matches CI
- [x] `package.json` unchanged; one entry changed in `package-lock.json`
- [x] `npm run security:audit` exits 0
- [x] Gates, with the rest of the branch: recorded in the
      [`telemetry-log-hardening` checklist](../initiatives/telemetry-log-hardening/telemetry-log-hardening-checklist.md)
- [x] Hand over as its own commit on `fix/telemetry-log-hardening`

## Status

Fixed 2026-10-06 on `fix/telemetry-log-hardening`, as the first commit of that branch so its PR
can pass `Security Scan`. `npm update source-map-js` (Node 24.21.0, npm 11.19.0) changed one
lockfile entry, 1.2.1 to 1.2.2, resolved from `registry.npmjs.org` with `sha512`.

`npm audit fix` was not used: it would also have moved development-only packages that have
nothing to do with this advisory. Those stay with the nightly `dependency-audit` workflow
([`2026-10-03-todo-braces-dev-advisory.md`](2026-10-03-todo-braces-dev-advisory.md)).
