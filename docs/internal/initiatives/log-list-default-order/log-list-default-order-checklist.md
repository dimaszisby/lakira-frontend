# Log list default order — Checklist

Register row F-60. The log list opened newest created first; the owner chose newest logged first
([D-01](decisions.md), O-13).

## Change

- [x] `src/features/metric-logs/sort.ts`: `defaultSort: "-loggedAt"`
- [x] `src/features/metric-logs/keys.ts`: the cursor key's fallback reads
      `DEFAULT_METRIC_LOG_SORT`, not a literal
- [x] `src/features/metric-logs/__tests__/listSearchParams.test.ts`: no `sort` in the URL gives
      `-loggedAt`, and an explicit `-createdAt` is kept. The first failed before the change
- [x] `MetricLogsClient.int.test.tsx`: with the default params the request carries
      `sort=-loggedAt` and "Logged At" has `aria-sort="descending"`. Failed before the change
      on `aria-sort`

## Docs

- [x] Register: F-60 closed with #142, O-13 removed, "As of" moved to `ba20d06`; the register
      README's status line
- [x] `2026-10-18-todo-metric-logs-order-after-backend-125.md`: its Found line names the decision

## Discovered

- [x] Found: no doc under `docs/reference`, `docs/how-to` or `docs/explanation` states the log
      order → nothing to update

## Acceptance

- [x] With no `sort` in the URL the log list requests `sort=-loggedAt` and marks "Logged At" as
      sorted descending. _Why:_ F-60. · **a machine checked it**: the new case in
      `MetricLogsClient.int.test.tsx`
- [x] An explicit `sort` in the URL, `-createdAt` included, is still honoured. _Why:_ a link
      already shared keeps its order. · **a machine checked it**: `listSearchParams.test.ts`
- [x] No metric-log code outside the deprecated offset path names `-createdAt` as a default.
      _Why:_ a second default drifts. · **I checked it**: `grep` over `src/features/metric-logs`
      and the logs route leaves only `normalizeList` and the key lists
- [x] F-60 is closed in the register and O-13 removed. _Why:_ the register is what "what's next"
      reads. · `register-todos` passes in the unit gate

## Gates

- [x] lint
- [x] typecheck
- [x] format
- [x] unit tests
- [x] integration
- [x] spec drift and `security:audit`
- [x] build
- [x] e2e (stack), 69 of 69, and e2e (csp, stack), 8 of 8, against `next start` of this build.
      The local backend image was built from `00fb2d2`, four commits behind backend `dev` (#207
      to #210, logging, DTO and auth refactors), so they ran with `E2E_ALLOW_STALE_BACKEND=1`
- [ ] css lint, e2e and e2e (csp): skipped, no style or end-to-end flow changed
