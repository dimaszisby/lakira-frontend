---
name: revive-keeps-session-review
description: Review of fix/220-revive-keeps-session-when-backend-down (tri-state refresh outcome, 503 revive page, proxy 502); approve with warnings
metadata:
  type: project
---

Approve with warnings: branch fix/220-revive-keeps-session-when-backend-down (uncommitted diff, off dev f00ccf7).

**How to apply:** When a change splits one failure signal into "ended" and "keep going", check every cache or memo that sits between the producer and its callers: a remembered "keep going / try later" answer with a long TTL makes the user's own retry control a no-op until it expires, so compare the TTL with the Retry-After and retry affordance the change advertises. Then enumerate what the new keep-alive branch can never exit: if the only exits are "backend recovers" and "backend refuses", ask what the user sees when the backend keeps answering 5xx for that one session, and whether the page offers a way to sign in again. Grep the reference docs for the numbered step list of the flow being changed, not only the prose sections: a step like "if that fails, clear cookies" survives a prose-only edit. Check classification edges by status family (408, 404 from a gateway, 2xx with a non-JSON body from an intermediary), and check whether the outbound call has a timeout, since "unreachable" only becomes a signal if the call can fail within a bounded time.
