# Documentation

Organised by [Diátaxis](https://diataxis.fr/): what you need depends on what you are doing.

| I want to…            | Go to                            | Example                                          |
| --------------------- | -------------------------------- | ------------------------------------------------ |
| **learn** by doing    | [`tutorials/`](./tutorials/)     | Get the app running against the backend          |
| **accomplish a task** | [`how-to/`](./how-to/)           | Add a route, add a form, run the test suites     |
| **look something up** | [`reference/`](./reference/)     | Which env vars exist; what the design tokens are |
| **understand why**    | [`explanation/`](./explanation/) | Why the layer boundaries; what an ADR decided    |

Two rules keep this tree honest:

1. **A document belongs to exactly one quadrant.** If it teaches _and_ specifies, split it.
2. **Generated files are never hand-edited.** `reference/api/lakira-backend-openapi.json` is synced
   from `lakira-backend` and drift-gated in CI; run `npm run api:spec:sync` instead.

This mirrors the structure of [`lakira-backend`](https://github.com/dimaszisby/lakira-backend), so
moving between the two repos does not mean relearning where anything lives.

---

## Tutorials — learning-oriented

Start here if you are new. Tutorials are followed start to finish and are expected to work verbatim
from a clean clone.

## How-to guides — task-oriented

- [`development/`](./how-to/development/) — add a feature module, a route, a form, a query hook;
  build a component; sync the OpenAPI spec
- [`testing/`](./how-to/testing/) — run the test suites, write a component test
- [`releases/`](./how-to/releases/) — the release, accessibility, and performance gates
- [`ci-cd/`](./how-to/ci-cd/) — the pipeline playbook

## Reference — information-oriented

| Path                                                                 | What                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`api/`](./reference/api/)                                           | Synced OpenAPI contract. **Do not hand-edit.**              |
| [`commands.md`](./reference/commands.md)                             | Every npm script worth running                              |
| [`configuration.md`](./reference/configuration.md)                   | Every environment variable and the `NEXT_PUBLIC_*` rule     |
| [`environments.md`](./reference/environments.md)                     | Environment/secret matrix                                   |
| [`design-tokens.md`](./reference/design-tokens.md)                   | The six token layers, in load order                         |
| [`routes-and-proxy.md`](./reference/routes-and-proxy.md)             | Route map, `@modal` interception, the proxy contract        |
| [`components/`](./reference/components/)                             | UI component standards, read in the order that README gives |
| [`style/`](./reference/style/)                                       | Colour palette and typography scale                         |
| [`accessibility-baseline.md`](./reference/accessibility-baseline.md) | WCAG 2.1 AA criteria this app holds itself to               |
| [`performance-budget.md`](./reference/performance-budget.md)         | Web Vitals, bundle, and Lighthouse budgets                  |
| [`ci-pipeline/`](./reference/ci-pipeline/)                           | The backend→frontend CI/CD contract                         |

## Explanation — understanding-oriented

- [`architecture/`](./explanation/architecture/) — the layer graph, feature-module anatomy, App
  Router and `@modal` routing, data access and caching, the token system
- [`decisions/`](./explanation/decisions/) — architecture decision records, one per file
- [`testing-strategy.md`](./explanation/testing-strategy.md) — the pyramid and its gates
- [`product-requirements.md`](./explanation/product-requirements.md) — as-built product scope
- [`documentation-standards.md`](./explanation/documentation-standards.md) — how these docs are organised

---

## `internal/` — working material, not a quadrant

[`internal/`](./internal/) holds this project's working material: initiative kits, audit runs,
incidents, todos, and archive. It sits _beside_ the four quadrants rather than inside them.

The reason is that Diátaxis classifies documentation **of a system**. It says nothing about the
plans, checklists, trackers, and audit runs a real project accumulates — which here is 54 of 76
files. Forcing that material into a quadrant would corrupt the taxonomy; deleting it would destroy
real evidence.

> [`internal/incidents/`](./internal/incidents/) holds four postmortems covering routing, caching,
> prefetch, and `searchParams`. Read them before touching those areas — the causes recur.

## Where new documentation goes

Pick by the reader's purpose, not by the artifact's shape:

| The document…                                     | Goes to                                     |
| ------------------------------------------------- | ------------------------------------------- |
| teaches a newcomer a skill                        | `tutorials/`                                |
| gets an experienced reader through one task       | `how-to/<area>/`                            |
| is looked up, not read                            | `reference/`                                |
| explains a decision or a concept                  | `explanation/`                              |
| records an architectural decision                 | `explanation/decisions/` (one ADR per file) |
| tracks a piece of work — plan, checklist, tracker | `internal/initiatives/<topic>/`             |
| is a dated one-off note                           | `internal/todos/` or `internal/dev-log/`    |
| is an audit run                                   | `internal/audits/<program>/`                |
| is a postmortem                                   | `internal/incidents/`                       |

The full rule, including kit sizing, lives in
[`explanation/documentation-standards.md`](./explanation/documentation-standards.md) and is mirrored
for agents in [`../.claude/rules/documentation.md`](../.claude/rules/documentation.md).
