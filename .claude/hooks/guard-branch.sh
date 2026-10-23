#!/bin/bash
# Project guardrail: keeps edits off main, nudges toward feature branches on dev.
# Exit 0 = allow, Exit 2 = block (reason via stderr)
#
# dev has a server-side ruleset since 2026-10-22 (ADR-0039) and main since 2026-10-23
# (ADR-0041). This hook keeps an agent from editing on main at all.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

BRANCH=$(git -C "$CLAUDE_PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)

if [ -z "$BRANCH" ] || [ "$BRANCH" = "HEAD" ]; then
  exit 0
fi

case "$BRANCH" in
  main)
    echo "Blocked: you are on 'main'. Branch off dev first: git switch dev && git switch -c feat/<slug>" >&2
    exit 2
    ;;
  dev)
    echo "Note: editing directly on 'dev'. Consider 'git switch -c feat/<slug>' so this work lands via a PR." >&2
    exit 0
    ;;
esac

exit 0
