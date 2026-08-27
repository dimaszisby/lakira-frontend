#!/usr/bin/env bash
# bootstrap-fork.sh — rename this repo for a new project.
#
# Usage:
#   ./scripts/bootstrap-fork.sh --name my-app
#   ./scripts/bootstrap-fork.sh --name my-app --keep-internal
#   ./scripts/bootstrap-fork.sh --name my-app --dry-run
#
# What it does:
#   1. Rewrites brand tokens across every git-tracked text file. The current
#      brand is named only in the UPSTREAM_* variables below; everything else
#      derives from them:
#        <package>       -> <new-name>          <short>_token -> <short>_token
#        <short>-backend -> <short>-backend     <short>.theme -> <short>.theme
#        <SHORT>_*       -> <SHORT>_*           <Display>     -> <Display>
#        <owner>         -> your-org
#   2. Renames the two brand-named generated artifacts and their references.
#   3. Creates .env.local from .env.example when absent.
#   4. Removes docs/internal/ (upstream working material); --keep-internal opts out.
#   5. Drops FORKED-FROM.md with the upstream commit SHA, preserving an existing
#      one so the original fork point is never overwritten.
#   6. Re-points the UPSTREAM_* variables below at the new brand, so forking a
#      fork works and re-running with the same name is a no-op.
#
# LICENSE is deliberately NOT rewritten. The ISC licence requires the original
# copyright notice to be retained in copies. Add your own notice alongside it;
# do not replace it.
#
# The script is idempotent: running it twice with the same name is a no-op.

set -euo pipefail

NEW_NAME=""
KEEP_INTERNAL=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)           NEW_NAME="${2:-}"; shift 2 ;;
    --keep-internal)  KEEP_INTERNAL=true; shift ;;
    --dry-run)        DRY_RUN=true; shift ;;
    -h|--help)
      sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 --name <new-app-name> [--keep-internal] [--dry-run]" >&2
      exit 1 ;;
  esac
done

if [[ -z "$NEW_NAME" ]]; then
  echo "Error: --name is required." >&2
  echo "Usage: $0 --name <new-app-name> [--keep-internal] [--dry-run]" >&2
  exit 1
fi

# Reject anything that is not a safe slug. Prevents sed-delimiter injection
# (names containing '/' or '|') and downstream shell-quoting hazards.
if ! [[ "$NEW_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Error: --name must match ^[a-z][a-z0-9-]*\$ (lowercase letters, digits," >&2
  echo "hyphens; must start with a letter). Got: '$NEW_NAME'" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ ! -d .git ]]; then
  echo "Error: $REPO_ROOT is not a git repository." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Upstream identity. These five lines are the ONLY place the current brand is
# named. A successful run rewrites them in place, so forking a fork works and
# a re-run with the same name is a true no-op.
# ---------------------------------------------------------------------------
UPSTREAM_PACKAGE="lakira-frontend"
UPSTREAM_SHORT="lakira"
UPSTREAM_DISPLAY="Lakira"
UPSTREAM_OWNER="dimaszisby"

if [[ "$UPSTREAM_PACKAGE" == "$NEW_NAME" ]]; then
  echo "Already named '$NEW_NAME' — nothing to do."
  exit 0
fi

# Derive the short name by stripping a trailing surface suffix.
SHORT_NAME="$NEW_NAME"
for suffix in -frontend -front -web -app -ui -client; do
  SHORT_NAME="${SHORT_NAME%"$suffix"}"
done
DISPLAY_NAME="$(printf '%s' "${SHORT_NAME:0:1}" | tr '[:lower:]' '[:upper:]')${SHORT_NAME:1}"
UPPER_NAME="$(printf '%s' "$SHORT_NAME" | tr '[:lower:]-' '[:upper:]_')"

# Portable in-place sed: BSD (macOS) needs an explicit empty suffix, GNU must not have one.
if sed --version >/dev/null 2>&1; then
  sed_inplace() { sed -i "$@"; }
else
  sed_inplace() { sed -i '' "$@"; }
fi

echo "Forking this repo:"
echo "  package name : $NEW_NAME"
echo "  short name   : $SHORT_NAME"
echo "  display name : $DISPLAY_NAME"
echo "  env prefix   : ${UPPER_NAME}_"
$DRY_RUN && echo "  MODE         : dry run (no files will be changed)"
echo

# ---------------------------------------------------------------------------
# 1. Rewrite brand tokens across tracked text files
# ---------------------------------------------------------------------------
# Order matters: most specific token first, the bare short name last.
UPSTREAM_UPPER="$(printf '%s' "$UPSTREAM_SHORT" | tr '[:lower:]-' '[:upper:]_')"

EXPRESSIONS=(
  "s|${UPSTREAM_PACKAGE}|${NEW_NAME}|g"
  "s|${UPSTREAM_SHORT}-backend|${SHORT_NAME}-backend|g"
  "s|${UPSTREAM_SHORT}_token|${SHORT_NAME}_token|g"
  "s|${UPSTREAM_SHORT}\.theme|${SHORT_NAME}.theme|g"
  "s|${UPSTREAM_UPPER}_|${UPPER_NAME}_|g"
  "s|${UPSTREAM_OWNER}|your-org|g"
  "s|${UPSTREAM_DISPLAY}|${DISPLAY_NAME}|g"
  "s|${UPSTREAM_SHORT}|${SHORT_NAME}|g"
)

SED_ARGS=()
for e in "${EXPRESSIONS[@]}"; do SED_ARGS+=(-e "$e"); done

changed=0
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  case "$f" in
    LICENSE) continue ;;                        # ISC: retain the original notice
    scripts/bootstrap-fork.sh) continue ;;      # rewritten explicitly at the end
    FORKED-FROM.md) continue ;;                 # provenance record; never rewritten
    *.ico|*.png|*.jpg|*.jpeg|*.gif|*.webp|*.woff|*.woff2|*.ttf|*.mp4) continue ;;
  esac
  grep -Iq . "$f" 2>/dev/null || continue       # skip binary
  grep -qF -e "$UPSTREAM_SHORT" -e "$UPSTREAM_OWNER" "$f" 2>/dev/null ||
    grep -qF "$UPSTREAM_DISPLAY" "$f" 2>/dev/null || continue
  changed=$((changed + 1))
  if $DRY_RUN; then
    echo "  would rewrite: $f"
  else
    sed_inplace "${SED_ARGS[@]}" "$f"
  fi
done < <(git ls-files)

echo "Rewrote brand tokens in $changed file(s)."

# ---------------------------------------------------------------------------
# 2. Rename the brand-named generated artifacts
# ---------------------------------------------------------------------------
rename_if_present() {
  local from="$1" to="$2"
  [[ -e "$from" ]] || return 0
  [[ "$from" == "$to" ]] && return 0
  if $DRY_RUN; then
    echo "  would rename: $from -> $to"
  else
    git mv -f "$from" "$to" 2>/dev/null || mv -f "$from" "$to"
    echo "Renamed $from -> $to"
  fi
}

rename_if_present "docs/reference/api/${UPSTREAM_SHORT}-backend-openapi.json" \
                  "docs/reference/api/${SHORT_NAME}-backend-openapi.json"
rename_if_present "src/types/api/generated/${UPSTREAM_SHORT}-backend.d.ts" \
                  "src/types/api/generated/${SHORT_NAME}-backend.d.ts"

# ---------------------------------------------------------------------------
# 3. Create .env.local from the template
# ---------------------------------------------------------------------------
if $DRY_RUN; then
  [[ -f .env.local ]] || echo "  would create: .env.local from .env.example"
elif [[ -f .env.local ]]; then
  echo ".env.local already exists — left untouched."
elif [[ -f .env.example ]]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example."
else
  echo "WARNING: no .env.example found — .env.local not created." >&2
fi

# ---------------------------------------------------------------------------
# 4. Remove upstream working material
# ---------------------------------------------------------------------------
if $KEEP_INTERNAL; then
  echo "Kept docs/internal/ (--keep-internal)."
elif $DRY_RUN; then
  echo "  would remove: docs/internal/"
elif [[ -d docs/internal ]]; then
  rm -rf docs/internal
  echo "Removed docs/internal/ (upstream working material)."
fi

# ---------------------------------------------------------------------------
# 5. Record the fork point
# ---------------------------------------------------------------------------
UPSTREAM_SHA="$(git rev-parse HEAD)"
UPSTREAM_DATE="$(date -u +%Y-%m-%d)"
if $DRY_RUN; then
  echo "  would write: FORKED-FROM.md (upstream $UPSTREAM_SHA)"
elif [[ -f FORKED-FROM.md ]]; then
  echo "FORKED-FROM.md already exists — left untouched (it records the original fork point)."
else
  cat > FORKED-FROM.md <<EOF
# Forked from ${UPSTREAM_PACKAGE}

This repository was created with \`scripts/bootstrap-fork.sh --name ${NEW_NAME}\`.

- **Upstream:** https://github.com/${UPSTREAM_OWNER}/${UPSTREAM_PACKAGE}
- **Upstream commit:** \`${UPSTREAM_SHA}\`
- **Forked on:** ${UPSTREAM_DATE}

Read \`SAAS-BASE-CHECKLIST.md\` for the readiness verdict at the fork point and the
known gaps this fork inherits.

The ISC licence in \`LICENSE\` retains the original copyright notice, as it requires.
Add your own notice alongside it rather than replacing it.
EOF
  echo "Wrote FORKED-FROM.md."
fi

# ---------------------------------------------------------------------------
# 6. Re-point this script's own upstream identity at the new brand
# ---------------------------------------------------------------------------
if ! $DRY_RUN; then
  sed_inplace \
    -e "s|^UPSTREAM_PACKAGE=\".*\"|UPSTREAM_PACKAGE=\"${NEW_NAME}\"|" \
    -e "s|^UPSTREAM_SHORT=\".*\"|UPSTREAM_SHORT=\"${SHORT_NAME}\"|" \
    -e "s|^UPSTREAM_DISPLAY=\".*\"|UPSTREAM_DISPLAY=\"${DISPLAY_NAME}\"|" \
    -e "s|^UPSTREAM_OWNER=\".*\"|UPSTREAM_OWNER=\"your-org\"|" \
    "$REPO_ROOT/scripts/bootstrap-fork.sh"
  echo "Re-pointed scripts/bootstrap-fork.sh at '${NEW_NAME}'."
fi

echo
echo "Done."
$DRY_RUN && { echo "Dry run — nothing was changed."; exit 0; }
cat <<EOF

Next steps — these are NOT automated, and the repo will not build until they are done:

  1. Repoint the API contract at your own backend. The sync script now defaults to
     https://raw.githubusercontent.com/your-org/${SHORT_NAME}-backend/... which does
     not exist. Set ${UPPER_NAME}_OPENAPI_URL (or ${UPPER_NAME}_BACKEND_PATH for a
     local checkout) in .env.local, then run:
         npm run api:spec:sync && npm run api:types:generate

  2. Edit .env.local — API_URL and NEXT_PUBLIC_API_BASE_URL both point at localhost:4000.

  3. Reinstall and verify:
         npm ci
         npm run lint && npm run typecheck && npm run test:unit && npm run build

  4. Renaming the session cookie to ${SHORT_NAME}_token invalidates any existing
     session. That is expected on a fresh fork.

EOF
