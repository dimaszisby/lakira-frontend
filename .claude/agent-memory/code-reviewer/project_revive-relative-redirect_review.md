---
name: revive-relative-redirect-review
description: Review of fix/218-revive-relative-redirect (uncommitted); approve with one warning on header-value encoding
metadata:
  type: project
---

Verdict: approve with one warning, branch `fix/218-revive-relative-redirect`.

**How to apply:** When a change swaps `new URL(path, base)` for a raw string, ask what the URL constructor was doing silently: it percent-encodes non-ASCII and strips control characters, and a raw string goes into a `Headers` value that throws a TypeError on anything above U+00FF or on CR, LF and NUL. Trace every caller of the string-building helper and find which return their input unencoded (here `authRoutes.afterAuth` returns `returnUrl` verbatim, while `login()` encodes through `buildPath`). Check `node -e 'new Headers({Location: "/€"})'` rather than assuming. Also check what happens after a side effect has already run: a throw after a token rotation loses the rotated cookie. Mocked refresh in a unit test hides that ordering, so look for it by reading the handler top to bottom.
