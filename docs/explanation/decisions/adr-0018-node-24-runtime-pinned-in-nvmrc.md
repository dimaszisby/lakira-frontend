# ADR-0018 — Node 24 runtime, pinned once in `.nvmrc`

- **Status:** Accepted
- **Date:** 2026-09-25
- **Origin:** todo — [`2026-09-24-todo-node24-runtime-upgrade.md`](../../internal/todos/2026-09-24-todo-node24-runtime-upgrade.md)

---

## Context

The app was built, tested and run on Node 20, which reached end of life on 2026-04-30 and gets no
more security fixes. It was pinned in five places that had to agree by convention: `.nvmrc`,
`.node-version`, `engines.node`, `@types/node`, and a literal `node-version: 20` in each of the
eight CI jobs.

Release lines, from `nodejs/Release` `schedule.json` on 2026-09-24:

| Line | Maintenance from | End of life |
| ---- | ---------------- | ----------- |
| 22   | 2025-10-21       | 2027-04-30  |
| 24   | 2026-10-20       | 2028-04-30  |
| 26   | 2027-10-20       | 2029-04-30  |

26 becomes LTS on 2026-10-28.

## Decision

1. **Node 24** is the runtime: `.nvmrc` is `24`, `engines.node` is `24.x`, `@types/node` is `^24`.
2. **`.nvmrc` is the only version pin.** `.node-version` is deleted. Every `setup-node` step reads
   `node-version-file: .nvmrc`, so CI and local development take the version from the same file.

## Options considered

- **Node 22.** Rejected: end of life on 2027-04-30 forces the next move in about seven months.
- **Node 26.** Rejected for now: not LTS until 2026-10-28, and native dependencies lag a new line.
  It is the natural next step once it is LTS.
- **Pin an exact patch (`24.21.0`).** Rejected: the pin would need a manual bump for every
  security release. A major pin takes whichever 24.x the runner has cached, so CI and a laptop can
  differ by patch version. That was accepted: this repo relies on no patch-level behaviour.
- **Keep `.node-version` beside `.nvmrc`.** Rejected: two files are two sources of truth, and the
  point of the change is one. nvm and fnm both read `.nvmrc`.

## Consequences

- Developers on another major get an `EBADENGINE` warning from npm, not an error; the tutorial says
  so.
- Node 24 ships npm 11.19, whose install-script policy is recorded separately in
  [ADR-0019](./adr-0019-dependency-install-scripts-are-opt-in.md).
- Verified on 24.21.0 from a fresh `npm ci`: lint, css lint, typecheck, 80 unit suites (669 tests),
  19 integration suites (99 tests) and `next build` all pass. Next 16 requires `>=20.9.0`.
- `lakira-backend` still pins Node 20. Its move is requested on the Notion page "FE message to BE",
  record "Move the runtime off Node 20".
- Moving to 26 later is a one-line change to `.nvmrc` plus `engines` and `@types/node`, and it
  supersedes this record.

## References

- [`nodejs/Release` schedule](https://github.com/nodejs/Release#release-schedule)
- [ADR-0019](./adr-0019-dependency-install-scripts-are-opt-in.md)
