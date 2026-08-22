# Documentation standards

How `docs/` is organised, and where a new document goes.

## The organising principle

Documents are filed by **what the reader is doing**, not by what the artifact is called. That is
[Diátaxis](https://diataxis.fr/), and it gives four shipped quadrants:

| Quadrant            | The reader is…                     |
| ------------------- | ---------------------------------- |
| `docs/tutorials/`   | learning by doing, start to finish |
| `docs/how-to/`      | accomplishing one specific task    |
| `docs/reference/`   | looking something up               |
| `docs/explanation/` | trying to understand why           |

The failure mode this prevents is the one that produced this tree's predecessor: filing by artifact
type (`checklists/`, `todos/`, `tests-plans-and-logs/`, `ci-cd/`) put a finished February migration
kit at the same level as the live component standards, with nothing to distinguish them.

`lakira-backend` uses the same structure, so moving between the two repos does not mean relearning
where anything lives.

Two rules keep it honest:

1. **One quadrant per document.** A page that both teaches and specifies should be split. The most
   common mistake is a "guide" that is really a reference with a tutorial bolted on — the
   component implementation playbook was exactly that, and now lives in `how-to/development/`.
2. **Generated files are never hand-edited.** `docs/reference/api/lakira-backend-openapi.json` is
   synced from `lakira-backend` and drift-gated in CI as the `api-contract` job.

The placement table lives in `.claude/rules/documentation.md` and is mirrored **byte-identically**
into `.claude/agents/doc-writer.md` between `<!-- PLACEMENT-TABLE:START/END -->` markers. Those two
must stay identical. In the backend, they once disagreed about where architecture docs belonged,
both were followed, and the result was two parallel architecture trees.

Check parity with:

```bash
diff <(sed -n '/PLACEMENT-TABLE:START/,/PLACEMENT-TABLE:END/p' .claude/rules/documentation.md) \
     <(sed -n '/PLACEMENT-TABLE:START/,/PLACEMENT-TABLE:END/p' .claude/agents/doc-writer.md)
```

## `internal/` is not a quadrant

Diátaxis describes documentation _of a system_. It says nothing about **working material** — plans,
checklists, trackers, audit runs — which is most of what a real project accumulates. Here it is 54 of
76 files.

That material lives under `docs/internal/`, beside the quadrants rather than inside them. Forcing it
into a quadrant would corrupt the taxonomy; deleting it would destroy real evidence, including two
security audit runs and four postmortems that are still load-bearing.

## Writing in each quadrant

Each has a voice. Mixing them is what produces documents nobody can use.

- **Tutorial** — teaches by doing, accepts no detours. No options, no alternatives, no _why_. Every
  command must work verbatim from a clean clone. Where a step can fail for an interesting reason,
  say what the failure looks like rather than how to avoid it.
- **How-to** — assumes competence, solves one stated problem. Verb-phrase filename. Alternatives are
  allowed; teaching is not.
- **Reference** — describes what is, accurately and boringly. Tables over prose. Never instructs, and
  must be verified against the running system rather than written from memory.
- **Explanation** — argues. Why this design and not another, and what it costs. No step-by-step.

## Doc kits, for working material only

Inside `docs/internal/initiatives/<topic>/`, an initiative gets a kit. Size it to the work:

| Scope                                             | Kit          | Contents                                                                     |
| ------------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| Large initiative (multi-week, affects CI/process) | Full kit     | README + plan + checklist + ticket + decisions + incidents + metrics-tracker |
| Medium effort (2–5 working days)                  | Standard kit | README + plan/ticket (merged) + checklist + decisions                        |
| Small infra change / quick sweep                  | Lean kit     | README + checklist + at least one `decisions.md` entry                       |
| Single-commit fix                                 | Micro entry  | One entry in the nearest `decisions.md` referencing the commit SHA           |

A document in one of the four shipped quadrants is a **single file**. Do not scaffold a kit around it.

### Keep checklists honest

An unticked box means outstanding work. If the work shipped, tick it — a kit that reads
"awaiting approval" while the code has been live for months is worse than no kit, because it
actively misleads.

### A finished initiative is a record

Do not rewrite a completed initiative doc to match today's layout; that falsifies the record. Add a
pointer instead. The promotion stubs in
[`../internal/initiatives/components-overhaul/decisions.md`](../internal/initiatives/components-overhaul/decisions.md)
are the pattern.

## Architectural decisions

A kit's `decisions.md` is a working log. Decisions that **constrain how the system is built** get
promoted to [`decisions/`](./decisions/) as numbered records, one per file, in Nygard format — with a
pointer left behind in the kit.

Promote if it would still matter to someone who never saw the initiative: which component is
canonical, a focus-management contract, where state lives. Leave it in the kit if it only coordinates
the work: phase order, which sweep to run first.

Of 76 entries in the components-overhaul log, 14 were promoted. The rest were per-component hardening
and test-coverage notes — real history, but not constraints.

Statuses are `Proposed` / `Accepted` / `Superseded`, and a record is **immutable** — supersede it with
a new one rather than editing it. `Proposed` means written down and _not implemented_.

See [`decisions/README.md`](./decisions/README.md) for the format and the next free number.

## Naming and cross-links

- kebab-case filenames; date-prefix anything chronological (`YYYY-MM-DD-*`).
- ADRs are `adr-NNNN-<kebab-slug>.md`, zero-padded to four digits, numbered globally.
- `README.md` is each folder's entry point. Only `tutorials/` carries a top-level quadrant index —
  `docs/README.md` carries the whole map.
- **No YAML frontmatter in `docs/`.** ADRs and plans use bold key/value lines under the H1. YAML is
  confined to `.claude/`.
- Backticked path **mentions** are repo-root-relative (`docs/reference/commands.md`), so they survive
  a file moving. Markdown **links** are relative (`../reference/commands.md`), so they work in both
  GitHub and local preview. Relative links break the moment a file is lifted out of its folder —
  26 broke during this restructure.

## Verification

There is no CI link checker. The gate is a one-off sweep, and it should print nothing:

```bash
grep -rhoE '(docs)/[A-Za-z0-9._/-]+\.(md|json|ts|tsx|mjs|sh|yml)' docs *.md .claude \
  | sort -u | while read -r p; do [ -e "$p" ] || echo "BROKEN: $p"; done
```

Markdown is Prettier-formatted (`npm run format:fix`), and `.prettierignore` excludes only the
OpenAPI snapshot. Do not hand-align tables.

`npm run format` is **not** a CI job, and the repo carries a pre-existing formatting backlog across
both `src/` and older docs. The rule is the same as for lint warnings: leave every file you touch
formatted, rather than clearing the backlog in an unrelated change. Files under
`docs/internal/audits/**` are excluded from that — do not reformat them at all.

Mermaid diagrams must be **rendered** before committing, not eyeballed — a bracket count is not a
parse:

```bash
npx @mermaid-js/mermaid-cli -i diagram.mmd -o /tmp/out.svg
```
