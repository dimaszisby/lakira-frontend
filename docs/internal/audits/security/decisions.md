# Security audit program — Decisions

The program's decision log. Entries append and are never rewritten; a superseded entry says so
and points at its successor. Numbering is `D-NN`, as `.claude/rules/documentation.md` sets for
working logs. The runs before 2026-11-28 (`audit-2025-11-21/`, `audit-2025-12-10/`) kept no
decisions file; their choices are recorded inside their own plans.

---

## D-01 — The basis: OWASP ASVS 5.0.0 Level 2, ranked by the Top 10:2025

- **Status:** Accepted
- **Date:** 2026-11-28
- **Confirmed by:** the owner, at the approval of the 2026-11-28 plan (issue #217)

**Context.** The 2025-11-21 run targeted OWASP ASVS 4.0.3, the OWASP Top 10 2021, CIS Controls and
NIST CSF 1.1. Each has since been superseded: ASVS 5.0.0 was released on 30 May 2025 with
renumbered chapters, so the old matrix's IDs do not carry over; the Top 10 has a 2025 edition; NIST
CSF is at 2.0. The frontend's controls are strong and enforced, but none is mapped to a
requirement, so nothing says which requirements the frontend meets.

**Decision.**

1. **Spine: OWASP ASVS 5.0.0, Level 2.** Every Level 1 and Level 2 requirement of chapters V1 to
   V17 has a row in the control matrix. A requirement the backend owns is graded N/A with a
   pointer to lakira-backend, not dropped. A chapter with no surface in this codebase (file
   handling, OAuth and OIDC, WebRTC) is graded N/A row by row with the reason.
2. **Ranking: the OWASP Top 10:2025.** Every finding names its category.
3. **Governance appendix: NIST CSF 2.0**, for disclosure, audit cadence and repository settings.
4. **Supply chain: the SLSA v1.0 build track**, kept short: action pins, the production image,
   and provenance.
5. **Test procedures adapted, not installed**, from `mukul975/Anthropic-Cybersecurity-Skills` at
   `54a798831d2266a3ca61ce68a7acb80b81160d57` (Apache-2.0). Each is rewritten as this program's
   own procedure, cites the skill and the commit, and ends as a test, a smoke probe or a gate
   where it can.

**Options considered.**

- **ASVS Level 1 only.** About 70 requirements. Rejected: Level 1 is the floor for any
  application, and this repository is meant to be forked as a SaaS base, where Level 2 is the
  stated target of most SaaS security reviews.
- **ASVS 4.0.3, to diff against the 2025-11-21 matrix.** Rejected: that matrix cites files that no
  longer exist and is not diffable anyway, and 4.0.3 is superseded.
- **MITRE ATT&CK, D3FEND, ATLAS, F3, NIST AI RMF.** Rejected: they describe adversaries and
  defences for enterprise hosts, fraud and AI systems, not the verification of a web application.
- **CIS Controls v8.** Rejected: its controls are mostly host and organisation ones, which sit with
  the VPS (ADR-0047), not this repository.
- **The library's own OWASP mapping and "ASVS" tags.** Rejected: they are the 2021 Top 10
  categories under a 2025 label, and the mobile MASVS respectively.

**Consequences.** About 250 matrix rows, most of them graded once and cheap to regrade. A future
run diffs row by row against this one. The Top 10:2025 ranking makes findings comparable with the
backend's program if it adopts the same basis.

---

## D-02 — The production image is scanned with Trivy, run through Docker

- **Status:** Accepted
- **Date:** 2026-11-28
- **Confirmed by:** the owner, at plan approval (#217)

**Context.** Nothing scans the production image or emits an SBOM. No scanner is installed on the
audit machine (`trivy`, `syft` and `grype` are all absent).

**Decision.** Run `aquasec/trivy:0.76.2`, pinned by digest
`sha256:8f6bb947dbc528902e11f2f5be52f7b519f6a39d5d148f41166f2040499768fb`, against the
production image built at the audited commit: a vulnerability scan and a CycloneDX SBOM. Nothing is
added to the repository or installed on the machine. 0.76.2 was published on 2026-11-05.

**Options considered.**

- **No scanner this run.** Rejected: the run would grade image scanning "nothing enforces it"
  without knowing what the image carries.
- **Install Trivy with Homebrew.** Rejected: the same result, with a change to the machine.

**Consequences.** The scan is a point-in-time observation, not a gate. Whether to make it one in
CI is a finding for the remediation tracker, not a decision made here.

---

## D-03 — GitHub's repository settings are graded as they are on the audited date

- **Status:** Accepted
- **Date:** 2026-11-28
- **Confirmed by:** the owner, at plan approval (#217)

**Context.** On 2026-11-28 the repository's secret scanning, push protection, validity checks and
Dependabot security updates are `disabled`, read through `gh api repos/dimaszisby/lakira-frontend`.
Private vulnerability reporting was switched on the same day (#216).

**Decision.** The run grades the settings as found. Each one that is off becomes a finding with a
remediation row owned by the repository owner. They are not switched on before the run.

**Options considered.**

- **Switch them on first, and grade them in place.** Rejected: the baseline would record a state
  that held for an hour, and the finding that they were off for the repository's whole life would
  go unrecorded.

**Consequences.** The findings log carries repository-setting findings that the owner can close in
minutes. The remediation tracker records when each was switched on.
