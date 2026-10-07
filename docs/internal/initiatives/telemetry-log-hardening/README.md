# Bounded telemetry intake and a scrubbed log stream

**Status:** Done, merged in #75 (60edae9): implemented, reviewed, all gates green, checked
against the production build. All eight acceptance criteria met. D-01 is ADR-0027.
**Slug:** `telemetry-log-hardening` · **Branch:** `fix/telemetry-log-hardening`

- [Checklist](telemetry-log-hardening-checklist.md) — work items, acceptance, gates
- [Decisions](decisions.md) — `D-NN` entries; promoted ones point at the ADR registry

Findings N6 and N7 of [`audit-2026-10-04.md`](../../audits/saas-readiness/audit-2026-10-04.md).
Origin: [`2026-10-04-todo-reaudit-p2-findings.md`](../../todos/2026-10-04-todo-reaudit-p2-findings.md).

A small sweep, so there is no plan file: the acceptance criteria are in the checklist.

**What this does not do.** It bounds what the three routes buffer and log, per server process. It
does not limit one client: that needs a client IP the app can trust, which waits on the hosting
decision ([`2026-10-02-todo-proxy-client-ip-forwarding.md`](../../todos/2026-10-02-todo-proxy-client-ip-forwarding.md)).
