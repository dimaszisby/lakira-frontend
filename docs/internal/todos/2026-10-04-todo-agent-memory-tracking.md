# 2026-10-04 - Todo: track agent memory as heuristics

**Context:** `.claude/agent-memory/` appeared on 2026-09-30, when the `code-reviewer` agent first
wrote to it during the review of #62. It was neither tracked nor ignored, so it showed in every
`git status` and made `gh pr create` warn about an uncommitted change. Three of the four agent
definitions tell agents to write there, so it would have kept growing.

The notes also recorded the wrong thing. Each repeated the review's findings and only the closing
"How to apply" paragraph was new. Tracking was approved on 2026-09-30, for after the audit split
(#64).

## Checklist

- [x] The three notes in `.claude/agent-memory/code-reviewer/` trimmed to frontmatter, one line
      with the verdict and the PR, and the "How to apply" paragraph unchanged
- [x] `.claude/agents/code-reviewer.md`, `test-writer.md`, `ci-debugger.md`: memory records the
      heuristic and a pointer, not the findings
- [x] `.claude/agents/doc-writer.md`: gains the same instruction; it had `memory: project` and no
      instruction
- [x] `.claude/rules/workflow.md` § Self-improvement loop: agent memory is tracked, reviewed in
      the PR, and promoted or deleted like a lesson
- [x] `.claude/lessons.md`: the 2026-10-01 lesson about calling a finished run stuck
- [x] Gates, with `api:spec:check` and `security:audit` re-run right before handover

## Status

Done 2026-10-04 on `chore/agent-memory-tracking`.

- The three review notes went from 13 to 15 lines each to 10. Their "How to apply" paragraphs are
  unchanged, checked by diffing each against the original. The removed findings were acted on in
  #62, #64 and #65; the notes were the only place the unedited lists were written down.
- All four agent definitions now ask for the heuristic and a pointer. The `code-reviewer` one
  says outright not to copy findings in.
- `.gitignore`, `.prettierignore` and `.claude/hooks/format-on-edit.sh` are unchanged. The last
  two already skip `.claude/`, so Prettier does not reformat the notes.
- gitleaks, run locally over `.claude/agent-memory/`, found no leaks. CI's Secret Scan covers the
  full history on the PR.
