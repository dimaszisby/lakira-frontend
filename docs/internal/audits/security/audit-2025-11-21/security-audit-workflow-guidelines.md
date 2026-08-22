You already have the _plan_ on security-audit-plan.md — what you need now is a **repeatable, LLM-assisted workflow** that turns that plan into concrete steps and artifacts.

Here’s a practical workflow you can follow for each Lakira FE audit cycle, with explicit “where to use LLM” hooks.

---

## 0. Prep: Repo + Docs Setup (once, then reused)

**Goals:** make the audit repeatable and LLM-friendly.

1. **Create a security docs folder** in the frontend repo, if not already:
   - `docs/internal/audits/security/audit-2025-11-21/security-audit-plan.md` (your existing doc)
   - `docs/internal/audits/security/audit-2025-11-21/security-audit-log.md`
   - `docs/internal/audits/security/audit-2025-11-21/threat-model.md`
   - `docs/internal/audits/security/audit-2025-11-21/control-matrix.md`
   - a prompt library (optional but useful — never written)

2. **Create an audit branch** for each cycle
   Example: `chore/security-audit-2025-11`.

3. **Initial context to feed the LLM** (first session):
   - The **Security Audit Plan** text (you already pasted).
   - The **Frontend PRD** (for flows: auth, metrics, logs, settings, etc.).
   - Backend schema (to understand how FE talks to APIs and what data is sensitive).
   - UI/accessibility docs as context for UX-level security (e.g. forms, error states).

   Ask the LLM to summarize: _“Given these docs, what are likely key assets, trust boundaries, and high-risk flows for Lakira?”_
   Save the output into `threat-model.md`.

---

## 1. Discovery & Threat Modeling (Human + LLM)

**Output:** `threat-model.md`

### 1.1. Identify assets & trust boundaries (LLM assisted)

Prompt idea:

> “Here is Lakira’s PRD and DB schema. Identify:
>
> - Key assets (user data, tokens, metric data, logs, settings, etc.)
> - Trust boundaries (browser ↔ backend API, Vercel ↔ DO backend, CI/CD, etc.)
> - High-risk user flows (auth, metric logging, settings, profile).
>   Map them briefly to OWASP ASVS areas.”

You then:

- Clean up the LLM output.
- Add any architecture details that the LLM can’t see (e.g. actual env vars, deployment quirks).

### 1.2. Enumerate threats & abuse cases

Prompt idea:

> “Using this threat model, list plausible abuse cases (XSS, CSRF, token theft, broken auth, insecure redirects, etc.) specific to Lakira’s flows and components. Group them by OWASP Top 10 and ASVS section.”

Copy this into `threat-model.md` under **Abuse Cases** and adjust.

---

## 2. Map Controls → Code: Build a Control Matrix

**Output:** `control-matrix.md`

Your plan already names OWASP ASVS, OWASP Top 10, CIS, NIST, SLSA. Now make that concrete for the frontend.

### 2.1. Create a basic table

In `control-matrix.md`:

```md
| Benchmark Control           | Area in Lakira FE         | Primary Files/Modules                               | Status | Notes |
| --------------------------- | ------------------------- | --------------------------------------------------- | ------ | ----- |
| ASVS V2.1 Password security | Auth UI + API integration | src/app/(auth)/login/page.tsx, src/features/auth/\* | TBD    | ...   |
| OWASP A03 Injection         | Forms & API clients       | src/components/forms/\*, src/lib/http-client.ts     | TBD    | ...   |
| ...                         | ...                       | ...                                                 | ...    | ...   |
```

### 2.2. Use the LLM to pre-fill

Prompt idea (with your `tree src` or a manual directory list):

> “Here is the Lakira FE directory structure and the threat model. For each of these ASVS sections [list a subset: V1–V5, V7, V10–V14], propose which parts of the codebase are most relevant. Fill in the `Area in Lakira FE` and `Primary Files/Modules` columns.”

You then:

- Review and correct the mapping.
- Mark `Status` as `TBD` for now.

This matrix will drive what you inspect and prevents random spot-checking.

---

## 3. Codebase Inventory & Slicing for LLM Review

**Goal:** slice the code into logical security review “packs” that fit into context.

Define review buckets like:

1. **Authentication & Session Handling**
   - Auth pages, auth context/hooks, token storage (cookies vs localStorage), axios/fetch wrappers.

2. **Forms & Input Validation**
   - Generic form components, metric create/edit, log create/edit, profile update.

3. **API client layer & error handling**
   - HTTP client abstraction, interceptors, retry logic, error surfaces.

4. **Routing, access control, and server components**
   - Protected routes, layout wrappers, middleware, Next.js route handlers.

5. **Rendering & XSS / injection**
   - Any usage of `dangerouslySetInnerHTML`, unescaped HTML, user-provided labels/descriptions.

6. **Configuration, secrets & env exposure**
   - `next.config.*`, `.env` usage, `NEXT_PUBLIC_*` usage.

For each bucket, prepare a short architecture note and relevant file paths so the LLM has context before seeing raw code.

---

## 4. Static Review per Area (LLM as Senior Reviewer)

This is the main loop.

For **each bucket**:

1. **Paste an architecture summary + relevant code slices.**
   Example prompt:

   > “Lakira is a Next.js app. Here is the architecture summary and the code for our auth pages and auth context [paste].
   > Review this in the context of OWASP ASVS V2 (Authentication) and OWASP Top 10 (Broken Access Control, Identification & Auth failures).
   >
   > - Identify specific potential issues.
   > - Call out any unsafe patterns (token storage, missing CSRF, missing lockouts, weak error messages, etc.).
   > - Suggest concrete changes to the code, referencing line numbers or code snippets.”

2. **Capture findings** into `security-audit-log.md`:
   - `id`: `FE-AUTH-001`
   - `controlRef`: `ASVS V2.1, OWASP A07`
   - `description`
   - `evidence`: file path + snippet/hash
   - `severity`
   - `owner`
   - `status`

3. **Update `control-matrix.md` status** for any ASVS/Top10 controls clearly “met” or “gap identified”.

Repeat for each bucket until you’ve covered all high-risk areas.

---

## 5. Tool Output Triage (Tools + LLM)

**Goal:** Combine automated tools with LLM triage so you don’t drown in noise.

1. **Run static tools locally/CI:**
   - ESLint with security rules (e.g. `eslint-plugin-security`, `eslint-plugin-jsx-a11y`).
   - TypeScript strict mode/noImplicitAny etc. (to reduce type leaks).
   - `npm audit --production` (or equivalent like Snyk/Dependabot reports).

2. **Feed summarized output to the LLM**, not the whole raw log:

   Prompt idea:

   > “Here are the grouped ESLint security findings and npm audit results for Lakira FE.
   >
   > - Cluster them by root cause (e.g., unsafe eval, missing dependency pins, prototype pollution risk).
   > - For each cluster, propose a remediation strategy and give representative code-level examples.
   > - Suggest which ones should be blockers before production vs acceptable to defer.”

3. **Log only real findings**:
   - Convert real issues into entries in the `security-audit-log.md`.
   - Link them to relevant controls (ASVS / OWASP / CIS).

---

## 6. Runtime & Behavior Checks (Manual + LLM-generated test cases)

LLM can’t poke your running app directly, but it can help you design abuse tests.

1. **Ask the LLM to design a manual test script**:

   > “Given the threat model and control matrix, write a test script for manually probing Lakira FE in the browser:
   >
   > - Authentication & session (token theft, error messages, login throttling, logout correctness).
   > - Cross-site scripting attempts in metric names/descriptions.
   > - Trying to access another user’s metric/log by editing IDs in URLs / queries.
   > - CSRF-like patterns (can I trigger state-changing requests without being in the app UI?).”

2. **Execute those tests yourself** in the dev/staging environment:
   - Use DevTools (Network, Storage, Application).
   - Check cookies (flags: `Secure`, `HttpOnly`, `SameSite`).
   - Tamper with requests, params, body.

3. **Record outcomes**:
   - Any unexpected behavior → new log entry in `security-audit-log.md`.
   - Even if “no issue found”, note that the control was tested and passed.

---

## 7. Supply Chain & CI/CD Integrity

For the frontend:

1. **Lockfiles & dependency pinning**
   - Ensure `package-lock.json` or `pnpm-lock.yaml` is in repo and enforced.
   - Confirm no `*` or overly wide version ranges for critical deps.

2. **CI/CD checks (GitHub Actions, Vercel)**
   - LLM prompt:

     > “Here is our CI/CD config for Lakira FE [paste]. Review for:
     >
     > - Handling of secrets.
     > - Reproducible builds.
     > - Use of lockfiles.
     > - Any obvious gaps vs SLSA level 1–2 expectations.
     >   Provide concrete improvements.”

3. **Document any gaps** as supply-chain findings in the audit log and map them to SLSA/CIS 16.

---

## 8. Synthesis, Reporting & Remediation Planning

Now you turn raw findings into something portfolio-worthy.

### 8.1. Use the LLM to draft the **Security Audit Log** & Exec Summary

Give it:

- The threat model.
- The control matrix.
- A rough bullet list of findings you collected.

Prompt idea:

> “Using these inputs, generate:
>
> 1. A structured `security-audit-log.md` with a table of findings (ID, title, description, evidence, benchmark refs, severity, owner, target date, status).
> 2. An executive summary oriented at a hiring manager, summarizing Lakira FE’s security posture, strengths, and main remediation themes.”

You then:

- Review and sanitize anything overly verbose.
- Add your own commentary where you made tradeoffs (e.g. “we accept this risk for MVP”).

### 8.2. Create a **Remediation Tracker**

Either:

- Another section in `security-audit-log.md`, or
- A separate `remediation-tracker.md` / Linear/Jira board.

LLM prompt:

> “Convert these high and medium severity findings into concise, actionable tickets with acceptance criteria (including tests to add).”

---

## 9. Retest & Regression Workflow

To close the loop and make future audits cheaper:

1. **Fix issues on your branch**.

2. **Use the LLM to review diffs**, not full files:

   > “Here is the diff for the auth context. Confirm that this change addresses finding FE-AUTH-001 and does not introduce new obvious security issues.”

3. **Add tests where possible**:
   - Unit tests around validation.
   - Integration tests for dangerous flows.
   - LLM can help generate test cases and skeletons.

4. **Update `security-audit-log.md`**:
   - Mark findings as `Verified` once tests pass and you’ve manually rechecked.

5. **Bake key checks into CI**:
   - ESLint + TS strict on every PR.
   - `npm audit` (or Snyk/Dependabot) on schedule.
   - Secret scanning hooks.
   - Optionally: basic `next lint`/`next check` as gate.

---

## 10. How This Looks in Practice (TL;DR Flow)

For each audit cycle:

1. **Day 0** – Prep & context:
   - Ensure docs + branch.
   - Feed plan + PRD + schema to LLM → threat-model.md.

2. **Day 1** – Mapping & static review:
   - Build/update control-matrix with LLM.
   - Review code bucket-by-bucket using LLM.
   - Run ESLint + `npm audit`; triage via LLM.

3. **Day 2** – Runtime probing & supply chain:
   - LLM designs manual test script; you execute.
   - Review CI/CD & dependency practices with LLM.

4. **Day 3** – Reporting & remediation:
   - LLM helps draft audit log + exec summary.
   - Translate top findings into tasks; start fixes.
   - Add regression tests & CI checks.

You can shrink or expand this based on scope, but the **shape** stays the same:
_context → map to standards → slice code → LLM-assisted review → tooling triage → runtime checks → synthesized report → remediation & regression._

If you want, next step we can design concrete **prompt templates** and a minimal `security-audit-log.md` schema that fits nicely with your repo style.
