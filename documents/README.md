# Documents Index

This is the entry point for all project documentation.

Use this index to quickly find:

1. Long-lived standards/specifications
2. Time-bound implementation plans and logs
3. Operational references (security, incidents, API, checklists)

---

## 1. Where Should a New Doc Go?

Use this rule first:

1. If it is a durable engineering standard, place it under `documents/documentation/`.
2. If it is execution tracking for a rollout/migration, place it under the relevant domain folder.

Reference:

- `documents/documentation/dev-documentation-guidelines.md`

---

## 2. Standards (Long-Lived)

Primary standards live in `documents/documentation/`.

Key entrypoints:

- Documentation system rules:
  - `documents/documentation/dev-documentation-guidelines.md`
- Engineering standards:
  - `documents/documentation/engineering/components/README.md`
- Accessibility baseline:
  - `documents/documentation/accessibility-guidelines.md`
- Performance baseline:
  - `documents/documentation/performance-budget.md`
- Style system:
  - `documents/documentation/style/color-palette.md`
  - `documents/documentation/style/typography.md`
- Product reference:
  - `documents/documentation/product/lakira-frontend-prd.md`

---

## 3. Initiative and Execution Docs (Time-Bound)

Use these folders for active implementation work:

- Testing plans/logs:
  - `documents/tests-plans-and-logs/`
  - Start here: `documents/tests-plans-and-logs/TESTING_STRATEGY.md`
- Development plans/audits:
  - `documents/development/`
- CI/CD initiatives:
  - `documents/ci-cd/`
- Task backlogs:
  - `documents/todos/`

---

## 4. Operations and Governance

- Release and implementation checklists:
  - `documents/checklists/`
- Incidents:
  - `documents/incidents/`
- Security audits:
  - `documents/security/`
- Code review references:
  - `documents/code-review/`

---

## 5. API and Backend References

- OpenAPI artifacts:
  - `documents/openapi/`
- Backend analysis/supporting references:
  - `documents/backend-references/`

---

## 6. Quick Conventions

- Use kebab-case file names where practical.
- Prefer `README.md` as the entry file for each topic folder.
- Cross-link using repo-root-relative paths in Markdown.
- Keep plan/checklist/decision docs updated as implementation changes.
