# Initiatives

One folder per piece of work, named by its slug, which is also its branch and its `refs:` footer
(`.claude/rules/workflow.md` § The kit slug is the traceability spine). A finished kit is a
record: it stays here as written, and the ADRs it promoted link back to it. What is still open is
in the [debt register](frontend-debt-register/register.md), not in this list.

## Active

| Kit                                                        | What                                                       | PR                |
| ---------------------------------------------------------- | ---------------------------------------------------------- | ----------------- |
| [frontend-debt-register](frontend-debt-register/README.md) | Every open item, ranked; "what's next" is answered from it | #89, kept current |

## Done

| Kit                                                                | What                                               | Merged           |
| ------------------------------------------------------------------ | -------------------------------------------------- | ---------------- |
| [api-error-messages](api-error-messages/README.md)                 | API error messages                                 | #36, 2026-09-21  |
| [build-inside-e2e](build-inside-e2e/README.md)                     | E2E builds the app itself                          | #138, 2026-10-22 |
| [category-chip-contrast](category-chip-contrast/README.md)         | Category chip contrast                             | #143, 2026-10-23 |
| [chart-text-summary](chart-text-summary/README.md)                 | A text summary for each chart                      | #103, 2026-10-17 |
| [ci-in-parallel](ci-in-parallel/README.md)                         | CI jobs in parallel behind one gate                | #134, 2026-10-21 |
| [csp-script-nonce](csp-script-nonce/README.md)                     | A nonce for scripts in the Content Security Policy | #74, 2026-10-06  |
| [cypress-a11y-e2e](cypress-a11y-e2e/README.md)                     | Cypress accessibility and auth-flow E2E            | #60, 2026-09-29  |
| [dependency-audit-split](dependency-audit-split/README.md)         | Dependency audit split                             | #64, 2026-10-03  |
| [dev-ruleset](dev-ruleset/README.md)                               | `dev` protected by a ruleset                       | #140, 2026-10-22 |
| [docs-diet](docs-diet/README.md)                                   | Register split, lessons into rules, this index     | #149, 2026-10-23 |
| [drop-withauth](drop-withauth/README.md)                           | `withAuth` and the dead auth shims removed         | #41, 2026-09-22  |
| [form-shows-latest-error](form-shows-latest-error/README.md)       | A form shows its latest error                      | #102, 2026-10-16 |
| [list-variant-breakpoint](list-variant-breakpoint/README.md)       | A list picks table or cards in CSS                 | #133, 2026-10-21 |
| [log-list-default-order](log-list-default-order/README.md)         | Log lists open newest logged first                 | #142, 2026-10-23 |
| [main-release-branch](main-release-branch/README.md)               | `main` reset onto `dev` and protected              | #146, 2026-10-23 |
| [metric-detail-contrast](metric-detail-contrast/README.md)         | Contrast on the metric detail page                 | #78, 2026-10-08  |
| [mobile-sign-out](mobile-sign-out/README.md)                       | Sign-out on mobile                                 | #130, 2026-10-21 |
| [org-lists-follow-cursor](org-lists-follow-cursor/README.md)       | Org lists fetch every page of their cursor         | #151, 2026-10-24 |
| [org-switcher](org-switcher/README.md)                             | Organization switcher                              | #56, 2026-09-29  |
| [page-headings](page-headings/README.md)                           | An `h1` on every page                              | #123, 2026-10-20 |
| [profile-load-errors](profile-load-errors/README.md)               | Profile load errors                                | #100, 2026-10-16 |
| [proxy-error-body-allowlist](proxy-error-body-allowlist/README.md) | Proxy error-body allowlist                         | #131, 2026-10-21 |
| [reaudit-p2-sweep](reaudit-p2-sweep/README.md)                     | The P2 findings of the 2026-10-04 re-audit         | #76, 2026-10-07  |
| [route-error-boundaries](route-error-boundaries/README.md)         | Route error boundaries                             | #90, 2026-10-13  |
| [saas-reaudit-2026-10-04](saas-reaudit-2026-10-04/README.md)       | SaaS re-audit, 2026-10-04                          | #70, 2026-10-05  |
| [saas-reaudit-2026-10-10](saas-reaudit-2026-10-10/README.md)       | SaaS re-audit, 2026-10-10                          | #81, 2026-10-10  |
| [sentry-error-monitoring](sentry-error-monitoring/README.md)       | Sentry error monitoring                            | #69, 2026-10-04  |
| [server-set-session-cookie](server-set-session-cookie/README.md)   | The server sets the session cookie                 | #73, 2026-10-05  |
| [stack-suites-in-ci](stack-suites-in-ci/README.md)                 | Stack suites in CI                                 | #127, 2026-10-21 |
| [table-row-accessible-name](table-row-accessible-name/README.md)   | Table row accessible name                          | #137, 2026-10-22 |
| [telemetry-log-hardening](telemetry-log-hardening/README.md)       | Bounded telemetry intake and a scrubbed log stream | #75, 2026-10-07  |
| [theme-switching](theme-switching/README.md)                       | Theme switching                                    | #35, 2026-09-20  |
| [unquarantine-layout-files](unquarantine-layout-files/README.md)   | Layout files brought inside the layer rule         | #91, 2026-10-13  |
| [zod-4-upgrade](zod-4-upgrade/README.md)                           | zod 4 and resolvers 5, clearing a zod advisory     | #152, 2026-10-24 |

## Earlier programmes

Moved here in the documentation restructure of 2026-08-22, before kits had a README, a status line
or a merge PR of their own. Their state is whatever their own files say.

| Folder                                               | What                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| [analytics](analytics/)                              | Analytics overhaul plans and checklists, backend and frontend              |
| [cicd](cicd/README.md)                               | CI/CD overview, pipeline plan and checklist                                |
| [components-overhaul](components-overhaul/README.md) | The 2026 UI components overhaul; its decision log is the source of 14 ADRs |
| [routing](routing/)                                  | Next router audit and plan                                                 |
| [tests-overhaul](tests-overhaul/)                    | The test-suite overhaul, one folder per test layer                         |
