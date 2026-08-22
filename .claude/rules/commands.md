# Common Commands Reference

**Canonical list: [`documents/documentation/commands.md`](../../documents/documentation/commands.md).**

That file is the single source of truth and is checked against `package.json`. Do not keep a second copy here — link instead. The backend repo learned this the hard way: `.claude/rules/commands.md` there documented a `migrate:dev` script that never existed, because it held a second copy of the command list that drifted from reality.

Only the handful worth memorising:

```bash
npm run dev                  # dev server on :3000
npm run typecheck            # tsc --noEmit
npm run test:unit            # *.test.ts(x) — excludes *.int.test.*
npm run test:integration     # *.int.test.ts(x) only
```

The filename decides which suite a test belongs to. Never put both kinds in one file.

These four gates are what CI's `checks` job runs — run them before proposing a change is complete:

```bash
npm run lint && npm run lint:css && npm run typecheck && npm run test:unit
```

`/pre-push` runs the full CI sequence locally.
