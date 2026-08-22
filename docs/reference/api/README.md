# API contract

`lakira-backend-openapi.json` is the OpenAPI contract this frontend is built against. **It is
synced, not authored here — never hand-edit it.**

## Where it comes from

The backend generates it from Zod schemas. This repo pulls a snapshot:

```bash
npm run api:spec:sync     # fetch the current spec
npm run api:spec:check    # fail if the snapshot has drifted
```

Source, by default, is the `dev` branch of `lakira-backend`:

```
https://raw.githubusercontent.com/dimaszisby/lakira-backend/dev/docs/reference/api/lakira-backend-openapi.json
```

Override with `LAKIRA_OPENAPI_BRANCH`, `LAKIRA_OPENAPI_URL`, or `LAKIRA_BACKEND_PATH` (for a local
checkout). See [`../configuration.md`](../configuration.md).

## What is generated from it

```bash
npm run api:types:generate   # → src/types/api/generated/lakira-backend.d.ts
npm run api:types:check      # fail if the generated types have drifted
```

Both `api:spec:check` and `api:types:check` run in CI as the `api-contract` job. A change to the
spec that is not accompanied by regenerated types fails the build.

`src/types/api/generated/` is also protected by `.claude/hooks/protect-files.sh` and excluded in
`.prettierignore` — reformatting it would break the drift gate against a byte comparison.

## Changing the contract

You cannot, from this repo. The order is:

1. Change the Zod schema in `lakira-backend`.
2. Merge it to the backend's `dev`.
3. Run `npm run api:spec:sync && npm run api:types:generate` here.
4. Commit both the snapshot and the regenerated types together.

> The spec exists only on the backend's `dev` branch. Preview builds call the **staging**
> deployment, which may be behind the contract this repo generates against. That gap is expected
> today; see [`../configuration.md`](../configuration.md).

## Related

- [`../routes-and-proxy.md`](../routes-and-proxy.md) — how requests reach these endpoints
- `.claude/skills/sync-api-types/SKILL.md` — the agent-facing procedure
