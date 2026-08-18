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
npm run test:unit       # 4
npm run test:integration # 5
npm run api:spec:check  # 6
npm run api:types:check # 7
npm run build           # 8
```

Notes on reading the output:

- **Gate 1** emits a large pre-existing warning backlog. Only errors fail. Do not report the warning count as a failure — but do check that none of the warnings are in files this branch touched.
- **Gates 6 and 7** failing means the backend shipped a contract change, not that this branch is broken. Report it as drift and point at `/sync-api-types`.
- **Gate 8** is the slowest. If gates 1–7 are green and the diff is test-only, say so and let the user decide whether to skip it.

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
  ✓ test:unit          (142 passed)
  ✗ test:integration   (1 failed — MetricsPageClient.int.test.tsx)

Result: BLOCKED at gate 5
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
