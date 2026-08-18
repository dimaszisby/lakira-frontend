#!/bin/bash
# Project convenience: formats files after Claude edits them.
# Always exits 0 — formatting failures must never block a write.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

REL_PATH="${FILE_PATH#"$CLAUDE_PROJECT_DIR"/}"

# Never touch agent config or memory. The backend hit a bug where the formatter
# re-injected frontmatter into agent-memory files on every write.
case "$REL_PATH" in
  .claude/*) exit 0 ;;
esac

PRETTIER="$CLAUDE_PROJECT_DIR/node_modules/.bin/prettier"
STYLELINT="$CLAUDE_PROJECT_DIR/node_modules/.bin/stylelint"

case "$FILE_PATH" in
  *.ts | *.tsx | *.js | *.jsx | *.mjs | *.json | *.md | *.yml | *.yaml)
    [ -x "$PRETTIER" ] && "$PRETTIER" --write "$FILE_PATH" >/dev/null 2>&1
    ;;
  *.css | *.pcss)
    # This repo gates CSS separately (npm run lint:css), so fix it here too.
    [ -x "$STYLELINT" ] && "$STYLELINT" --fix "$FILE_PATH" >/dev/null 2>&1
    [ -x "$PRETTIER" ] && "$PRETTIER" --write "$FILE_PATH" >/dev/null 2>&1
    ;;
esac

exit 0
