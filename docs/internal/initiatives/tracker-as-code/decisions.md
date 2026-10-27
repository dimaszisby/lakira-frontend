# Tracker as code — Decisions

## D-01 — Labels, forms and a PR template in the repository; ranking in labels; a sync run by hand

- **Status:** Accepted
- **Date:** 2026-10-24

> **Promoted to [ADR-0042](../../../explanation/decisions/adr-0042-open-work-moves-to-github-issues.md)**
> in the flat registry. That record is the durable copy; this entry is the original log.

**Context.** Step 2 of the path toward GitHub Issues; step 1 was the docs diet (#149). On `dev`
at `7d72c79`, `.github/` held `dependabot.yml`, two rulesets and four workflows, and no issue or
pull request template. The repository's labels were GitHub's nine defaults, plus `dependencies`
and `github_actions`, which Dependabot applies. `gh` has the `repo` scope and not `project`.

**Decision.** The owner chose on 2026-10-24:

- **Ranking lives in labels** (`type:*`, `tier:*`, `sev:*`, `state:*`), defined in
  `.github/labels.json`. A Project board may come later, on top of them.
- **The sync replaces GitHub's defaults.** `labels.json` lists Dependabot's two labels, so they
  stay.
- **`npm run labels:sync` is run by hand,** dry by default, `--apply` to write. No workflow.

Issue forms for a task, a bug and a decision, with blank issues off and a link to private
vulnerability reporting, and a pull request template in the shape of the PR bodies used today.

**Options considered.** A Project board now: deferred, since it is tied to the owner's account,
not copied to a fork, needs the `project` scope, and would be empty until step 3. Keeping the
defaults beside the new set: rejected, two names for one thing. A workflow on push: rejected, a
write token in CI for a rare command.

**Consequences.** A fork runs the sync once. Until step 3 (register row F-77) the forms can file
issues the register does not rank.

## D-02 — The sync script is TypeScript, run by Node's type stripping

- **Status:** Accepted
- **Date:** 2026-10-24

**Context.** The plan exported the label diff from `scripts/github/sync-labels.mjs` for a unit
test. Jest here transforms only `.ts`, `.tsx`, `.js` and `.jsx` through `ts-jest` in CommonJS
(`jest.config.ts`), so it cannot import an `.mjs` module.

**Decision.** The script is `scripts/github/sync-labels.ts`. Node 24 strips the types and runs it
directly (`node scripts/github/sync-labels.ts`), with no build step and no new dependency. The
unit test imports `planLabelSync` from the same file. The command runs only when the file is
the process's entry point.

**Options considered.** A test that spawns Node to call the `.mjs`: rejected, slower and harder
to read than an import. A separate `.ts` planner beside an `.mjs` runner: rejected, two files for
one script.

**Consequences.** The script is typechecked and linted with the rest of the repository. It uses
only syntax Node can strip: no enums, namespaces or parameter properties. `package.json` declares
no module type, so Node parses the file as CommonJS first and warns
`MODULE_TYPELESS_PACKAGE_JSON` before reading it as ESM. The npm script passes
`--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` for that one warning; adding `"type": "module"`
would change how every other `.js` file in the repository is read.
