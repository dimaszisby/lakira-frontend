# 2026-10-24 - Todo: fast-uri advisories in the production tree

**Context:** found on `chore/sync-api-spec-backend-221`, when `npm run security:audit` ran right
before handover. The gate passed, since it fails only on high, but the report listed `fast-uri`
for the first time. Four advisories were published between 21:36 and 21:41 UTC on 2026-10-23.

| Advisory                                                                       | Severity | Affects                   | Patched in |
| ------------------------------------------------------------------------------ | -------- | ------------------------- | ---------- |
| GHSA-w74x-v6f9-j3xg, URI scheme spoofing via percent-encoded scheme decoding   | medium   | `fast-uri` 3.0.0 to 3.1.8 | 3.1.9      |
| GHSA-wjr9-j795-jxcr, host confusion via unchecked WHATWG host canonicalization | medium   | `fast-uri` 3.0.0 to 3.1.8 | 3.1.9      |
| GHSA-xhq7-xmqj-769h, improper path equivalence in relative reference handling  | low      | `fast-uri` 3.0.0 to 3.1.8 | 3.1.9      |
| GHSA-333x-w4r6-6crp, scheme injection via an unescaped first-segment colon     | low      | `fast-uri` 3.0.0 to 3.1.8 | 3.1.9      |

What is known, checked on 2026-10-24:

- `npm ls fast-uri --omit=dev` shows one copy, 3.1.8, under `@hookform/resolvers` 5.9.2 through
  `ajv` 8.20.0, which asks for `fast-uri` `^3.0.1`. #152 brought `@hookform/resolvers` 5.9.2, and
  with it this path into the production tree; before it `fast-uri` was a development dependency
  only.
- `ajv` is loaded only by the resolvers' `ajv` entry point. Every form here imports `zodResolver`.
  _Inference:_ the flaw was not reachable here; the fix does not depend on it.

## Checklist

- [x] Move `fast-uri` to 3.1.9 in the lockfile with `npm update fast-uri`; `package.json` is
      unchanged and `npm audit --omit=dev` reports 0

## Status

Fixed 2026-10-24 in #153, on `chore/sync-api-spec-backend-221`, as its second commit.
`fast-uri` 3.1.8 to 3.1.9; the lockfile changes no other package. Register row F-79.
