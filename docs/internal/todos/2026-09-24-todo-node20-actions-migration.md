# Move the workflows off Node 20 actions

**Purpose:** clear the Node 20 deprecation from every CI job in one change.
**Owner:** hardini
**Branch:** unassigned
**Priority:** medium: CI works today, but only because GitHub forces these actions onto Node 24.
**Found:** 2026-09-24, while hardening the secret scan.

## What CI reports

Every job on `dev` at `6283528` carries this annotation, listing a subset of:

> Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run
> on Node.js 24: actions/checkout@v4, actions/download-artifact@v4, actions/setup-node@v4,
> actions/upload-artifact@v4.

Usage across `.github/workflows/`: `checkout@v4` x9, `setup-node@v4` x8, `upload-artifact@v4` x5,
`download-artifact@v4` x1. Latest releases on 2026-09-24: `checkout` v7.0.1, `setup-node` v7.0.0,
`upload-artifact` v7.0.1, `download-artifact` v8.0.1.

## Checklist

- [ ] Read each action's release notes between v4 and the target major for breaking changes; the
      artifact pair in particular must move together, since `build` uploads what `e2e` downloads.
- [ ] Decide whether to SHA-pin first-party actions too, now that the secret scan runs no
      third-party action at all.
- [ ] Update all workflows in one change; confirm no Node 20 annotation remains on the next run.
- [ ] Note: `ubuntu-latest` moves to Ubuntu 26 from 2026-10-19 (a CI notice on the same runs).
