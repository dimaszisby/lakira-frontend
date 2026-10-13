---
name: unquarantine-layout-files-review
description: Review of refactor/unquarantine-layout-files (F-09) - approve with warnings; sweeps that delete a lint exemption leave stale prose in many live docs
metadata:
  type: project
---

Approve with warnings on branch `refactor/unquarantine-layout-files` (debt register F-09).

**How to apply:** When a change removes an exemption, quarantine or other "known state" the repo documents, grep the whole tree (excluding node_modules, .git, .next) for the exemption's name and the file names, not just the docs the author listed; CONTRIBUTING.md and ADR-adjacent pages are the usual misses. When a change deletes a state-dependent branch (a hide-when-signed-in check), enumerate every writer of the state and every way a client navigation can reach the consumer (router.push, back button, hard-navigate) before accepting "it never fired" - Jotai store survives client navigation but not a hard load. Check kit acceptance lines name a method (jest-axe, manual, browser) as documentation.md requires, and that a Small sweep carries one decisions entry unless re-sized.
