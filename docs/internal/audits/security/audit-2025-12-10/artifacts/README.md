# Artifacts – Lakira FE Security Audit (2025-12-10)

Use this directory to store every piece of evidence referenced in the audit log or control matrix. Prefer one Markdown file per finding/verification so Git history stays readable.

## Naming Convention
- `FE-AREA-###.md` for finding evidence (matches audit-log IDs).
- `CTRL-Vx-y.md` for control verification packages.
- Attach screenshots/logs with descriptive suffixes in the same folder, e.g., `FE-AUTH-012-cookie-flags.png`.

## Artifact Template
````markdown
# Artifact: <ID>
- **Control(s):** ASVS V<>, OWASP A<>, CIS <>, etc.
- **Owner:** <name>
- **Date:** <UTC timestamp>
- **Environment:** dev/staging/prod parity + commit hash
- **Summary:** 1–2 sentences describing what was validated or discovered.

## Steps / Evidence
1. Step-by-step commands or UI actions.
2. Include command outputs or embed screenshot references (`![desc](./FE-...png)`).

## Result
- Pass/Fail/Needs follow-up and rationale.
- Link to remediation issue or code diff if applicable.
````

## Checklist Before Closing a Finding
- Artifact references the exact code version or deployment tested.
- Sensitive details (tokens, secrets) are redacted.
- Any log excerpts include timestamps and request IDs for traceability.
- Audit log row links back to this file via relative path.
