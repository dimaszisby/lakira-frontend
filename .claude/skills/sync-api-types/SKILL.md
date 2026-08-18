---
name: sync-api-types
description: Resync the OpenAPI snapshot from lakira-backend and regenerate the TypeScript types, reporting what changed. Use when the backend ships an API change, when the api-contract CI job fails, or when the user says "sync types", "update the API contract", or "openapi".
disable-model-invocation: true
---

# Sync API Types

Keeps this repo's view of the backend contract honest. Two artifacts, two gates:

```
lakira-backend  ──api:spec:sync──►  documents/openapi/lakira-backend-openapi.json
                                              │
                                    api:types:generate
                                              ▼
                                    src/types/api/generated/lakira-backend.d.ts
```

Both are **generated**. `.claude/hooks/protect-files.sh` blocks editing either by hand.

## Run

```bash
npm run api:spec:sync        # refetch the snapshot, print an added/removed/changed path diff
npm run api:types:generate   # regenerate the types from the snapshot
npm run typecheck            # see what the new contract breaks
```

Then report:

1. **Paths added, removed, and changed** — from the sync output.
2. **What typecheck now fails on** — these are the real consequences.
3. **Which hand-written DTOs now disagree** with the generated types. Compare `src/types/dtos/*.dto.ts` against the generated `components["schemas"]`. Name them; do not silently fix them all.

## Source

Default is `dev` on GitHub:
`https://raw.githubusercontent.com/dimaszisby/lakira-backend/dev/docs/reference/api/lakira-backend-openapi.json`

**The spec exists only on the backend's `dev` branch** — it has never been promoted to `staging` or `main`. That means the contract we generate against is *ahead of* the staging deployment this app's preview environment actually calls. An endpoint present in the generated types may not exist on staging yet. Check before building a feature on a newly-appeared path.

Overrides: `LAKIRA_OPENAPI_BRANCH` for a different branch, `LAKIRA_OPENAPI_URL` for a different URL, `LAKIRA_BACKEND_PATH` to read from a local checkout. The local path is opt-in only, because a sibling clone is usually on some feature branch and syncing from it would commit a spec that exists on no shared branch.

## Migration stance

Generated types coexist with the hand-written DTOs in `src/types/dtos/`; the replacement is incremental, feature by feature. When they disagree, **the generated type is right** — it came from the backend.

The Zod schemas in `src/types/api/zod-*.schema.ts` are **not** replaced by this. They validate user input in forms; the generated types describe the transport contract. See `.claude/rules/forms-and-validation.md`.

## When CI fails

The `api-contract` job failing means the backend shipped a change, not that the branch is broken. Run the sync, regenerate, commit both files together, and note the contract change in the PR body — a frontend change riding on a backend change has a deploy-ordering constraint (backend first).

## Commit

The snapshot and the generated types always move together. Keep them in their own commit, separate from feature work — the diff is large and reviewing it mixed with logic changes is how contract regressions slip through.

```
chore(api): sync OpenAPI snapshot and regenerate types

<paths added/removed/changed>
```
