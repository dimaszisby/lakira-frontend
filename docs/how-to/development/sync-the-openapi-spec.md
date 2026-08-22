# Sync the OpenAPI spec

The contract is generated in `lakira-backend` and snapshotted here. Both the snapshot and the types
generated from it are drift-gated in CI as the `api-contract` job.

## The routine

```bash
npm run api:spec:sync        # pull the current spec
npm run api:types:generate   # regenerate src/types/api/generated/
```

Commit both together. A snapshot without regenerated types fails CI, and vice versa.

To check without writing:

```bash
npm run api:spec:check
npm run api:types:check
```

## Choosing a source

| Variable                                | Effect                                                          |
| --------------------------------------- | --------------------------------------------------------------- |
| _(none)_                                | `lakira-backend` `dev` branch on GitHub. The default.           |
| `LAKIRA_OPENAPI_BRANCH=main`            | A different backend branch.                                     |
| `LAKIRA_BACKEND_PATH=../lakira-backend` | A local checkout. Use while developing against a local backend. |
| `LAKIRA_OPENAPI_URL=…`                  | An arbitrary URL. Escape hatch.                                 |

> The spec exists only on the backend's `dev` branch — not `staging`, not `main`. The contract this
> repo generates against is therefore ahead of the staging deployment that preview builds call.
> That gap is known and expected today.

## Never hand-edit either file

`docs/reference/api/lakira-backend-openapi.json` and `src/types/api/generated/` are both:

- blocked by `.claude/hooks/protect-files.sh`,
- excluded in `.prettierignore` — reformatting them breaks the byte comparison the drift gate uses.

To change the contract, change the Zod schema in `lakira-backend`, merge it to that repo's `dev`,
then sync here.

## Related

- [`../../reference/api/README.md`](../../reference/api/README.md)
- [`../../reference/configuration.md`](../../reference/configuration.md)
