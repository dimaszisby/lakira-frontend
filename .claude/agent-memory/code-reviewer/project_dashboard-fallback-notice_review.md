---
name: dashboard-fallback-notice-review
description: Request changes on feat/205-dashboard-fallback-notice; a status-*-bg surface with inherited text colour fails contrast in dark theme and no gate sees it
metadata:
  type: project
---

Verdict: REQUEST CHANGES, branch feat/205-dashboard-fallback-notice (issue #205, uncommitted diff reviewed against dev 4187256).

**How to apply:** Whenever a diff puts a `status-*-bg` surface (or any token that "deliberately inherits" across themes, per `.claude/rules/styling.md` § semantic) behind text, read `src/styles/tokens/semantic.css` for the dark block and work out the text colour the element actually inherits. Status backgrounds stay light in dark theme while `--text` flips light, so an unset text colour is light-on-light there. `jest-axe` runs in jsdom and cannot compute contrast, so every gate stays green; the only checks are reading the tokens and a dark-theme look. The pairing that works in both themes is the status triad's own `-emphasis` colour. For live regions, a `role="status"` that mounts together with its content (after a skeleton, say) is not reliably announced, so an acceptance criterion that says "announced" needs the region to exist before the text, or an explicit decision. Dismissible UI whose button unmounts on click drops focus to body; ask where focus goes. When a view keeps `keepPreviousData`, state keyed on the filters resets before the data does, so check what the stale data shows in that gap. For date work, confirm range semantics in the backend source (`../lakira-backend`) rather than the contract, which here does not say whether the end is exclusive.
