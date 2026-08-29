# SaaS Readiness — Decisions Log

ADR-style entries for standards adopted in response to the SaaS-base readiness audit of the
Lakira **frontend**. New decisions append at the bottom; do not rewrite history. Each entry
references the originating audit run and concrete file paths.

These are kit-local IDs (`ADR-001`, `ADR-002`, …) and are **not** the same numbering as the
repository ADR registry at `docs/explanation/decisions/` (which is at `adr-0014`, next free
number `adr-0015`). When a kit-local decision stabilises, promote it into that registry and
replace the entry here with a one-line pointer — the convention the backend kit follows.

---

## ADR-001 — Adopt formal SaaS-base readiness criteria (Accepted 2026-08-24)

**Context:** The Lakira frontend is intended to be reusable as a forkable SaaS base. Until
now, "ready to fork" has been a feeling, not a measurable threshold. The baseline audit
(`audit-2026-08-24.md`) needed a binary gate to grade against. The backend adopted an
equivalent gate on 2026-05-01 and it produced deterministic, diffable verdicts.

**Decision:** The frontend is "fork-ready" only when **all four** hold:

1. Zero P0 gaps remaining in the latest audit.
2. All eight empirical gates green: `lint`, `lint:css`, `typecheck`, `test:unit`,
   `test:integration`, `build`, `api:spec:check` + `api:types:check`, `security:scan`.
3. Categories 1 (Auth & Session), 4 (Security), 6 (Developer Experience), 7 (Testing),
   8 (CI/CD & Deployment), 11 (Multi-Tenancy & SaaS Surface), 13 (Forkability) at ≥ 80% Pass.
4. `LICENSE` and `.env.example` present at repo root.

**Options considered:**

- _Reuse the backend's six critical categories verbatim._ Rejected: the backend's list has no
  Multi-Tenancy entry because its tenancy is enforced at the repository layer and was graded
  under Database. On the frontend, tenant representation is the whole product surface — a
  frontend that cannot render an organization is not a SaaS frontend, so it must be gating.
- _Single threshold (≥ 90% across all categories)._ Rejected: hides gaps in critical
  categories behind strong scores in others. An excellent design-token system does not
  compensate for a missing license.
- _Pure P0-zero gate._ Rejected: a P0-free audit could still ship without a `LICENSE` if no
  auditor flagged it; an explicit file check is more robust.

**Consequences:**

- Re-audits produce a deterministic verdict.
- Audit progress is diffable across dated files in this folder.
- Amending the gate requires an appended follow-on ADR.

**Links:** `audit-2026-08-24.md`, `README.md`, `SAAS-BASE-CHECKLIST.md`.

---

## ADR-002 — Audit cadence and storage convention (Accepted 2026-08-24)

**Context:** Treating the audit as a one-shot artifact lets drift creep back. Treating it as a
living spreadsheet loses historical signal. The repo already has a precedent for both the good
and the bad case: `docs/internal/audits/security/audit-2025-11-21/` is a complete run, while
`audit-2025-12-10/` is a scaffold that was never filled in.

**Decision:** Each audit run is written to a new dated file `audit-YYYY-MM-DD.md` in this
folder. Prior audits are immutable — they are the trail. The repo-root
`SAAS-BASE-CHECKLIST.md` always points at the most recent audit and shows its scorecard,
verdict, and open gaps; it is the only mutable surface.

Cadence: re-audit on demand (whenever a P0 closes, or before publishing the repo as a base),
and at minimum quarterly while the project is unreleased.

**Options considered:**

- _Single rolling audit file overwritten each run._ Rejected: loses the ability to diff progress.
- _Dated folders per run, as the security kit does._ Rejected for this kit: a SaaS-readiness
  run is a single observation, not a multi-artifact investigation. One file per run keeps the
  scorecard cohesive and the diff readable.

**Consequences:** the folder grows by one file per re-audit. Acceptable.

**Links:** `README.md`, `SAAS-BASE-CHECKLIST.md`, `docs/internal/audits/README.md`.

---

## ADR-003 — Grade the gates, not just their exit codes (Accepted 2026-08-24)

**Context:** This repo's `.claude/lessons.md` holds exactly two entries, both from 2026-08-17,
and both describe the same failure mode: a gate that was documented as enforced and was inert.
The `components` layer boundary matched nothing because `src/components/**` was never mapped in
`boundaries/elements`; the OpenAPI snapshot drifted twelve paths behind because a copied
artifact had no CI check. `CLAUDE.md` already carries a "Known state of the repo" section
admitting four more.

A readiness audit that only records exit codes would grade all of those green.

**Decision:** Gates that pass **vacuously** are graded as findings in their own right, in the
category they purport to protect, regardless of their exit code. A gate is vacuous when it
cannot fail for the reason it exists.

Recorded at baseline:

| Gate                          | Why it is vacuous                                                                                                        | Evidence                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `coverageThreshold.global`    | Set to 3/2/3/3 % — below any plausible regression                                                                        | `jest.config.ts`                 |
| MSW integration harness       | `handlers` is `[]` while the server runs `onUnhandledRequest: "error"`; tests mock feature hooks at module level instead | `src/test-utils/msw/handlers.ts` |
| `npm run check-accessibility` | Body is `npm install axe-core && echo '…(Placeholder)'`                                                                  | `package.json`                   |
| `npm run coverage:check`      | Not wired into CI, and only fails under `--strict`, which nothing passes                                                 | `.github/workflows/test.yml`     |

**Options considered:**

- _Grade only exit codes, like a conventional audit._ Rejected: it would have scored this
  repo's testing category near-perfect while MSW was an empty array.
- _Fix the vacuous gates before auditing._ Rejected: it destroys the baseline. The point of a
  dated first run is to show where the repo actually started.

**Consequences:** the Testing and CI/CD categories score lower than their exit codes suggest.
That is the intended reading.

**Links:** `audit-2026-08-24.md` §4.7, `.claude/lessons.md`, `CLAUDE.md`.

---

## ADR-004 — Multi-tenancy is a gating category for the frontend (Accepted 2026-08-24)

> **The cache-key half of this decision was promoted** to the architecture registry as
> **[ADR-0015](../../../explanation/decisions/adr-0015-cache-keys-are-organization-scoped.md)**
> on 2026-08-29. That file is authoritative for how keys are written; the entry below remains
> the record of why the category was made gating in the first place.

**Context:** The committed contract `docs/reference/api/lakira-backend-openapi.json` exposes a
complete multi-tenant surface — `/organizations/{id}/members`, `/organizations/{id}/invites`,
`/memberships/{id}`, `/invites/accept`, `/auth/switch-org`. A grep of `src/` for any of those
matches only the generated types file. The frontend implements none of it.

The backend closed its multi-tenancy phase on 2026-05-20 and subsequently discovered
(2026-06-05, findings N1/N2) that its **cache layer** had never been tenant-checked, allowing
cross-org disclosure for a user who was a member of two organizations. That failure mode
transfers directly: the frontend has six `keys.ts` files, none of which carry an org dimension.

**Decision:** Category 11 (Multi-Tenancy & SaaS Surface) is part of the ADR-001 critical set,
and the absence of tenant representation is graded **P0**, not P1.

Further: when the org dimension is added, every `src/features/*/keys.ts` must gain it in the
same change, and each feature must carry an integration test asserting the cache key changes
when the active organization changes. Partial adoption is worse than none — it produces
exactly the backend's N1 disclosure with no compensating signal.

**Options considered:**

- _Grade P1, on the grounds that a forker may want a single-tenant app._ Rejected: the base is
  advertised as a SaaS base and pairs with a multi-tenant backend. Shipping a frontend that
  silently ignores the tenant boundary invites a forker to build on an unsafe assumption.
- _Mark N/A and declare the frontend deliberately single-tenant._ Rejected: it contradicts the
  contract the repo already vendors and gates on in CI.

**Consequences:** the baseline verdict cannot be better than NOT FORK-READY until the
multi-tenancy phase lands. Accepted deliberately.

**Links:** `audit-2026-08-24.md` §4.11, `iteration-plan.md` Phase 6,
`lakira-backend/docs/internal/audits/saas-readiness/audit-2026-06-05.md` §N1/N2.
