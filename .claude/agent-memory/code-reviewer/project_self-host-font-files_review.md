---
name: self-host-font-files-review
description: Review of fix/201-self-host-font-files - approve with warnings; a dependency swap leaves stale prose in docs the author's list missed
metadata:
  type: project
---

Approve with warnings on branch `fix/201-self-host-font-files` (#201).

**How to apply:** When a change swaps how a build-time input is obtained (network download to committed file, or the reverse), grep `docs/reference`, `docs/how-to` and sibling ADRs for the old input's name and its host names, not just the rules files the author listed; reference pages that state a build-time network requirement are the usual miss. Verify numeric claims about a binary asset yourself (a woff2 `fvar` table can be read with node's `zlib.brotliDecompressSync`, no fonttools needed) and compare declared CSS ranges against the axes. A lint ban added to an existing `no-restricted-imports` block inherits that block's `ignores` and its comment, and does not catch dynamic `import()`; probe it with a throwaway file rather than trusting "verified to fire". When an ADR status stays `Proposed` while the decision is already live, check the registry README's definition of Proposed.
