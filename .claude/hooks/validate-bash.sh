#!/bin/bash
# Project guardrail: blocks shell commands this repo reserves for the user.
# Exit 0 = allow, Exit 2 = block (reason via stderr)
#
# The global hook (~/.claude/hooks/validate-bash.sh) already blocks npm publish,
# force-push, 'git reset --hard', 'git clean -f', DROP TABLE/DATABASE and broad
# 'rm -rf'. Do not re-implement those here.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# --- Block: blanket staging ---
# Explicit paths only. A blanket add stages whatever happens to be untracked.
if echo "$COMMAND" | grep -qE 'git\s+add\s+(-A|--all|\.\s*$|\.\s*&&|"\."|'"'"'\.'"'"')'; then
  echo "Blocked: 'git add -A' / 'git add .' stages everything untracked. Add files explicitly." >&2
  exit 2
fi

# --- Block: history-writing git operations (reserved for the user) ---
# Backstop behind the settings.json deny list; catches chained and quoted forms.
if echo "$COMMAND" | grep -qE '(^|\s|&&|\||;)git\s+(commit|push|merge|rebase|cherry-pick|revert)(\s|$)'; then
  echo "Blocked: commit/push/merge/rebase are the user's to run. Surface the exact command instead (see .claude/rules/workflow.md)." >&2
  exit 2
fi

# --- Block: PR and release operations (reserved for the user) ---
if echo "$COMMAND" | grep -qE '(^|\s|&&|\||;)gh\s+pr\s+(create|merge|close|ready|edit)(\s|$)'; then
  echo "Blocked: opening/merging PRs is the user's action. Provide the PR title and body instead." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qE '(^|\s|&&|\||;)gh\s+release\s+'; then
  echo "Blocked: releases are the user's action." >&2
  exit 2
fi

# --- Block: deploys ---
if echo "$COMMAND" | grep -qE '(^|\s|&&|\||;)(npx\s+)?vercel(\s|$)'; then
  echo "Blocked: deploys run through the Vercel Git integration, not the CLI." >&2
  exit 2
fi

# --- Block: switching onto main ---
if echo "$COMMAND" | grep -qE 'git\s+(checkout|switch)\s+(main|origin/main)(\s|$)'; then
  echo "Blocked: work happens on 'dev' or a feature branch off it. Switching to main is the user's call." >&2
  exit 2
fi

exit 0
