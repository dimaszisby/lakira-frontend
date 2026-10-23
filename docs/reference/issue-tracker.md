# Issue tracker

**Purpose:** what the GitHub labels and issue forms of this repository mean, and how a fork gets
them.
**Owner:** whoever changes `.github/labels.json` or `.github/ISSUE_TEMPLATE/`.

The tracker is defined in the repository ([ADR-0042](../explanation/decisions/adr-0042-open-work-moves-to-github-issues.md)).
Until the debt register's open rows move to issues (register row F-77), "what's next" is still
answered from [the register](../internal/initiatives/frontend-debt-register/register.md).

## Labels

`.github/labels.json` is the whole set. An issue carries one `type:` label, and one each of
`tier:`, `sev:` and `state:` once it is triaged.

| Label                                            | Means                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `type:task`, `type:bug`                          | Work to do; something that does not work as it should                                                            |
| `type:decision`                                  | A question the owner must answer first. Replaces the register's `O-NN` rows                                      |
| `tier:1` to `tier:5`                             | The register's ranking tiers, defined in its [D-01](../internal/initiatives/frontend-debt-register/decisions.md) |
| `sev:P1`, `sev:P2`, `sev:P3`                     | The severity the source graded. Ungraded work has none                                                           |
| `state:ready`                                    | Nothing blocks it                                                                                                |
| `state:owner`, `state:backend`, `state:upstream` | Waiting on the owner, on lakira-backend, or on a package's maintainers                                           |
| `state:deferred`                                 | Considered and set aside until something changes                                                                 |
| `dependencies`, `github_actions`                 | Applied by Dependabot to its pull requests                                                                       |

## Forms

New issues open from a form; blank issues are off (`.github/ISSUE_TEMPLATE/config.yml`).

| Form     | Labels it applies              | Asks for                                             |
| -------- | ------------------------------ | ---------------------------------------------------- |
| Task     | `type:task`                    | Why, the source, acceptance criteria, a size         |
| Bug      | `type:bug`                     | What happened, what was expected, steps, environment |
| Decision | `type:decision`, `state:owner` | The question, the options, what it blocks            |

A security problem is never an issue: the form chooser links to private vulnerability reporting,
as [`SECURITY.md`](../../SECURITY.md) says. Pull requests open with
`.github/pull_request_template.md`.

## Syncing the labels

```bash
npm run labels:sync                  # print the plan, write nothing
npm run labels:sync -- --apply       # create, update and delete
```

It needs the GitHub CLI signed in with the `repo` scope, and acts on `gh`'s current repository
unless `--repo owner/name` says otherwise. A label `labels.json` does not list is deleted, and
deleting a label removes it from every issue and pull request carrying it, so read the dry run
first. `src/__tests__/github-tracker.test.ts` checks the file and the forms in the unit gate.

## In a fork

Forking copies `.github/` but not the labels. Run `npm run labels:sync -- --apply` once in the
fork, after `scripts/bootstrap-fork.sh`, which rewrites the repository owner in the form
chooser's security link.
