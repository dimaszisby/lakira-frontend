# 2026-10-04 - Todo: a bootstrapped fork fails the `format` gate

**Context:** finding N2 (P1) of [`audit-2026-10-04.md`](../audits/saas-readiness/audit-2026-10-04.md). `scripts/bootstrap-fork.sh` rewrites
the brand inside Markdown tables; the padding then no longer matches Prettier's, and
`npm run format` fails on five files under `docs/`. `format` is in CI's `checks` job, so a fork's
first push is red. It is the item that puts Forkability under ADR-001's 80%.

**Size when picked up:** single commit.

## Checklist

- [ ] Run `prettier --write` over the rewritten files at the end of the script
- [ ] Add `npm run format` to the "Reinstall and verify" line the script prints
- [ ] The same message says `localhost:4000`; `.env.example` says `8001` (N11)
- [ ] Re-run the fork test from section 2.3 of the audit: clone, bootstrap twice, every gate

## Status
