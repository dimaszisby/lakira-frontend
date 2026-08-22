# Static Checks Checklist - Lakira Frontend

This checklist tracks Layer 1 static quality gates for the frontend repo.

References:

- `docs/explanation/testing-strategy.md`
- `.github/workflows/test.yml`
- `package.json`

---

## 0. Baseline Setup

- [ ] `npm run lint` exists and is aligned with current ESLint policy.
- [ ] `npm run lint:css` exists and runs Stylelint against `src/**/*.{css,pcss}`.
- [ ] `npm run typecheck` exists and runs `tsc --noEmit`.
- [ ] `npm run security:scan` exists and chains lint + audit checks.
- [ ] CI workflow `checks` job runs `lint`, `lint:css`, and `typecheck` in this order.
- [ ] ESLint parser projects include both app/unit and Cypress TS configs.
- [ ] Root TS config excludes Cypress files to avoid Cypress/Jest type collisions.

---

## 1. Local Static Gate Checklist (Per PR)

- [ ] `npm run lint` passes (no ESLint errors).
- [ ] `npm run lint:css` passes.
- [ ] `npm run typecheck` passes.
- [ ] If auth/api/contracts changed: `npm run security:scan` reviewed.

Notes:

- Current lint policy treats warnings as non-blocking and errors as blocking.
- Warning cleanup is tracked separately as a quality backlog stream.

---

## 2. CI Verification Checklist

- [ ] `checks` job is green on pull request.
- [ ] `checks` job is green on merge branch.
- [ ] Any static-check failure has owner and follow-up issue/PR link.

---

## 3. Execution Log

| Date (UTC) | Trigger | Commands | Result | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| 2026-02-18 | Local verification | `npm run lint`, `npm run lint:css`, `npm run typecheck` | PASS | @codex | Layer-1 checklist restored and aligned to current CI/scripts. |

