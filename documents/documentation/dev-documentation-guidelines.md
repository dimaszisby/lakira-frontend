# Dev Documentation Guidelines (Frontend)

This guide defines a predictable, portfolio-grade documentation system for this frontend codebase.

It uses a two-track model:

1. Standards docs (long-lived engineering rules and specs)
2. Initiative kits (time-bound execution and rollout artifacts)

---

## Purpose and Scope

- Ensure contributors know which document answers which question.
- Capture the lifecycle of work: context -> plan -> execution -> decisions/incidents -> outcome.
- Keep artifacts versioned in Markdown for reviewability and traceability.

---

## Canonical Placement

### 1) Standards Docs (long-lived)

Use `documents/documentation/` for stable standards:

- `documents/documentation/engineering/` for engineering standards
- `documents/documentation/style/` for design tokens and visual rules
- `documents/documentation/architecture/` for architectural constraints
- `documents/documentation/product/` for product-level reference docs

Examples:

- `documents/documentation/engineering/components/README.md`
- `documents/documentation/accessibility-guidelines.md`
- `documents/documentation/performance-budget.md`

### 2) Initiative Kits (time-bound execution)

Use domain folders for active rollout work:

- `documents/tests-plans-and-logs/` for testing programs
- `documents/development/` for implementation plans/audits
- `documents/ci-cd/` for pipeline/process initiatives
- `documents/security/` and `documents/incidents/` for security/incident artifacts

Rule:

- If content is a durable standard, place it in `documents/documentation/`.
- If content tracks execution of a temporary initiative, place it in domain execution folders.

---

## Core Principles

1. Docs-as-code: reviewed via PR, small diffs, frequent updates.
2. Single source: avoid duplicated truth; link across folders instead.
3. Traceability: decisions/incidents reference PRs, scripts, tests, or issues.
4. Audience-aware: every doc starts with purpose, owner/DRI, and entrypoints.
5. Industry-standard structure: use clear sections like Context, Scope, Risks, Rollback, Decision.
6. Frontend quality lens: docs should cover accessibility, responsiveness, and performance impact where relevant.

---

## Recommended Documentation Modes

### Mode A: Standards Spec (default for frontend rules)

Use for topics like components, accessibility, styling, performance budgets.

Minimum files:

- `README.md` (index and navigation)
- One or more focused spec docs (`<topic>-guidelines.md`, decision matrix, scorecard)

### Mode B: Initiative Kit (default for migrations/rollouts)

Use for multi-step execution topics (tests overhaul, routing migration, CI hardening).

Minimum files:

- `README.md`
- `<topic>-plan.md`
- `<topic>-checklist.md`
- `decisions.md`

Optional files:

- `<topic>-ticket.md`
- `incidents.md`
- `metrics-tracker.md`

Recommendation:

- Prefer Mode A for standards and portfolio-facing technical depth.
- Use Mode B only when work is execution-heavy and time-bound.

---

## Frontend-Specific Required Sections

For frontend standards docs, include these sections when applicable:

1. Accessibility contract
   - Semantic roles, keyboard flow, focus behavior, ARIA expectations
2. Responsive behavior
   - Mobile/tablet/desktop rules and edge cases
3. Visual states matrix
   - Default, hover, active, focus-visible, disabled, loading, error
4. Performance considerations
   - Bundle impact, client/server boundary implications, rendering cost
5. Testing expectations
   - Unit/integration/e2e/a11y expectations per component/pattern

---

## Right-Sizing Initiative Kits

- Full kit: README + plan + checklist + ticket + decisions + incidents + metrics
  Use for multi-week initiatives with cross-domain impact.
- Standard kit: README + plan + checklist + decisions
  Use for medium efforts (around 2-5 days).
- Lean kit: README + checklist + decision entry
  Use for quick sweeps (<2 days).

Even for small changes:

- Log at least one decision entry with PR/commit reference.

---

## File Naming and Linking

- Use kebab-case (`next-router-audit.md`, `component-review-scorecard.md`).
- Keep filenames purpose-revealing and grep-friendly.
- Cross-link using repo-root-relative paths for portability.

Good examples:

- `[Testing Strategy](documents/tests-plans-and-logs/TESTING_STRATEGY.md)`
- `[Component Guidelines](documents/documentation/engineering/components/README.md)`

---

## Workflow for New Topics

1. Create folder skeleton

```bash
mkdir -p documents/<domain>/<topic>
touch documents/<domain>/<topic>/{README.md,<topic>-plan.md,<topic>-checklist.md,decisions.md}
```

2. Write README first so others understand intent immediately.
3. Draft plan/checklist with measurable acceptance criteria.
4. Link related issue tracker item (if available).
5. Maintain checklist with commit/PR references.
6. Log decisions/incidents immediately with references.
7. Mention docs updates in PR description.

---

## Maintenance Expectations

- Update docs when behavior/scope changes; avoid stale instructions.
- Keep checklist states honest and current.
- Use ADR statuses (`Proposed`, `Accepted`, `Superseded`) in decision logs.
- Close incident loops with follow-up links.
- Mark deprecated docs explicitly and link successors.

Cadence:

- After each merge batch: refresh checklist and impacted README sections.
- Weekly: review stale tasks/open questions.
- Monthly or major release: audit incidents and metrics relevance.

---

## Templates

Use these lightweight templates as starters.

### Standards README Template

```md
# <Topic Name>

## Purpose

- Why this standard exists
- Owner/DRI

## Scope

- In Scope
- Out of Scope

## Standards

- Rule set and rationale

## Verification

- How compliance is checked (lint/tests/review checklist)

## References

- Related docs and external sources
```

### Initiative Plan Template

```md
# <Topic> Plan

## Context and Goals

- ...

## Phases and Milestones

1. Phase 0 - ...
2. Phase 1 - ...

## Success Criteria

- KPI/SLO/quality targets

## Risks and Mitigations

- ...
```

### Checklist Template

```md
# <Topic> Checklist

## Phase 0 - ...

- [ ] Task - owner (target date)
- [x] Completed task - PR/commit reference
```

### Decision Log Entry

```md
## ADR-001 - <Decision Title> (Accepted YYYY-MM-DD)

Context: ...

Decision: ...

Options considered: ...

Consequences: ...
```

### Incident Log Entry

```md
## Incident YYYY-MM-DD - <Title>

- Impact: ...
- Detected by: ...
- Commit/PR: `<ref>`
- Root cause: ...
- Mitigation: ...
- Follow-up actions: ...
```

### Frontend Metrics Tracker Example

```md
| Metric             | Target   | Baseline | Current | Owner | Next Action                          |
| ------------------ | -------- | -------- | ------- | ----- | ------------------------------------ |
| LCP p75            | <= 2.5s  | 2.9s     | 2.6s    | @you  | Optimize hero image loading          |
| INP p75            | <= 200ms | 240ms    | 210ms   | @you  | Reduce dashboard interaction work    |
| Route JS (metrics) | <= 220kB | 245kB    | 228kB   | @you  | Split heavy chart chunk              |
| A11y score         | >= 90    | 84       | 91      | @you  | Maintain checks in release checklist |
```

---

Following this guide keeps frontend docs consistent, auditable, and portfolio-worthy while matching the actual repo structure and engineering workflow.
