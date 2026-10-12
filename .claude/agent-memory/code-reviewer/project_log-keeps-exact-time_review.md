---
name: log-keeps-exact-time-review
description: Approve with notes on fix/log-keeps-exact-time (N15); heuristic for serializer-precision fixes
metadata:
  type: project
---

Verdict: approve with notes, branch fix/log-keeps-exact-time (uncommitted diff review).

**How to apply:** When a fix changes how precisely a value is serialized, trace the value through every producer, not just the changed call site: here the form default (`new Date()`), the picker's onChange (zeroes seconds, offset string without ms) and the edit default (`new Date(stored)`) each feed the same field, so the fix only changes what happens when the user leaves the time alone. Check that the test comments and names claim only what the assertion proves (a "to the millisecond" title with a `>= openedAt` check is weaker than it reads). Check the other side of the contract in the sibling repo at origin/dev before accepting the stated reason. Sub-minute precision is not new to readers if other writers (API, imports) could already store it, so say that before hunting for display breakage.
