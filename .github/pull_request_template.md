## What

<!-- What was wrong or missing, and why it matters. Name the issue it closes, if any: "Closes #N".
Link the kit README and every ADR this change adds or supersedes. -->

## Changes

<!-- What changed, by file or area. Say what was deliberately left alone. -->

## Verification

<!-- Run the gates in `.claude/rules/workflow.md` and report each by name. A skipped gate is listed
as skipped, with the reason. -->

| Gate                                             | Result |
| ------------------------------------------------ | ------ |
| format                                           |        |
| lint                                             |        |
| css lint                                         |        |
| typecheck                                        |        |
| unit tests                                       |        |
| integration                                      |        |
| spec drift (`api:spec:check`, `api:types:check`) |        |
| build                                            |        |
| `security:audit`                                 |        |
| e2e, e2e (csp)                                   |        |
| e2e (stack), e2e (csp, stack)                    |        |
