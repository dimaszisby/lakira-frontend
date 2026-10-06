---
name: csp-script-nonce-review
description: Narrow security review of fix/csp-script-nonce (proxy-issued CSP nonce, widened matcher); verdict request changes on one fail-open edge
metadata:
  type: project
---

Verdict: request changes (one WARNING, fail-open on prefix-matched paths) for branch fix/csp-script-nonce.

**How to apply:** When a change moves a security header from a static config to a matcher-scoped proxy, probe the matcher's exclusions with look-alike prefixes (`/apiary`, `/_next/staticfoo`), not only the real paths: a negative lookahead without a segment boundary silently drops the header, and the app serves the page with no policy at all instead of failing. Check the response with curl rather than trusting a test that builds its own anchored RegExp, because that test only exercises the paths its author thought of. Also ask whether a fallback static policy covers the paths the matcher excludes by accident.
