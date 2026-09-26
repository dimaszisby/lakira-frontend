# ADR-0019 — Dependency install scripts are opt-in

- **Status:** Accepted
- **Date:** 2026-09-25
- **Origin:** todo — [`2026-09-24-todo-node24-runtime-upgrade.md`](../../internal/todos/2026-09-24-todo-node24-runtime-upgrade.md)

---

## Context

Node 24.21.0 ships npm 11.19, which reads an `allowScripts` field in `package.json`. It lists
which dependencies may run install-time lifecycle scripts (`preinstall`, `install`, `postinstall`).
An install script runs arbitrary code on every machine that installs the package, CI included, and
is the usual route for a compromised npm package.

Behaviour in 11.19, measured on 2026-09-25 with a fresh `npm ci` and an empty Cypress cache, and
confirmed against npm's bundled `config.md`:

- A package **not listed** still runs its script, and npm prints a notice ("not yet covered by
  allowScripts"). The `npm install-scripts` man page says such scripts are "blocked by default";
  for 11.19 that is wrong. `strict-allow-scripts` (default `false`) is what turns the notice into a
  hard error.
- A package set to **`false`** is skipped silently.
- A package set to **`true`** runs.

Four dependencies have install scripts:

| Package         | Script does                                                                 | Needed here                                               |
| --------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `cypress`       | downloads the Cypress binary                                                | Yes: `e2e` runs it                                        |
| `msw`           | copies the service worker, only if `package.json` has `msw.workerDirectory` | No: the field is absent, so the script does nothing       |
| `fsevents`      | build fallback                                                              | No: the prebuilt `fsevents.node` ships; macOS only anyway |
| `unrs-resolver` | checks the native binding that arrives through `optionalDependencies`       | No: lint, which loads it, passes without the check        |

## Decision

Install scripts are opt-in. `allowScripts` allows `cypress` and denies `msw`, `fsevents` and
`unrs-resolver`. The list is managed with `npm install-scripts approve|deny`, which pins an
approval to the version installed (`cypress@15.21.0`).

## Options considered

- **Allow all four.** Rejected: it keeps behaviour identical, but it runs three scripts this repo
  does not need and gives up the review step for new ones.
- **No `allowScripts` at all.** Rejected: under 11.19 that runs everything with a notice on every
  install, and it breaks the day npm makes blocking the default.
- **Pin npm below 11.19.** Rejected: it only postpones the decision, and it needs a pinned npm in
  CI and on every laptop.
- **`strict-allow-scripts` in CI.** Not adopted yet: it would turn a new unreviewed script into a
  failed install rather than a notice. It is worth revisiting once the list has been stable for a
  while.

## Consequences

- Only Cypress's postinstall runs. Verified: a fresh `npm ci` on Node 24 with an empty
  `CYPRESS_CACHE_FOLDER` downloaded Cypress 15.21.0 and `cypress verify` passed. The three denied
  scripts did not run, and lint, typecheck, unit, integration and build all passed without them.
- **A Cypress upgrade needs a new approval.** The approval is for `cypress@15.21.0`. After a bump,
  the new version is unreviewed: under 11.19 it still runs with a notice, but under a blocking
  default `e2e` would fail with no binary. Run `npm install-scripts approve cypress` in the same
  change as the bump.
- A new dependency with an install script shows up in `npm ci`'s output. Deciding it is part of
  adding the dependency.
- Older npm versions ignore the field, so nothing depends on which npm a machine has.
- The rule is stated in `.claude/rules/security.md`, next to the action-pinning and secret-scan
  rules it sits with.

## References

- [ADR-0018](./adr-0018-node-24-runtime-pinned-in-nvmrc.md) — the runtime move that brought npm 11.19
- npm 11.19 bundled docs: `npm help install-scripts`, and `config.md` § `strict-allow-scripts`
