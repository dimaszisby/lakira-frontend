# zod 4 upgrade — Checklist

Register row F-78, [todo](../../todos/2026-10-24-todo-zod-advisory.md). Plan:
[`zod-4-upgrade-plan.md`](zod-4-upgrade-plan.md). Decisions: [D-01 to D-03](decisions.md),
[ADR-0043](../../../explanation/decisions/adr-0043-the-frontend-moves-to-zod-4.md).

## Phase 0 — pin, bump, fix

- [x] `src/constants/__tests__/zod-rules.test.ts`: the atoms' ids, blank dates, defaults and
      messages, passing on zod 3.25.76 before the bump and unchanged after it
- [x] `package.json`: `zod` ^4.6.7, `@hookform/resolvers` ^5.9.2, by `npm install`; the lockfile
      changes no other package's version (D-01)
- [x] `src/constants/zod-rules.ts`: `required_error` replaced by `whenMissing`
- [x] Five forms typed with their schema's input and output types: `RegisterForm`,
      `MetricCategoryForm`, `LogForm`, `MetricSettingsForm`, `MetricForm`, each with a
      `<Name>FormFields` type beside its output type
- [x] `src/features/metric-logs/types.ts`: the log value's own messages, and `logValueNegative`
      in `zod-messages.ts` (D-02); `log-form-schema.test.ts` failed on zod 4 before it
- [x] `src/instrumentation-client.ts`: `z.config({ jitless: true })` (D-03);
      `instrumentation-client.test.ts` failed before it
- [x] `.claude/rules/forms-and-validation.md` and `.claude/rules/security.md`

## Docs

- [x] ADR-0043 and its registry row
- [x] Todo `2026-10-24-todo-zod-advisory.md`; register row F-78 filed and closed in
      `register-closed.md` with #152; the register's "As of" line and README
- [x] `docs/internal/initiatives/README.md`: this kit under Done

## Discovered

- [x] Found: `ZodMessages.common.invalidDate` is never shown. `z.coerce.date()` refuses a bad date
      in zod's words before the refine that carries it runs, on zod 3 as on zod 4 → out of scope,
      the characterization test pins only the refusal, and the copy stays as it was
- [x] Found: zod 4 probes eval and the Content Security Policy reports it on every page → in
      scope, D-03
- [x] Found: zod 4's `.uuid()` checks RFC 9562's version and variant bits →
      `11111111-1111-1111-1111-111111111111` is refused where zod 3 took it; every fixture id and
      the backend's `gen_random_uuid()` ids pass, so nothing changes

## Acceptance

- [x] AC-1 — **a machine checked it**: `npm run security:audit`, 0 vulnerabilities
- [x] AC-2 — **a machine checked it**: `zod-rules.test.ts`, the same cases on both versions
- [x] AC-3 — **a machine checked it**: `npm run test:integration`, 177 of 177, no form suite edited
- [x] AC-4 — **a machine checked it**: `log-form-schema.test.ts`
- [x] AC-5 — **I checked it**: the lockfile's version lines; only `zod` (3.25.76 to 4.6.7) and
      `@hookform/resolvers` (4.1.3 to 5.9.2) move, and `ajv` 8.20.0 and 6.15.0 are re-hoisted

## Gates

- [x] lint
- [x] css lint
- [x] typecheck
- [x] format
- [x] unit tests, with `coverage:check`
- [x] integration
- [x] spec drift and `security:audit`
- [x] build
- [x] e2e, 18 of 18, and e2e (csp), 7 of 7, against `next start` of this build
- [x] e2e (stack), 71 of 71, and e2e (csp, stack), 8 of 8. The local backend image was built
      from `00fb2d2`, behind backend `dev`, so they ran with `E2E_ALLOW_STALE_BACKEND=1`
