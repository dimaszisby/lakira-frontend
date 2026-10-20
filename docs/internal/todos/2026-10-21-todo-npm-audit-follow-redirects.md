# 2026-10-21 - Todo: clear the follow-redirects high advisory failing Security Scan

**Context:** found on the `dev` push run for #125 (`6cfeab7`, run 39498607013). Its `Security
Scan` job failed at `npm audit --omit=dev --audit-level=high`; every other job passed. #125
changed only Markdown, and the same audit had passed on its pull request run hours earlier, so the
advisory was published in between. Every pull request fails the same way until this lands. Same
shape as [`2026-10-06-todo-npm-audit-source-map-js.md`](2026-10-06-todo-npm-audit-source-map-js.md).
Register row F-66.

## Finding

| Package                   | Severity | Advisory                                                                                                                                                              | Pulled in by   |
| ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `follow-redirects` 1.16.0 | high     | GHSA-q3jh-wrc6-jgq8 (array-form headers bypass cross-origin credential stripping); GHSA-8r9p-f939-6h3c (`sensitiveHeaders` regex escaping exposes credential headers) | `axios` 1.20.0 |

It is a production dependency: `axios` is a runtime dependency (`package.json`), so the PR audit
sees it (ADR-0023). 1.16.1 was published on 2026-10-01 and is inside the range `axios` asks for.

## Checklist

- [x] `npm update follow-redirects` with Node 24.21.0's npm (11.19.0), so the lockfile matches CI
- [x] `package.json` unchanged; one entry changed in `package-lock.json`, 1.16.0 to 1.16.1,
      resolved from `registry.npmjs.org`. Its `sha512` equals the registry's published integrity
      for 1.16.1.
- [x] `npm run security:audit` exits 0
- [x] Register: F-66 filed and closed in the same PR
- [x] Gates

## Status

Fixed 2026-10-21 on `fix/follow-redirects-advisory`. `npm audit fix` was not used: it would also
move development-only packages unrelated to this advisory. The full audit still lists `braces`,
`postcss-selector-parser` and `sprintf-js`, which have no patch and are rows F-04 and F-05.
