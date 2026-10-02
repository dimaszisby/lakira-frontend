# ADR-0023 — Pull requests block on production advisories; a nightly run audits everything

- **Status:** Accepted
- **Date:** 2026-10-02
- **Origin:** `D-01` in the dependency-audit-split kit — [`decisions.md`](../../internal/initiatives/dependency-audit-split/decisions.md)

---

## Context

`Security Scan` ran `npm audit --audit-level=high` over the whole dependency tree on every pull
request and push. An advisory published against any package, including lint, test and build
tooling, therefore failed every open pull request at once, whatever that pull request changed. It
happened at least three times: #3; 899545f, found on #13; and #62 on 2026-09-30, which touched only
a test and Markdown. Each time the fix was a lockfile refresh that held until the next advisory.

Measured on `dev` at 9e52eb6 (Node 24.21.0, npm 11.19.0), 153 of the 1184 packages in the
installed tree are production dependencies (`npm ls --omit=dev --all`). The 2026-09-30 advisories (`brace-expansion`, `fast-uri`) sit only in
the development tree; the 2026-10-01 ones (`next`, `axios`, `dompurify`) sit in the production
tree.

## Decision

- **Pull requests and pushes** run `npm run security:audit`, which is
  `npm audit --omit=dev --audit-level=high`. A high or critical advisory in a package that ships
  still blocks the merge.
- **A nightly workflow**, `.github/workflows/dependency-audit.yml`, runs
  `npm run security:audit:full` (`npm audit --audit-level=high`, every package) on `dev`, and can
  be run by hand through `workflow_dispatch`.
- **Lint keeps the split honest.** `import-x/no-extraneous-dependencies` with
  `devDependencies: false` fails any runtime file under `src/` that imports a devDependency. Such
  an import would ship the package while hiding it from the production audit.

Root config files (`next.config.ts`, `tailwind.config.mjs`, `postcss.config.mjs`) are outside the
lint rule on purpose: they run at build time, and `next.config.ts` imports only a type from `next`.

## Options considered

- **The status quo.** Rejected: development-tool advisories keep blocking unrelated work.
- **Raise the threshold to critical.** Rejected: it lowers the bar for shipped code too, and the
  pipeline playbook already says never to lower the threshold.
- **Fail only when a pull request changes the lockfile.** Rejected: #63's critical `next` advisory
  would have passed every pull request that left the lockfile alone.
- **An ignore-list tool such as `audit-ci`.** Rejected: a new dependency, to manage exceptions npm
  cannot express itself.
- **Dependabot security updates for npm.** Deferred, not rejected. `.github/dependabot.yml`
  records that npm updates stay a manual decision; changing that is a separate record.

## Consequences

- The pull-request gate guards what ships, not what runs in CI. Development tooling (Jest,
  Cypress, PostCSS, Tailwind, TypeScript) executes on CI runners, and a high advisory in it now
  surfaces up to a day late, through the nightly run only. That lag is accepted; Dependabot
  security updates for npm, deferred above, would close it.
- A new development-tool advisory no longer blocks merges. The nightly run fails instead, and
  GitHub sends that failure to "the user who last modified the cron syntax in the workflow file"
  (GitHub Actions docs, `schedule` event). Fixing it is then an ordinary task, as on 2026-09-30.
- A production advisory still blocks every pull request at once, as on 2026-10-01. That is the
  intended outcome: the code that ships is affected.
- Classification now matters. A package moved between `dependencies` and `devDependencies` moves
  between the two audits, and the lint rule is what catches a runtime import of a devDependency.
- Scheduled workflows run only on the default branch (`dev`), and GitHub disables them in a public
  repository after 60 days without activity. A disabled schedule fails silently, so a green
  dispatched run proves the job works, not that the schedule is still alive.
- `--omit=dev` keeps packages npm marks `devOptional`, so the gate errs towards blocking: it can
  flag a package that does not ship, never hide one that does.
- `security:audit` keeps its name and still means "what CI blocks on", so the handover check in
  `.claude/lessons.md` (2026-10-01) is unchanged. Run `security:audit:full` to see everything.

## References

- `.github/workflows/test.yml` (`security` job), `.github/workflows/dependency-audit.yml`
- `docs/reference/ci-pipeline/workflows.md`, `docs/how-to/security/run-a-security-audit.md`
- [`2026-09-30-todo-npm-audit-brace-expansion.md`](../../internal/todos/2026-09-30-todo-npm-audit-brace-expansion.md)
