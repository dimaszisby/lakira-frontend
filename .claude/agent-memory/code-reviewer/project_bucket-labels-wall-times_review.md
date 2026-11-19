---
name: bucket-labels-wall-times-review
description: Approve w/ warnings on fix/208-bucket-labels-are-wall-times (wall-time bucket labels, jest TZ pinned in globalSetup)
metadata:
  type: project
---

Verdict: approve with warnings, branch fix/208-bucket-labels-are-wall-times (uncommitted diff off dev b16b325).

**How to apply:** When a fix changes a value's type from string to Date (or any parsed form) in a helper, grep the one downstream consumer that stringifies it (`toISOString`, `format`) and ask what an invalid input did before versus now: a string passed through harmlessly, a Date throws. When a PR claims an environment setting "never applied" and moves it, grep every doc and rule that still states the old home (`rules/`, `docs/how-to`, `environment.md` tables), and check the path-scope list in the rule file that covers the new file. For tests that spawn a child Node with a type-stripping flag, check the Node version the CI uses against what the author ran, and whether a default timeout applies to the spawn; a local pass on a newer Node proves little. A timezone fix is only proved by a test that runs in a non-UTC zone, so check the zone is really set, not assigned to a process.env copy.
