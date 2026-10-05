# 2026-10-04 - Todo: a bootstrapped fork fails the `format` gate

**Context:** finding N2 (P1) of [`audit-2026-10-04.md`](../audits/saas-readiness/audit-2026-10-04.md). `scripts/bootstrap-fork.sh` rewrites
the brand inside Markdown tables; the padding then no longer matches Prettier's, and
`npm run format` fails on five files under `docs/`. `format` is in CI's `checks` job, so a fork's
first push is red. It is the item that puts Forkability under ADR-001's 80%.

**Size when picked up:** single commit.

## Checklist

- [x] Run `prettier --write` over the rewritten files at the end of the script
- [x] Add `npm run format` to the "Reinstall and verify" line the script prints
- [x] The same message says `localhost:4000`; `.env.example` says `8001` (N11)
- [x] Re-run the fork test from section 2.3 of the audit: clone, bootstrap twice, every gate

## Status

Done 2026-10-05 on `fix/fork-fails-format-gate`.

Prettier is a devDependency and the script usually runs on a fresh clone, before `npm ci`, so the
first box could not be done as written. The script now formats the files it rewrote when
`node_modules/.bin/prettier` exists, and otherwise says so. Either way its closing steps print
`npm run format:fix` after `npm ci`, with `npm run format` in the verify line.

Fork test, Node 24.21.0, each on a fresh clone of the branch:

- Before the change, on `dev` at `9cfeb12`: `format` exit 1 on the same five files as the audit.
- With dependencies installed, `--name acme-app`: `format` exit 0 straight after the script. A
  second run prints "nothing to do". Also exit 0 for `x-web` and for a 42-character name.
- Without dependencies: the script defers, `npm ci`, `format` exit 1, `npm run format:fix`, then
  `lint`, `typecheck`, `format`, `test:unit`, `build`, `test:integration` and `api:types:check` all
  exit 0. `api:spec:check` exits 1 until the fork sets its own spec URL, which step 1 of the
  script's output says.
- `--dry-run` leaves `git status` unchanged.

The root checklist still shows Forkability at 71%. It moves at the next dated audit, not here; this
item should return it to 86% then.
