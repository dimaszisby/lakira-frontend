# Frontend debt register

**As of:** 2026-10-23, frontend `dev` at `04c2f5a`, with F-06, F-08, F-09, F-10, F-14 to F-21, F-24, F-25, F-27 to F-29, F-31 to F-37, F-40, F-42 to F-50, F-51, F-52, F-53, F-54, F-55, F-56, F-57, F-60, F-61, F-62, F-63, F-64, F-66, F-67, F-68, F-69, F-71, F-72, F-74, F-76 and F-78 closed, and F-41 to its deferred folder split. Ranked by [D-01](decisions.md).

**"What's next" is the first row below whose state is `ready`.** A row above it that is waiting on
someone is reported with it, as a gap. How rows are added and closed:
`.claude/rules/workflow.md` § What's next. Closed rows are in
[`register-closed.md`](register-closed.md).

Columns. **Sev** is what the source recorded; `—` means ungraded, and a todo's own "low" is shown
as written. **Owed to** is who is waiting: `verdict` (the audit's FORK-READY verdict), `BE`
(lakira-backend), `fork` (someone forking the template), `us`. **State** is `ready`, `owner`
(waiting on the owner's decision, with its `O-NN` question), `BE` (waiting on the backend),
`upstream` (waiting on a package's maintainers) or `unexplained`.

Sources are abbreviated: `A10 § 6` is `docs/internal/audits/saas-readiness/audit-2026-10-10.md`
§ 6; `FINAL` is `FINAL-AUDIT-SUMMARY.md` in the same folder; `N1` and `N2` are Part 1 and Part 2 of
the Notion page "FE and BE messages"; `B-NN` is a row of the backend's register (lakira-backend
`docs/internal/initiatives/backend-debt-register/register.md`); a bare filename is under
`docs/internal/todos/`. [`SAAS-BASE-CHECKLIST.md`](../../../../SAAS-BASE-CHECKLIST.md) summarises
the same audit and is not a separate source.

## Tier 1 — keeps the audit verdict open

| ID   | Item                                               | Sev | Owed to | State        | Size                 | Source                                                                            | Analysis                                        |
| ---- | -------------------------------------------------- | --- | ------- | ------------ | -------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| F-01 | No deploy job and no deployment configuration (C4) | P1  | verdict | owner (O-01) | ≤1d after the choice | A10 § 3.1 category 8, § 9; FINAL § 8; `2026-08-24-todo-saas-readiness.md` phase 7 | [analysis](analysis-c4-deploy-configuration.md) |

After F-01 merges, a dated audit run is owed: only a run can restate the verdict (ADR-002).

## Tier 2 — P1 or P2 owed to the backend

| ID   | Item                                                                                                | Sev | Owed to | State        | Size | Source                                                                           | Analysis                                             |
| ---- | --------------------------------------------------------------------------------------------------- | --- | ------- | ------------ | ---- | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| F-02 | The frontend's preview and production origins are not chosen, so the backend cannot set CORS (B-03) | P2  | BE      | owner (O-01) | —    | N1 "CORS for every frontend origin"; `2026-02-16-todo-cicd-overview.md`          | [analysis](analysis-decisions-owed-between-repos.md) |
| F-03 | The browser's IP is not forwarded through `/api/proxy`, so proxied users share per-IP limits (B-05) | P2  | BE, us  | owner (O-01) | ≤½d  | N2 "Client IP is lost"; `2026-10-02-todo-proxy-client-ip-forwarding.md`; A10 § 7 | [analysis](analysis-client-ip-through-proxy.md)      |

## Tier 3 — P2 security

Both wait on a package's maintainers, and each todo already says what to do when a patch ships, so
neither is analysed ([D-03](decisions.md)).

| ID   | Item                                                                                  | Sev | Owed to | State                        | Size | Source                                                | Analysis |
| ---- | ------------------------------------------------------------------------------------- | --- | ------- | ---------------------------- | ---- | ----------------------------------------------------- | -------- |
| F-04 | The nightly `dependency-audit` is red on `braces`, which has no patched version (N14) | P2  | us      | upstream; revisit 2026-11-03 | ≤1h  | `2026-10-03-todo-braces-dev-advisory.md`; A10 § 6 N14 |          |
| F-05 | `postcss-selector-parser` and `sprintf-js` advisories that no update clears (N14)     | P2  | us      | upstream                     | ≤1h  | `2026-10-11-todo-dev-advisories-without-patch.md`     |          |

## Tier 4 — other P1 and P2

The P1 first, then smaller first.

| ID   | Item                                                                                     | Sev | Owed to | State        | Size | Source                                                                        | Analysis                                             |
| ---- | ---------------------------------------------------------------------------------------- | --- | ------- | ------------ | ---- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| F-07 | No `CODE_OF_CONDUCT.md`                                                                  | P2  | fork    | owner (O-03) | ≤1h  | A10 § 3.1 category 13                                                         |                                                      |
| F-11 | The production backend URL is undecided, so production environment config waits (B-04)   | P2  | us      | owner, BE    | —    | N1 "Production backend URL"; `2026-02-16-todo-cicd-overview.md`               | [analysis](analysis-decisions-owed-between-repos.md) |
| F-12 | Field web vitals are logged and nothing aggregates them or compares them with the budget | P2  | us      | owner (O-01) | ?    | A10 § 3.1 "Field performance data"                                            | [analysis](analysis-field-vitals.md)                 |
| F-13 | No subscription or plan surface                                                          | P2  | us      | owner (O-10) | ?    | A10 § 3.1 "Subscription or plan surface"; `iteration-plan.md` § P2-only items |                                                      |

## Tier 5 — P3 and ungraded

Listed, not analysed ([D-03](decisions.md)). Between the repos:

| ID   | Item                                                                                                                                                                                                           | Sev | State                  | Source                                                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------- | -------------------------------------------------------------------------------------- |
| F-65 | An invite whose email never arrived blocks re-inviting that address for 7 days once the backend's queue is on; the owner chose that re-inviting replaces a pending invite (B-71), then the form's copy changes | P3  | BE (B-71)              | N2 "The invite email is queued"; `2026-10-23-todo-reinvite-replaces-pending-invite.md` |
| F-58 | The metrics list reports `logCount: 0` for a metric that has logs                                                                                                                                              | —   | BE                     | `2026-10-17-todo-axe-pages-with-data.md`                                               |
| F-59 | The frontend has no smoke steps of its own: the backend's sequence (B-15) runs against the backend, and the same round trip through `/api/proxy` is not written                                                | P3  | owner, BE (after F-11) | lakira-backend #171; `release-checklist.md`                                            |
| F-73 | A new key in the backend's error envelope reaches the browser only once the frontend adds it to the proxy's allowlist (ADR-0034); the backend is asked to say when it adds one                                 | P3  | BE                     | N1 "A new error-envelope key reaches the browser only once the frontend lists it"      |

Security, the proxy and the repository:

| ID   | Item                                                                                                                  | Sev | State                                              | Source                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------- | --------------------------------------------------------- |
| F-22 | `console.warn` and `console.log` are not scrubbed; nothing in CI shows that Next still prints through `console.error` | —   | accepted in ADR-0029; one probe for the next audit | `2026-10-10-todo-reaudit-findings.md` (N7, left as found) |
| F-23 | `next.config.ts` reads `NEXT_PUBLIC_API_BASE_URL` raw, outside the validated environment                              | —   | kept on purpose                                    | `2026-08-24-todo-saas-readiness.md` phase 3               |
| F-26 | Security follow-ups of 2025-11-26, never triaged: moving protected fetching into Server Components                    | —   | owner                                              | `todo-security-20251126.md`, next cycle, item 2           |
| F-75 | Releases are not versioned: no tags, changelog or GitHub releases on `main`                                           | —   | owner                                              | kit `main-release-branch` D-01, out of scope              |

Errors and forms:

| ID   | Item                                                                                                  | Sev | State            | Source                                                     |
| ---- | ----------------------------------------------------------------------------------------------------- | --- | ---------------- | ---------------------------------------------------------- |
| F-30 | Two entries picked by hand for the same minute are refused; an edit through the picker zeroes seconds | —   | owner (O-05), BE | `2026-10-10-todo-reaudit-findings.md` (N15, left as found) |

Interface, accessibility and end-to-end checks:

| ID  | Item | Sev | State | Source |
| --- | ---- | --- | ----- | ------ |

Performance:

| ID   | Item                                                         | Sev | State        | Source                                                   |
| ---- | ------------------------------------------------------------ | --- | ------------ | -------------------------------------------------------- |
| F-38 | The signed-in routes are not under the Lighthouse gate       | —   | owner, BE    | `2026-09-24-todo-authenticated-perf-routes.md`           |
| F-39 | A cold load can paint one frame before the theme script runs | low | owner (O-09) | `2026-09-24-todo-cold-load-paint-before-theme-script.md` |

Tests, docs and this register:

| ID   | Item                                                                                                                              | Sev | State    | Source                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- | --- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| F-41 | A unit and integration folder split (`__tests__/unit`, `__tests__/integration`), to evaluate only if readability degrades         | P3  | deferred | `2026-02-18-tests-structure-overhaul.md`; its coverage item done in #113, `2026-10-19-todo-form-integration-suites.md` |
| F-70 | Caching `node_modules` to skip `npm ci`: about 1 min a job, at the cost of stale-dependency failures; considered, not recommended | P3  | deferred | `2026-10-21-todo-ci-install-on-the-critical-path.md`                                                                   |

## Waiting on the owner, not code

| ID   | Question                                                                                       | Rows                         | Source                                                   |
| ---- | ---------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------- |
| O-01 | Where is the frontend hosted, per environment, and does that host set `X-Forwarded-For`?       | F-01, F-02, F-03, F-11, F-12 | A10 § 9; N2; the backend's O-04                          |
| O-03 | Which code of conduct text, and which contact address?                                         | F-07                         | A10 § 3.1 category 13                                    |
| O-05 | Should two entries picked for the same minute be allowed? That would be a backend change       | F-30                         | A10 § 9, item 2; settled for the common case by #88      |
| O-09 | Is one cold-load frame worth a second script?                                                  | F-39                         | `2026-09-24-todo-cold-load-paint-before-theme-script.md` |
| O-10 | Is a subscription or plan surface in scope for the template? The backend defers its equivalent | F-13                         | `iteration-plan.md` § P2-only items                      |

## Settled just before this register, noted so they are not re-raised

The findings of the 2026-10-10 audit that needed code are closed, each pending a dated run:
N12 (#82), N14 (#83), N7 (#84), N13 (#85), N16 (#86), the two accessibility items (#87) and N15
(#88). The backend's register lists N15 as this side's to raise on the Notion page. #88 settled it
in the form, so there is nothing to raise; what is left of it is F-30.
