---
name: pre-push
description: Run the full local validation checklist before pushing. Use when the user says "pre-push", "ready to push", "check before I push", or asks whether a branch is safe to open a PR from.
disable-model-invocation: true
---

# Pre-Push Validation

Run the gates CI runs, in CI's order, locally. Stop at the first failure — the chain is serial in CI too, so a later gate's result would be meaningless.

## Sequence

```bash
npm run lint            # 1
npm run lint:css        # 2
npm run typecheck       # 3
npm run format          # 4
npm run test:unit       # 5
npm run test:integration # 6
npm run api:spec:check  # 7
npm run api:types:check # 8
npm run build           # 9
```

Notes on reading the output:

- **Gate 1** runs with `--max-warnings=0`, so any warning fails it, the same as an error. There is no pre-existing backlog to discount: `dev` has been at zero since 2026-09-24.
- **Gate 4** is `prettier --check`. It fails whole, not per-file, and `npm run format:fix` resolves it — never hand-format. It runs last of the four static gates in CI for the same reason it sits here: a formatting slip must not mask a type error.
- **Gates 7 and 8** failing means the backend shipped a contract change, not that this branch is broken. Report it as drift and point at `/sync-api-types`.
- **Gate 9** is the slowest. If gates 1–8 are green and the diff is test-only, say so and let the user decide whether to skip it.

E2E is deliberately not in this list — it needs a running app and takes minutes. Run it separately when the change touches a user journey:

```bash
npm run build && npm run start &
npm run test:e2e
```

## Report

```
Pre-push validation
  ✓ lint
  ✓ lint:css
  ✓ typecheck
  ✓ format
  ✓ test:unit          (142 passed)
  ✗ test:integration   (1 failed — MetricsPageClient.int.test.tsx)

Result: BLOCKED at gate 6
```

Then the actual failure output, and a one-line diagnosis.

End with `Result: READY TO PUSH` or `Result: BLOCKED at gate <n>`. Never report READY without having run every gate.

## When green

Provide the commit and push commands for the user to run — do not run them:

```
git add <explicit paths>
git commit -m "<conventional commit message>"
git push -u origin <branch>
```

Then the PR title and body, per `.claude/rules/workflow.md`.
