# Dependency audit split — decisions

## D-01 — PRs block on production advisories; a nightly run audits everything

> **Promoted to [ADR-0023](../../../explanation/decisions/adr-0023-pull-requests-block-on-production-advisories-only.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

- **Status:** Accepted
- **Date:** 2026-10-02

**Context.** `Security Scan` ran `npm audit --audit-level=high` over all 1184 packages on every PR
and push, so an advisory published anywhere in the tree failed every open PR, whatever it changed.
That happened at least three times (#3; 899545f, found on #13; #62 on 2026-09-30). Only 153 of
the 1184 packages are production dependencies.

**Decision.** The PR and push gate runs `npm audit --omit=dev --audit-level=high`. A scheduled
workflow runs the full audit nightly on `dev`. A lint rule stops runtime code in `src/` from
importing a devDependency, which would otherwise hide it from the production audit.

**Options considered.**

- _Status quo._ Rejected: dev-tool advisories keep blocking unrelated work.
- _Raise the threshold to critical._ Rejected: lowers the bar for shipped code as well.
- _Fail only when a PR touches the lockfile._ Rejected: #63's critical `next` RCE would have
  passed every PR that left the lockfile alone.
- _An ignore-list tool such as `audit-ci`._ Rejected: a new dependency to manage exceptions.
- _Dependabot security updates for npm._ Deferred: `.github/dependabot.yml` records that npm
  updates stay manual, and changing that is its own decision.

**Consequences.** A new dev-tool advisory no longer blocks merges; the nightly run reports it
within a day, to whoever last edited the workflow's cron line (GitHub's rule). Tooling that runs in
CI is guarded only by that nightly run. Review on 2026-10-02 added this and the 60-day schedule
disable to ADR-0023.
